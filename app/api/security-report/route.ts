import { NextResponse } from "next/server"
import { getIpFromHeaders, securityReportLimiter } from "@/lib/rate-limit"

const MAX_BODY_BYTES = 4096

export async function POST(req: Request) {
    const rate = await securityReportLimiter.check(getIpFromHeaders(req.headers))
    if (!rate.success) {
        return NextResponse.json({ received: false }, { status: 429 })
    }

    try {
        const raw = await req.text()
        if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
            return NextResponse.json({ received: false }, { status: 413 })
        }

        const body = JSON.parse(raw)
        console.error("[CSP VIOLATION]", JSON.stringify(body))
        return NextResponse.json({ received: true }, { status: 200 })
    } catch {
        return NextResponse.json({ received: false }, { status: 200 })
    }
}