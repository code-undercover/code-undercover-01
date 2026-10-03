import { secureMissionValidations } from "@/src/data/secureMissionValidations.server"

export interface ValidationResult {
    missionCleared: boolean;
    innovationUnlocked: boolean;
    innovationReason?: string;
}

export interface OutputValidationResult {
    isCorrect: boolean;
    feedbackMessage?: string;
}

/**
 * Normalizes a compiler output string for beginner-friendly comparison.
 * Strips case sensitivity, collapses whitespace, and removes trailing punctuation
 * so minor formatting differences don't block mission completion.
 */
function normalizeOutput(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")          // collapse consecutive whitespace to single space
        .replace(/[.!?]+$/, "")        // strip trailing punctuation (., !, ?)
}

export interface GradingCase {
    input: string;
    expectedOutput: string;
    /**
     * Whether a failure may quote the expected output back. Only a
     * requiredOutput mission's answer is already spelled out in its briefing;
     * echoing a test case's answer hands the agent a lookup table to hardcode.
     */
    revealExpected: boolean;
}

/** The parts of a compiler run that grading reads. */
export interface GradedRun {
    success: boolean;
    output?: string;
    errors?: string;
}

/**
 * The runs a submission must pass, or null when the mission has no grading key
 * (callers must treat that as a failure, never a pass).
 *
 * A test-case mission is graded on every authored input, never on stdin the
 * agent chose. Grading only the agent's own input let a hardcoded printf pass:
 * any input that matched no case fell back to the first case's answer, and the
 * failure message quoted that answer back. A requiredOutput mission takes no
 * input, so it is graded on the agent's own run.
 */
export function getGradingCases(missionOrder: number, userInput: string): GradingCase[] | null {
    const secureConfig = secureMissionValidations[missionOrder]
    if (!secureConfig) return null

    if (secureConfig.requiredOutput) {
        return [{ input: userInput, expectedOutput: secureConfig.requiredOutput, revealExpected: true }]
    }

    if (secureConfig.testCases && secureConfig.testCases.length > 0) {
        return secureConfig.testCases.map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            revealExpected: false,
        }))
    }

    return null
}

/**
 * Normalized output validation comparing compiler-produced stdout against
 * expected outputs pulled directly from our secure backend data source.
 * `runs[i]` must be the result of running the submission on `cases[i].input`.
 *
 * Normalization is intentionally beginner-friendly:
 *   - Case-insensitive (lowercase both sides)
 *   - Whitespace-tolerant (trim + collapse consecutive spaces)
 *   - Trailing punctuation is stripped before comparison
 *
 * Critically, validation still depends entirely on the real stdout produced by
 * the Local GCC compiler. Source code is never parsed for pass/fail logic.
 */
export function gradeMissionRuns(cases: GradingCase[], runs: GradedRun[]): OutputValidationResult {
    if (cases.length === 0 || runs.length !== cases.length) {
        return { isCorrect: false, feedbackMessage: "This mission could not be graded. Please try again." }
    }

    for (let i = 0; i < cases.length; i++) {
        const { input, expectedOutput, revealExpected } = cases[i]
        const run = runs[i]
        const shownInput = input.trim().replace(/\n/g, " / ")

        if (!run.success) {
            return {
                isCorrect: false,
                feedbackMessage: `Platypus: Your program failed when HQ ran it on input '${shownInput}': ${run.errors || "execution failed"}. Make sure it handles every input, not just the one you tried.`,
            }
        }

        const rawUserOutput = (run.output ?? "").trim()
        if (normalizeOutput(rawUserOutput) === normalizeOutput(expectedOutput)) continue

        return {
            isCorrect: false,
            feedbackMessage: revealExpected
                ? `Platypus: Not quite, Agent. We intercepted your transmission, but the payload was incorrect. Your output: '${rawUserOutput}'. Expected meaning: '${expectedOutput}'. Check what you are passing into your printf function.`
                : `Platypus: Not quite, Agent. HQ ran your program on input '${shownInput}' and intercepted '${rawUserOutput}', which is not the payload we expect. Make sure it works for every input, not just the one you tried.`,
        }
    }

    return { isCorrect: true }
}

/**
 * Titles that identify the pointer lesson (Mission 20).
 *
 * The canonical-solution comparison below is unreachable unless one of these
 * matches: the mission's actual title in `missionsData` is "Secure Memory
 * Allocator", while the older name is kept because fixtures still pass it.
 */
const POINTER_MISSION_TITLES = new Set(["Secure Memory Allocator", "The Pointer Breach"])

export function detectInnovation(
    code: string,
    missionTitle: string
): { innovationUnlocked: boolean; innovationReason: string } {
    // We specifically target the Pointer mission for these rules
    if (!POINTER_MISSION_TITLES.has(missionTitle)) {
        // A colon inside a printf format ("%d:%s") satisfies /\?[^:]*:/ only when
        // a '?' precedes it, but string literals are stripped first so ordinary
        // format strings can never read as an innovation.
        const source = code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""')
        const hasWhileLoop = /\bwhile\s*\(/.test(source)
        const hasTernary = /\?[^:]*:/.test(source)
        if (hasWhileLoop || hasTernary) {
            return {
                innovationUnlocked: true,
                innovationReason: "Alternative control flow detected! Exceptional logic, agent."
            };
        }
        return { innovationUnlocked: false, innovationReason: "" };
    }

    // Canonical solution mapping for "The Pointer Breach"
    const canonicalSolution = `
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
}`;

    // Normalize: remove all whitespace and convert to lowercase
    const normalize = (str: string) => str.replace(/\s+/g, "").toLowerCase();

    const normalizedUserCode = normalize(code);
    const normalizedCanonical = normalize(canonicalSolution);

    // 1. Do NOT trigger innovation if code matches canonical exactly
    if (normalizedUserCode === normalizedCanonical) {
        return { innovationUnlocked: false, innovationReason: "" };
    }

    // 2. Check for alternative valid syntax / advanced techniques using regex
    const hasSizeofStar = /\bsizeof\s*\(\s*\*/.test(code);
    const hasPointerArithmetic = /\bptr\s*[+\-]/.test(code);
    const hasBangNullCheck = /\bif\s*\(\s*!/.test(code);
    const hasParenthesisDereference = /\*\s*\(\s*ptr\s*\)/.test(code);

    // In C, casting malloc (e.g., (int *)malloc) is considered bad practice by some,
    // so omitting it is an innovation/proper C idiom (unlike C++).
    const lacksIntCast = !/\(\s*int\s*\*\s*\)\s*malloc/.test(code);

    if (hasSizeofStar || hasPointerArithmetic || hasBangNullCheck || hasParenthesisDereference || lacksIntCast) {
        return {
            innovationUnlocked: true,
            innovationReason: "Advanced pointer syntax detected! (Idiomatic malloc, concise null checks, or pointer arithmetic). Fox badge awarded."
        };
    }

    return { innovationUnlocked: false, innovationReason: "" };
}
