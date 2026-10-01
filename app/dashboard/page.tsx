import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { safeDbQuery } from "@/lib/db"
import { DailyChallengeModal } from "@/components/dashboard/DailyChallengeModalLazy"
import { ClearanceScene } from "@/components/skill/ClearanceScene"
import { getClearanceProgress } from "@/lib/clearance"
import { getDailyChallengeQuestion } from "@/lib/daily-challenge"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        redirect("/login")
    }

    const [dailyChallengeQuestion, clearanceProgress] = await Promise.all([
        safeDbQuery(
            () => getDailyChallengeQuestion(),
            null,
            "DashboardPage.dailyChallenge"
        ),
        getClearanceProgress(session.user.id),
    ])

    return (
        <>
            <DailyChallengeModal initialQuestion={dailyChallengeQuestion} />
            <ClearanceScene progress={clearanceProgress} />
        </>
    )
}
