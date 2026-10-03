import { db } from "@/lib/db"
import { dailyQuestions } from "@/src/data/dailyQuestions.server"
import type { DailyChallengeQuestion } from "@/components/dashboard/DailyChallenge"

/**
 * The UTC day a timestamp falls in, as "YYYY-MM-DD".
 *
 * This is the key the once-per-day award is recorded against, so every caller
 * that decides "is this still today's challenge" must derive it the same way.
 * UTC rather than local time: the question itself already rotates on UTC days
 * (see getDailyChallengeQuestion), so a local-time key would let the reward
 * reset hours before the question does.
 */
export function utcDayKey(now: Date = new Date()): string {
    return now.toISOString().slice(0, 10)
}

/**
 * Resolves today's intercept question.
 *
 * The static bank is the single source of truth for *which* question a given day
 * shows; the DailyQuestion table may only override that id's wording. Grading is
 * keyed on the returned id, so the selection order must not depend on whether
 * the table is seeded and reachable. Deriving the index from the static bank
 * alone also keeps a newly seeded question from reshuffling future days.
 */
export async function getDailyChallengeQuestion(): Promise<DailyChallengeQuestion | null> {
    if (dailyQuestions.length === 0) return null

    const now = Date.now()
    let question: DailyChallengeQuestion = dailyQuestions[Math.floor(now / 86400000) % dailyQuestions.length]

    try {
        // A missing or malformed row falls back to the static copy.
        const dbQuestion = await db.dailyQuestion.findUnique({ where: { id: question.id } })

        if (dbQuestion) {
            const options: unknown = JSON.parse(dbQuestion.options)
            if (Array.isArray(options) && options.every((opt) => typeof opt === "string")) {
                question = { id: dbQuestion.id, question: dbQuestion.question, options }
            }
        }
    } catch (error) {
        console.error("Failed to load daily question override from DB:", error)
    }

    return question
}
