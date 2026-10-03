/**
 * Daily challenge question bank — SERVER ONLY.
 *
 * The `.server.ts` suffix is load-bearing, not decoration. This module holds
 * `correctAnswer` for every question, and it was previously exported from
 * missionsData.ts, which is imported by components/mission/panels/LeftPanel.tsx
 * to read `missionDetails`. LeftPanel is reachable from MissionWorkspace.tsx,
 * which is "use client", so the whole answer key was in the client module graph
 * and only bundler tree-shaking kept it out of the shipped JavaScript. Anything
 * reaching the browser can be read in devtools, so that was a real leak: a user
 * could open the bundle and read every correct answer without attempting
 * anything.
 *
 * Do NOT import this from a "use client" module, and do not re-export it from a
 * shared barrel. Consumers are all server-side already:
 *   - lib/daily-challenge.ts   (selection)
 *   - app/api/daily-challenge   (grading)
 *   - services/mission.service.ts, prisma/seed.ts (seeding)
 *
 * The public question/options are served to the browser by
 * getDailyChallengeQuestion(); a single question's correctAnswer is still
 * returned after an answer is submitted, because the debrief UI needs to show
 * it. That is intentional and scoped to the question actually answered.
 */

export interface DailyQuestionData {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

export const dailyQuestions: DailyQuestionData[] = [
    {
        id: "dq-1",
        question: "What is the correct way to allocate memory for an integer array of size 10 in C?",
        options: [
            "int *arr = malloc(10);",
            "int *arr = malloc(10 * sizeof(int));",
            "int arr = malloc(10);",
            "int *arr = calloc(10);"
        ],
        correctAnswer: "int *arr = malloc(10 * sizeof(int));",
        explanation: "malloc requires the total number of bytes. 10 integers * the size of an integer in bytes."
    },
    {
        id: "dq-2",
        question: "Which format specifier is used to print a double in C?",
        options: [
            "%d",
            "%f",
            "%lf",
            "%s"
        ],
        correctAnswer: "%lf",
        explanation: "%lf stands for 'long float', which is the historical C designation for double precision floats in scanf/printf."
    },
    {
        id: "dq-3",
        question: "What does the unary & operator do in C?",
        options: [
            "Dereferences a pointer",
            "Returns the address of a variable",
            "Multiplies by two",
            "Declares a reference"
        ],
        correctAnswer: "Returns the address of a variable",
        explanation: "&x evaluates to the memory address where x is stored — essential for scanf and pointer setup."
    },
    {
        id: "dq-4",
        question: "Which loop is guaranteed to run its body at least once?",
        options: [
            "for loop",
            "while loop",
            "do-while loop",
            "infinite loop"
        ],
        correctAnswer: "do-while loop",
        explanation: "do-while checks the condition after the body executes, so the body always runs at least once."
    },
    {
        id: "dq-5",
        question: "What is the time complexity of binary search on a sorted array?",
        options: [
            "O(n)",
            "O(log n)",
            "O(n log n)",
            "O(1)"
        ],
        correctAnswer: "O(log n)",
        explanation: "Each step halves the search space, giving logarithmic growth in comparisons."
    },
];
