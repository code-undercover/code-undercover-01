import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

// Modules that hold answers: mission expected outputs and MCQ indexes
// (missionsData), the grading key, and the daily challenge answers.
const ANSWER_MODULES = /from\s+["'][^"']*(missionsData|\.server)["']/

function collect(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) return collect(full)
        return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : []
    })
}

describe("answer key stays out of the client bundle", () => {
    it("is never imported by components, hooks or 'use client' modules", () => {
        // Anything a client component reaches ships to the browser, where the
        // answers can be read in devtools. components/ and hooks/ are checked
        // wholesale because a file there without "use client" can still be
        // pulled in by one that has it (LeftPanel -> MissionWorkspace did).
        const root = process.cwd()
        const files = [
            ...collect(join(root, "components")),
            ...collect(join(root, "hooks")),
            ...collect(join(root, "app")).filter((f) => /^\s*["']use client["']/.test(readFileSync(f, "utf8"))),
        ]
        expect(files.length).toBeGreaterThan(10)

        const offenders = files
            .filter((f) => ANSWER_MODULES.test(readFileSync(f, "utf8")))
            .map((f) => relative(root, f))

        expect(offenders).toEqual([])
    })
})
