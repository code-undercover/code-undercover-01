import { describe, it, expect } from "vitest"
import { getGradingCases, gradeMissionRuns, detectInnovation } from "./missionValidator"

// Grades `outputs[i]` as the stdout of a successful run on case i.
function grade(missionOrder: number, userInput: string, outputs: string[]) {
    const cases = getGradingCases(missionOrder, userInput) ?? []
    return gradeMissionRuns(cases, outputs.map((output) => ({ success: true, output })))
}

describe("getGradingCases", () => {
    it("grades a requiredOutput mission on the agent's own input", () => {
        expect(getGradingCases(1, "x")).toEqual([
            { input: "x", expectedOutput: "Hello Agent", revealExpected: true },
        ])
    })

    it("grades a test-case mission on every authored input, ignoring the agent's", () => {
        const cases = getGradingCases(2, "999")
        expect(cases?.map((c) => c.input)).toEqual(["7", "42"])
        expect(cases?.every((c) => !c.revealExpected)).toBe(true)
    })

    it("returns null when the mission has no grading key", () => {
        expect(getGradingCases(99999, "")).toBeNull()
    })
})

describe("gradeMissionRuns", () => {
    // Mission 1 ("The System Access"): requiredOutput = "Hello Agent"
    it("accepts an exact match against requiredOutput", () => {
        expect(grade(1, "", ["Hello Agent"]).isCorrect).toBe(true)
    })

    it("is case-insensitive and whitespace-tolerant", () => {
        expect(grade(1, "", ["  hello    agent  "]).isCorrect).toBe(true)
    })

    it("tolerates trailing punctuation", () => {
        expect(grade(1, "", ["Hello Agent!"]).isCorrect).toBe(true)
    })

    it("rejects wrong output and includes a feedback message", () => {
        const result = grade(1, "", ["Wrong output"])
        expect(result.isCorrect).toBe(false)
        expect(result.feedbackMessage).toContain("Hello Agent")
    })

    // Mission 2 ("Variable Infiltration"): testCases 7 and 42
    it("accepts when every test case's output matches", () => {
        expect(grade(2, "", ["You entered: 7", "You entered: 42"]).isCorrect).toBe(true)
    })

    it("rejects a hardcoded printf that only matches one case", () => {
        expect(grade(2, "7", ["You entered: 7", "You entered: 7"]).isCorrect).toBe(false)
    })

    it("never quotes a test case's expected output back", () => {
        const result = grade(2, "", ["You entered: 7", "nope"])
        expect(result.isCorrect).toBe(false)
        expect(result.feedbackMessage).toContain("'42'")
        expect(result.feedbackMessage).not.toContain("You entered: 42")
    })

    it("rejects a run that failed on a hidden case", () => {
        const cases = getGradingCases(2, "")!
        const result = gradeMissionRuns(cases, [
            { success: true, output: "You entered: 7" },
            { success: false, errors: "Time limit exceeded" },
        ])
        expect(result.isCorrect).toBe(false)
        expect(result.feedbackMessage).toContain("Time limit exceeded")
    })

    it("fails closed when there is nothing to grade against", () => {
        expect(gradeMissionRuns([], []).isCorrect).toBe(false)
        expect(grade(99999, "", ["anything"]).isCorrect).toBe(false)
    })
})

describe("detectInnovation", () => {
    describe("generic missions (not 'The Pointer Breach')", () => {
        it("unlocks on a while loop", () => {
            const result = detectInnovation("while (x < 10) { x++; }", "Some Other Mission")
            expect(result.innovationUnlocked).toBe(true)
        })

        it("unlocks on a ternary operator", () => {
            const result = detectInnovation("int y = x > 0 ? 1 : 0;", "Some Other Mission")
            expect(result.innovationUnlocked).toBe(true)
        })

        it("does not unlock for plain sequential code", () => {
            const result = detectInnovation("int x = 1;\nprintf(\"%d\", x);", "Some Other Mission")
            expect(result.innovationUnlocked).toBe(false)
        })
    })

    describe("'The Pointer Breach' mission", () => {
        const canonical = `
#include <stdio.h>
#include <stdlib.h>

int main() {
    int *ptr = (int *)malloc(sizeof(int));
    if (ptr != NULL) {
        *ptr = 42;
        printf("%d", *ptr);
        free(ptr);
        ptr = NULL;
    }
    return 0;
}`

        it("does not unlock innovation for the canonical solution", () => {
            const result = detectInnovation(canonical, "The Pointer Breach")
            expect(result.innovationUnlocked).toBe(false)
        })

        it("unlocks innovation for idiomatic malloc without the int* cast", () => {
            const code = `
#include <stdio.h>
#include <stdlib.h>
int main() {
    int *ptr = malloc(sizeof(int));
    if (ptr != NULL) {
        *ptr = 42;
        printf("%d", *ptr);
        free(ptr);
        ptr = NULL;
    }
    return 0;
}`
            const result = detectInnovation(code, "The Pointer Breach")
            expect(result.innovationUnlocked).toBe(true)
        })
    })
})
