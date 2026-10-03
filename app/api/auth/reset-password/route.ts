import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { resetPasswordLimiter, getIpFromHeaders } from "@/lib/rate-limit"
import { validatePassword } from "@/lib/passwordPolicy"

export async function POST(req: Request) {
    try {
        const ip = getIpFromHeaders(req.headers)
        const rate = await resetPasswordLimiter.check(ip)
        if (!rate.success) {
            return NextResponse.json(
                { message: "Too many requests. Please try again later." },
                { status: 429 }
            )
        }

        const body = await req.json()
        const { token, email, password } = body

        if (!token || !email || !password) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            )
        }

        const passwordError = validatePassword(password)
        if (passwordError) {
            return NextResponse.json({ message: passwordError }, { status: 400 })
        }

        const normalizedEmail = email.trim().toLowerCase()

        // Hash the incoming token to match what's stored in the DB
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

        // Find user by email and verify the token is valid and not expired
        const user = await db.user.findFirst({
            where: {
                email: normalizedEmail,
                passwordResetToken: hashedToken,
                passwordResetExpires: {
                    gt: new Date() // Must be in the future
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { message: "Invalid or expired reset token" },
                { status: 400 }
            )
        }

        // Must match registration's cost factor; a weaker one here quietly
        // downgrades every password set through the mailbox-takeover path.
        const hashedPassword = await bcrypt.hash(password, 12)

        // Update the user's password and clear the reset token
        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null
            }
        })

        // Sessions are JWTs valid for 30 days, so without this every cookie
        // issued before the reset keeps working — the exact outcome a victim
        // resets to end. The PrismaAdapter does not do this for us under a JWT
        // strategy, so the rows must be deleted explicitly.
        await db.session.deleteMany({ where: { userId: user.id } })

        const response = NextResponse.json(
            { message: "Password has been successfully reset" },
            { status: 200 }
        )
        const expired = "path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
        response.headers.append("Set-Cookie", `next-auth.session-token=; ${expired}`)
        response.headers.append("Set-Cookie", `__Secure-next-auth.session-token=; ${expired}; Secure`)
        return response
    } catch (error) {
        console.error("[RESET_PASSWORD] Error:", error)
        return NextResponse.json(
            { message: "System malfunction during password reset." },
            { status: 500 }
        )
    }
}
