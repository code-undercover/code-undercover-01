const REQUIRED_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
] as const

/**
 * Dependencies that are NOT checked at boot, on purpose. Each already handles
 * its own absence at the point of use, and demanding them here took the whole
 * site down for one feature being unconfigured:
 *
 *   UPSTASH_*  lib/rate-limit.ts + lib/cache.ts warn and fall back in-process
 *   RESEND_*   lib/email.ts logs and returns false
 *   JUDGE0_*   lib/compiler.ts returns a structured serviceUnavailable result
 *   DIRECT_URL read only by `prisma migrate deploy`, never at runtime
 *
 * A missing one of these must degrade one feature, not 500 every route. That
 * regression shipped twice: f25d706 fixed it via cache/rate-limit, then 3eaa130
 * reintroduced it through this file.
 */
const DEGRADED_IF_MISSING = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY",
  "JUDGE0_API_URL",
  "DIRECT_URL",
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

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
                "See .env.example for the full list of required variables."
        );
    }

    const degraded = DEGRADED_IF_MISSING.filter((key) => !process.env[key]);
    if (degraded.length > 0) {
        console.warn(
            `[ENV] Optional integrations not configured: ${degraded.join(", ")}. ` +
                "The features that use them will be unavailable; everything else works."
        );
    }
}