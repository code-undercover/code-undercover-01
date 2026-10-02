const REQUIRED_VARS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXTAUTH_URL",
  // lib/compiler.ts defaults this to the docker-compose service name
  // "judge0-server", which never resolves off the compose network.
  "JUDGE0_API_URL",
] as const

const REQUIRED_IN_PRODUCTION = [
  // Password reset is the only mail this app sends. Requiring the key here beats
  // letting a reset silently no-op in production, where the symptom is a user
  // who never receives the email and has no way to tell it was sent.
  "RESEND_API_KEY",
] as const

export function validateEnv(): void {
    const missing: string[] = []

    for (const key of REQUIRED_VARS) {
        if (!process.env[key]) {
            missing.push(key)
        }
    }

    // lib/auth.ts accepts either name for the NextAuth signing secret.
    if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
        missing.push("NEXTAUTH_SECRET (or AUTH_SECRET)")
    }

    // `next build` runs with NODE_ENV=production and instrumentation still calls
    // this, but it never serves a request — so build-time-only environments must
    // not be asked for runtime integrations. Same exemption lib/auth.ts uses.
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"

    if (process.env.NODE_ENV === "production" && !isBuildPhase) {
        for (const key of REQUIRED_IN_PRODUCTION) {
            if (!process.env[key]) {
                missing.push(key)
            }
        }
    }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
        "See .env.example for the full list of required variables."
    );
  }
}
