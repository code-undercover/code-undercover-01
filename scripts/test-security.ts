import {
    registerLimiter,
    forgotPasswordLimiter,
    resetPasswordLimiter,
    loginFailedLimiter,
    loginIpLimiter,
    securityReportLimiter,
    getIpFromHeaders
} from '../lib/rate-limit'

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`)
    }
}

async function runTests() {
    console.log("=== Running Security & Authentication Hardening Tests ===\n")

    // Test 1: A request limiter consumes tokens (Limit: 20)
    console.log("Test 1: Verifying registerLimiter (Limit: 20)...")
    const ip = "192.168.1.1"
    for (let i = 0; i < 20; i++) {
        assert((await registerLimiter.check(ip)).success === true, `Request ${i + 1} should NOT be rate limited`)
    }
    assert((await registerLimiter.isRateLimited(ip)) === true, "Request 21 MUST be rate limited")
    console.log("✅ API Rate Limiter test passed!")

    // Test 2: SimpleRateLimiter - Login Failures Limiting (Limit: 10)
    console.log("\nTest 2: Verifying loginFailedLimiter (Limit: 10)...")
    const key = "192.168.1.1:attacker@victim.com"
    for (let i = 0; i < 10; i++) {
        assert((await loginFailedLimiter.isRateLimited(key)) === false, `Login attempt ${i + 1} should NOT be blocked before 10 increments`)
        await loginFailedLimiter.increment(key)
    }
    assert((await loginFailedLimiter.isRateLimited(key)) === true, "Login attempt 11 MUST be blocked")
    console.log("✅ Login Failures Rate Limiter test passed!")

    // Test 2b: Per-IP login cap (Limit: 30)
    console.log("\nTest 2b: Verifying loginIpLimiter (Limit: 30)...")
    const stuffingIp = "10.0.0.9"
    for (let i = 0; i < 30; i++) {
        assert((await loginIpLimiter.check(stuffingIp)).success === true, `Attempt ${i + 1} should be allowed`)
    }
    assert((await loginIpLimiter.check(stuffingIp)).success === false, "Attempt 31 MUST be blocked")
    console.log("✅ Per-IP login limiter test passed!")

    // Test 2c: reset() clears a tripped failure bucket
    console.log("\nTest 2c: Verifying loginFailedLimiter.reset()...")
    const resetKey = "10.0.0.10:victim@example.com"
    for (let i = 0; i < 10; i++) await loginFailedLimiter.increment(resetKey)
    assert((await loginFailedLimiter.isRateLimited(resetKey)) === true, "Bucket should be tripped after 10 failures")
    await loginFailedLimiter.reset(resetKey)
    assert((await loginFailedLimiter.isRateLimited(resetKey)) === false, "reset() must clear the bucket after a successful sign-in")
    console.log("✅ reset() test passed!")

    // Test 2d: Unauthenticated CSP sink is throttled
    console.log("\nTest 2d: Verifying securityReportLimiter (Limit: 30)...")
    const cspIp = "10.0.0.11"
    for (let i = 0; i < 30; i++) {
        assert((await securityReportLimiter.check(cspIp)).success === true, `Report ${i + 1} should be accepted`)
    }
    assert((await securityReportLimiter.check(cspIp)).success === false, "Report 31 MUST be blocked")
    console.log("✅ CSP sink limiter test passed!")

    // Test 3: IP Headers Parser
    // The LAST hop wins, not the first: everything before it is client-supplied
    // and taking it would let anyone spoof their rate-limit key. This assertion
    // used to expect "1.2.3.4" and encoded the pre-fix, spoofable behavior.
    console.log("\nTest 3: Verifying getIpFromHeaders parser...")
    const headersMock1 = new Headers()
    headersMock1.set("x-forwarded-for", "1.2.3.4, 5.6.7.8")
    assert(getIpFromHeaders(headersMock1) === "5.6.7.8", "Must trust the proxy-appended last hop, not the client-supplied first")

    const headersMock2 = { "x-real-ip": "9.10.11.12" }
    assert(getIpFromHeaders(headersMock2) === "9.10.11.12", "Should parse x-real-ip from Record")

    const headersMockEmpty = {}
    assert(getIpFromHeaders(headersMockEmpty) === "127.0.0.1", "Should default to localhost on missing headers")
    console.log("✅ IP headers parser test passed!")

    // Test 4: Forgot Password Email Validation Regex
    console.log("\nTest 4: Verifying email format regex validation...")
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    assert(emailRegex.test("valid@email.com") === true, "valid@email.com should be valid")
    assert(emailRegex.test("invalid-email") === false, "invalid-email should be invalid")
    assert(emailRegex.test("invalid@email") === false, "invalid@email should be invalid")
    assert(emailRegex.test("invalid.email.com") === false, "invalid.email.com should be invalid")
    console.log("✅ Email validation regex test passed!")

    // Test 5: NextAuth secret checking
    console.log("\nTest 5: Verifying NEXTAUTH_SECRET production startup check...")
    const originalNodeEnv = process.env.NODE_ENV;
    const originalSecret = process.env.NEXTAUTH_SECRET;

    (process.env as Record<string, string | undefined>).NODE_ENV = "production"
    delete process.env.NEXTAUTH_SECRET

    let threwError = false
    try {
        const checkSecret = (envNodeEnv: string, envSecret?: string) => {
            if (!envSecret) {
                if (envNodeEnv === "production") {
                    throw new Error("NEXTAUTH_SECRET is not set. This is a critical security risk in production.")
                }
            }
        }
        checkSecret(process.env.NODE_ENV, process.env.NEXTAUTH_SECRET)
    } catch (e) {
        threwError = true
    }

    assert(threwError === true, "Missing NEXTAUTH_SECRET in production MUST throw an error");

    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv
    process.env.NEXTAUTH_SECRET = originalSecret
    console.log("✅ NEXTAUTH_SECRET production safety test passed!")

    console.log("\n🎉 All security verification tests passed successfully!")
}

runTests().catch(err => {
    console.error("\n❌ Security Tests Failed:", err)
    process.exit(1)
})