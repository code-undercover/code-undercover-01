import { describe, it, expect } from "vitest"
import nextConfig from "./next.config.mjs"

// next.config.mjs is JavaScript and tsconfig sets allowJs without checkJs, so
// the return shape is inferred. The annotation keeps this test compiling if a
// future pattern switches to the URL-object form.
const config = nextConfig("phase-production-build") as {
    images?: { remotePatterns?: Array<{ hostname?: string }> }
}

const hostnames = (config.images?.remotePatterns ?? []).map((p) => p.hostname ?? "")

describe("images.remotePatterns", () => {
    it("never uses a wildcard hostname", () => {
        expect(hostnames.some((h) => h.includes("*"))).toBe(false)
    })

    it("allows only exact Google avatar hosts", () => {
        expect([...hostnames].sort()).toEqual([
            "lh3.googleusercontent.com",
            "lh4.googleusercontent.com",
            "lh5.googleusercontent.com",
            "lh6.googleusercontent.com",
        ])
    })
})