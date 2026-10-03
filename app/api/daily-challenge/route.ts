import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { calculateAuraLevel } from "@/lib/aura"
import { dailyQuestions } from "@/src/data/dailyQuestions.server"
import { dailyChallengeLimiter } from "@/lib/rate-limit"
import { invalidateUser } from "@/lib/cache"
import { getDailyChallengeQuestion, utcDayKey } from "@/lib/daily-challenge"

const DAILY_QUESTIONS_AURA = 20

/** Graded shape: the answer key must never leave the POST path. */
type GradedQuestion = {
    id: string
    correctAnswer: string
    explanation: string
}

async function loadGradedQuestion(questionId: string): Promise<GradedQuestion | null> {
    const dbQuestion = await db.dailyQuestion.findUnique({ where: { id: questionId } })
    if (dbQuestion) {
        return {
            id: dbQuestion.id,
            correctAnswer: dbQuestion.correctAnswer,
            explanation: dbQuestion.explanation,
        }
    }

    const staticQ = dailyQuestions.find((q) => q.id === questionId)
    if (staticQ) {
        return {
            id: staticQ.id,
            correctAnswer: staticQ.correctAnswer,
            explanation: staticQ.explanation,
        }
    }

    return null
}

export async function GET(_req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const rate = await dailyChallengeLimiter.check(session.user.id)
        if (!rate.success) {
            return NextResponse.json(
                { error: `Too many requests. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.` },
                { status: 429 }
            )
        }

        // Delegates to the shared resolver so this returns the same UTC-day
        // prompt the dashboard, /daily-tasks and /daily-challenges show. This
        // handler used to pick Math.random() from the table, which meant the
        // question the agent graded themselves against could differ from the
        // one they were shown.
        const question = await getDailyChallengeQuestion()

        if (!question) {
            return NextResponse.json({ success: false, error: "No daily questions generated yet." })
        }

        return NextResponse.json({ success: true, question })

    } catch (error) {
        console.error("Daily Challenge GET Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const rate = await dailyChallengeLimiter.check(session.user.id)
        if (!rate.success) {
            return NextResponse.json(
                { error: `Too many requests. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.` },
                { status: 429 }
            )
        }

        const { questionId, answer } = await req.json()
        if (!questionId || !answer) {
            return NextResponse.json({ error: "Missing payload params" }, { status: 400 })
        }

        // Only today's question is gradable. Without this the endpoint accepts any
        // id in the bank, so a caller could answer the easiest question it knows
        // about and still bank the reward on days when that question was not shown.
        const todaysQuestion = await getDailyChallengeQuestion()
        if (!todaysQuestion) {
            return NextResponse.json({ success: false, error: "No daily questions generated yet." })
        }
        if (todaysQuestion.id !== questionId) {
            return NextResponse.json({ error: "That is not today's question." }, { status: 400 })
        }

        const questionData = await loadGradedQuestion(questionId)
        if (!questionData) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 })
        }

        const isCorrect = questionData.correctAnswer === answer
        const dateKey = utcDayKey()

        // Claim the day BEFORE paying out, in the same transaction. The unique
        // (userId, dateKey) index makes this the single gate: the first insert of
        // the day wins and every later one is rejected by Postgres, so concurrent
        // POSTs cannot both award. Recording the first attempt regardless of
        // correctness also closes answer brute-forcing, which used to be another
        // unbounded way to farm the reward.
        //
        // The claim and the payout share a transaction because a separate write
        // left a window where the day was consumed but the aura never landed,
        // costing the player the reward with no way to retry it.
        let settled
        try {
            settled = await db.$transaction(async (tx) => {
                const created = await tx.dailyChallengeCompletion.create({
                    data: {
                        userId: session.user.id,
                        dateKey,
                        questionId,
                        isCorrect,
                        earnedAura: isCorrect ? DAILY_QUESTIONS_AURA : 0,
                    },
                })

                if (!created.isCorrect) return { created, awardedAura: 0 }

                // Atomic add-and-read. A read-modify-write of auraPoints loses
                // updates when two awards land together, and the level below is
                // derived from the post-increment value.
                const rows = await tx.$queryRaw<{ auraPoints: number }[]>`
                    UPDATE "User"
                       SET "auraPoints" = "auraPoints" + ${DAILY_QUESTIONS_AURA}
                     WHERE "id" = ${session.user.id}
                    RETURNING "auraPoints"
                `
                const newAuraPoints = rows[0]?.auraPoints ?? 0

                await tx.user.update({
                    where: { id: session.user.id },
                    data: { auraLevel: calculateAuraLevel(newAuraPoints) },
                })

                return { created, awardedAura: DAILY_QUESTIONS_AURA }
            })
        } catch (error) {
            if ((error as { code?: string })?.code !== "P2002") throw error

            const existing = await db.dailyChallengeCompletion.findUnique({
                where: { userId_dateKey: { userId: session.user.id, dateKey } },
            })

            // Replaying the stored outcome keeps repeat visits showing the same
            // result while paying nothing a second time.
            return NextResponse.json({
                success: true,
                alreadyCompleted: true,
                isCorrect: existing?.isCorrect ?? isCorrect,
                explanation: questionData.explanation,
                correctAnswer: questionData.correctAnswer,
                earnedAura: 0,
            })
        }

        // The navbar caches this record; drop it so the new aura shows
        // on the next navigation rather than after the TTL lapses.
        if (settled.awardedAura > 0 && session.user.email) {
            await invalidateUser(session.user.email)
        }

        return NextResponse.json({
            success: true,
            isCorrect: settled.created.isCorrect,
            explanation: questionData.explanation,
            correctAnswer: questionData.correctAnswer,
            earnedAura: settled.awardedAura
        })

    } catch (error) {
        console.error("Daily Challenge POST Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
