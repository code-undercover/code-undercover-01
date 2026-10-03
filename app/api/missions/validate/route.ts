import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { executeCode } from '@/lib/compiler'
import { detectInnovation, getGradingCases, gradeMissionRuns } from '@/lib/validation/missionValidator'
import { canAccessMission } from '@/services/mission.service'
import { staleSessionResponse } from '@/lib/session'
import { missionValidateLimiter } from '@/lib/rate-limit'
import {
    AURA_MISSION_COMPLETE,
    AURA_FIRST_ATTEMPT,
    AURA_FOX_INNOVATION,
    AURA_CORRECT_EXECUTION,
    AURA_HINT_PENALTY,
    calculateAuraLevel
} from '@/lib/aura'

interface ValidationRules {
    requiredKeywords?: string[]
    requiredPatterns?: string[]
    forbiddenPatterns?: string[]
    minLength?: number
    requireCustomFunction?: boolean
    description?: string
    testCases?: { input: string; output: string }[]
    requiredOutput?: string
}




function validateCodeAgainstSyntaxRules(
    code: string,
    rules: ValidationRules
): { passed: boolean; failures: string[] } {
    const failures: string[] = []

    // Minimum code length check — prevents trivially short / empty submissions
    if (rules.minLength && code.trim().length < rules.minLength) {
        failures.push(`Your code must be at least ${rules.minLength} characters long. Keep working!`)
    }

    // Starter code still sitting in the submission. These are literal comment
    // strings, not regexes, so a substring test is the correct comparison.
    for (const pattern of rules.forbiddenPatterns ?? []) {
        if (pattern && code.includes(pattern)) {
            failures.push('You have not removed the starter code comments yet. Please delete them before submitting.')
            break
        }
    }

    return { passed: failures.length === 0, failures }
}


function getComboBonus(streak: number): number {
    if (streak === 1) return 10
    if (streak === 2) return 20
    if (streak === 3) return 40
    if (streak === 4) return 70
    if (streak >= 5) return 100
    return 0
}


export async function POST(req: Request) {
    try {
        // Parse request body and authenticate in parallel
        const [session, body] = await Promise.all([
            getServerSession(authOptions),
            req.json(),
        ])

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rate = await missionValidateLimiter.check(session.user.id)
        if (!rate.success) {
            return NextResponse.json(
                { error: `Too many attempts. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.` },
                { status: 429 }
            )
        }

        const { missionId, code, input = "" } = body
        if (!missionId || typeof missionId !== 'string' || !code || typeof code !== 'string' || code.length > 10000) {
            return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
        }
        if (typeof input !== 'string' || input.length > 5000) {
            return NextResponse.json({ error: 'Input exceeds length limits' }, { status: 400 })
        }

        // 🔒 Access check — must happen before any DB writes or validation logic
        const hasAccess = await canAccessMission(session.user.id, missionId)
        if (!hasAccess) {
            return NextResponse.json({ error: 'You do not have access to this mission' }, { status: 403 })
        }

        // Mission and user first — the UserMission upsert below is keyed on both,
        // so running it alongside them (as this once did) let it trip its foreign
        // key before the guard could answer, turning a missing account into a 500.
        const [mission, user] = await Promise.all([
            db.mission.findUnique({ where: { id: missionId } }),
            db.user.findUnique({ where: { id: session.user.id } }),
        ])

        // A JWT outlives the row it names once an account is deleted or the
        // database is reseeded. That is a stale session, not a missing mission.
        if (!user) {
            return staleSessionResponse()
        }

        if (!mission) {
            return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
        }

        // Checked before any write: a mission with no grading key used to pass
        // every compiling submission, and must not touch the agent's streak.
        const gradingCases = getGradingCases(mission.order, input)
        if (!gradingCases) {
            console.error(`[VALIDATE] Mission ${mission.order} has no grading key`)
            return NextResponse.json({ error: 'This mission cannot be graded right now.' }, { status: 500 })
        }

        const userMission = await db.userMission.upsert({
            where: { userId_missionId: { userId: user.id, missionId } },
            update: {},
            create: {
                userId: user.id,
                missionId,
                status: 'ACTIVE',
                startedAt: new Date(),
            }
        })

        const isFirstTimeCompletion = userMission.status !== 'COMPLETED'

        // Atomic and awaited: the old read-modify-write plus fire-and-forget
        // could drop increments under concurrency, which both undercounted
        // attempts and skewed the first-attempt bonus below.
        try {
            await db.userMission.update({
                where: { id: userMission.id },
                data: { attemptCount: { increment: 1 } },
            })
        } catch (e) {
            console.error('[VALIDATE] attemptCount update failed:', e)
        }

        const rules: ValidationRules = mission.validationRules
            ? JSON.parse(mission.validationRules)
            : {}

        let newComboStreak = user.comboStreak
        let comboBonusAura = 0

        // 1. Static Validation
        const syntaxCheck = validateCodeAgainstSyntaxRules(code, rules)

        if (!syntaxCheck.passed) {
            if (isFirstTimeCompletion) {
                // Combo Breaks
                await db.user.update({ where: { id: user.id }, data: { comboStreak: 0 } })
            }
            return NextResponse.json({
                success: false,
                stdout: "",
                stderr: "",
                validationErrors: syntaxCheck.failures,
                ruleDescription: rules.description,
                comboBonus: 0,
                comboStreak: isFirstTimeCompletion ? 0 : user.comboStreak
            })
        }

        // 2. Compile & Run — syntax check only, no output matching
        const runRes = await executeCode(code, input)
        const totalExecutionTimeMs = runRes.executionTimeMs || 0
        const finalStdout = runRes.output || ""

        // A judge outage is not the agent's fault. Report it as its own state
        // and leave the combo streak alone — breaking a streak over an
        // infrastructure failure punishes the wrong person.
        const judgeUnavailable = (explanation?: string) => NextResponse.json({
            success: false,
            serviceUnavailable: true,
            stdout: "",
            stderr: "",
            validationErrors: [],
            explanation,
            comboBonus: 0,
            comboStreak: user.comboStreak
        })

        if (!runRes.success) {
            // Compilation error, runtime crash, or compiler service issue
            const errorDetail = runRes.compilerError || runRes.errors || "Execution failed"

            if (runRes.serviceUnavailable) {
                return judgeUnavailable(runRes.errors)
            }

            if (isFirstTimeCompletion) {
                await db.user.update({ where: { id: user.id }, data: { comboStreak: 0 } })
            }

            const validationMsg = runRes.compilerError
                ? "Compilation failed. Fix your syntax errors."
                : runRes.errors || "Execution failed."

            return NextResponse.json({
                success: false,
                stdout: "",
                stderr: errorDetail,
                diagnostics: runRes.diagnostics,
                explanation: runRes.explanation,
                validationErrors: [validationMsg],
                comboBonus: 0,
                comboStreak: isFirstTimeCompletion ? 0 : user.comboStreak
            })
        }

        // Warnings that did not block the build. The compiler collects these,
        // but until now nothing forwarded them, so an agent whose program ran
        // never learned it had e.g. an uninitialised variable.
        const compilerWarnings = (runRes.diagnostics ?? []).filter(d => d.type !== 'error')

        // 3. Strict Output Validation against secure backend data. The run
        // above only produced what the agent sees; grading reruns every
        // authored case. executeCode caches by (code, input), so a case
        // matching the agent's own input costs no second judge call.
        const caseRuns = await Promise.all(gradingCases.map((c) => executeCode(code, c.input)))
        const unavailableRun = caseRuns.find((r) => r.serviceUnavailable)
        if (unavailableRun) {
            return judgeUnavailable(unavailableRun.errors)
        }

        const validationResult = gradeMissionRuns(gradingCases, caseRuns)

        if (!validationResult.isCorrect) {
            // Combo breaks on incorrect output
            if (isFirstTimeCompletion) {
                await db.user.update({ where: { id: user.id }, data: { comboStreak: 0 } })
            }

            return NextResponse.json({
                success: false,
                stdout: finalStdout,
                stderr: "",
                warnings: compilerWarnings,
                validationErrors: [validationResult.feedbackMessage || "Output validation failed. Please check your implementation."],
                comboBonus: 0,
                comboStreak: isFirstTimeCompletion ? 0 : user.comboStreak
            })
        }

        // Code compiled, executed, and output validated successfully — mission passes!

        // 3. Success! Calculate Rewards and Combos
        const usedHints = userMission.hintsUsed > 0

        let isInnovation = false
        let innovationReason = ""

        if (!userMission.innovationUnlocked) {
            const innovationResult = detectInnovation(code, mission.title)
            if (innovationResult.innovationUnlocked) {
                isInnovation = true
                innovationReason = innovationResult.innovationReason
            }
        }

        // Compute potential rewards as if it were a first-time completion
        const potentialRewards = {
            baseAura: mission.auraReward || AURA_MISSION_COMPLETE,
            executionAura: AURA_CORRECT_EXECUTION,
            firstAttemptBonus: userMission.attemptCount === 0 ? AURA_FIRST_ATTEMPT : 0,
            innovationAura: isInnovation ? AURA_FOX_INNOVATION : 0,
        }

        // Actual rewards are settled inside the transaction below, once the
        // completion claim decides whether this really was the first pass.
        let earnedAura = 0
        let awardedFoxBadge = false

        // 4. Settle rewards in a transaction that owns the completion claim.
        //
        // The user row was read before Judge0 ran, so it is seconds stale by now.
        // Reading it inside this transaction under Serializable isolation is what
        // makes the absolute write below safe; the claim is what stops two
        // concurrent submissions both being treated as the first completion.
        //
        // Serializable can still abort the loser of a concurrent write on the same
        // user row (Prisma P2034), which is exactly the double-submit case this
        // guards. Retrying re-runs the claim, so a retry can only settle it once.
        let rewardedAsFirstTime = isFirstTimeCompletion

        for (let attempt = 0; ; attempt++) {
            try {
                await db.$transaction(async (tx) => {
                    const claimed = await tx.userMission.updateMany({
                        where: { id: userMission.id, status: { not: 'COMPLETED' } },
                        data: {
                            status: 'COMPLETED',
                            completedAt: new Date(),
                            submittedCode: code,
                            innovationUnlocked: isInnovation ? true : undefined,
                        },
                    })

                    rewardedAsFirstTime = claimed.count === 1

                    const freshUser = await tx.user.findUnique({
                        where: { id: user.id },
                        select: { auraPoints: true, comboStreak: true, maxCombo: true },
                    })
                    if (!freshUser) return

                    if (rewardedAsFirstTime) {
                        // A hint used anywhere on this mission breaks the streak.
                        newComboStreak = usedHints ? 0 : freshUser.comboStreak + 1
                        comboBonusAura = usedHints ? 0 : getComboBonus(newComboStreak)
                    } else {
                        newComboStreak = freshUser.comboStreak
                        comboBonusAura = 0
                    }

                    // The badge is one-shot. detectInnovation ran against the
                    // pre-transaction row, so the losing request of a double
                    // submit still thinks it innovated; only the request that won
                    // the claim may mint the badge.
                    awardedFoxBadge = rewardedAsFirstTime && isInnovation

                    earnedAura = rewardedAsFirstTime
                        ? Math.max(
                            10,
                            potentialRewards.baseAura +
                            potentialRewards.executionAura +
                            potentialRewards.firstAttemptBonus +
                            potentialRewards.innovationAura +
                            comboBonusAura -
                            (userMission.hintsUsed * AURA_HINT_PENALTY)
                        )
                        : 0

                    if (earnedAura > 0 || awardedFoxBadge || rewardedAsFirstTime || newComboStreak !== freshUser.comboStreak) {
                        const newAuraPoints = freshUser.auraPoints + earnedAura

                        await tx.user.update({
                            where: { id: user.id },
                            data: {
                                auraPoints: newAuraPoints,
                                auraLevel: calculateAuraLevel(newAuraPoints),
                                comboStreak: newComboStreak,
                                maxCombo: Math.max(freshUser.maxCombo, newComboStreak),
                                foxBadges: awardedFoxBadge ? { increment: 1 } : undefined,
                                missionsCompleted: rewardedAsFirstTime ? { increment: 1 } : undefined,
                            },
                        })
                    }
                }, { isolationLevel: 'Serializable' })
                break
            } catch (err) {
                if (attempt < 2 && err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
                    continue
                }
                throw err
            }
        }

        // Calculate potential total would-have-earned aura for UI context
        const wouldHaveEarnedAura = rewardedAsFirstTime
            ? undefined
            : Math.max(10,
                potentialRewards.baseAura +
                potentialRewards.executionAura +
                potentialRewards.firstAttemptBonus +
                potentialRewards.innovationAura -
                (userMission.hintsUsed * AURA_HINT_PENALTY)
              )

        return NextResponse.json({
            success: true,
            stdout: finalStdout,
            stderr: "",
            warnings: compilerWarnings,
            validationErrors: [],
            earnedAura,
            innovationUnlocked: awardedFoxBadge,
            innovationReason: awardedFoxBadge ? innovationReason : undefined,
            comboBonus: comboBonusAura,
            comboStreak: newComboStreak,
            executionTimeMs: totalExecutionTimeMs,
            isReplay: !rewardedAsFirstTime,
            wouldHaveEarnedAura
        })

    } catch (error) {
        console.error('Validation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
