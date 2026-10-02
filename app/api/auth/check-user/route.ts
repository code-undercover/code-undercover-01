import { NextResponse } from "next/server"

// This used to answer GET ?email=... with { exists: true|false }, which is a
// straightforward account-enumeration oracle: it is unauthenticated and lets
// anyone confirm whether an arbitrary address has an account here.
//
// The register page never called it. No query parameter is read and no database
// call is made, so the response is identical for every address and cannot be
// used to probe for registered users. Keep it that way: any per-address branch
// here re-opens the hole.
export function GET() {
    return NextResponse.json(
        { error: 'This endpoint has been removed.' },
        { status: 410 }
    )
}