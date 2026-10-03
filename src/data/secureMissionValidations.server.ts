/**
 * Mission grading key — SERVER ONLY.
 *
 * The `.server.ts` suffix is load-bearing, not decoration. This holds the exact
 * output every mission is graded against. It used to live in missionsData.ts,
 * which components/mission/panels/LeftPanel.tsx imports for `missionDetails`.
 * LeftPanel is reachable from MissionWorkspace.tsx, which is "use client", so
 * the whole key was in the client module graph and only bundler tree-shaking
 * kept it out of the shipped JavaScript. A user could read every mission's
 * expected output in devtools without attempting anything.
 *
 * Do NOT import this from a "use client" module, and do not re-export it from a
 * shared barrel. The only consumer is lib/validation/missionValidator.ts, which
 * is reached solely from app/api/missions/validate/route.ts.
 */

export interface SecureTestCase {
    input: string;
    expectedOutput: string;
}

export interface SecureMissionValidation {
    id: number;
    title: string;
    requiredOutput?: string;
    testCases?: SecureTestCase[];
}

export const secureMissionValidations: Record<number, SecureMissionValidation> = {
    1: { id: 1, title: "The System Access", requiredOutput: "Hello Agent" },
    2: { id: 2, title: "Variable Infiltration", testCases: [
        { input: "7", expectedOutput: "You entered: 7" },
        { input: "42", expectedOutput: "You entered: 42" },
    ] },
    3: { id: 3, title: "Control Flow Lockdown", testCases: [
        { input: "4", expectedOutput: "Even" },
        { input: "5", expectedOutput: "Odd" },
        { input: "0", expectedOutput: "Even" },
        { input: "-3", expectedOutput: "Odd" },
    ] },
    4: { id: 4, title: "Loop Protocol", testCases: [
        { input: "agent007", expectedOutput: "Access Granted" },
        { input: "wrong\nwrong\nwrong", expectedOutput: "Wrong Password\nWrong Password\nSystem Locked" },
        { input: "wrong\nagent007", expectedOutput: "Wrong Password\nAccess Granted" },
    ] },
    5: { id: 5, title: "Function Assembly", testCases: [
        { input: "4 6", expectedOutput: "Sum: 10" },
        { input: "12 30", expectedOutput: "Sum: 42" },
        { input: "-5 8", expectedOutput: "Sum: 3" },
    ] },
    6: { id: 6, title: "Arithmetic Protocol", testCases: [
        { input: "8 5", expectedOutput: "Sum: 13" },
        { input: "20 22", expectedOutput: "Sum: 42" },
    ] },
    7: { id: 7, title: "Operative Decisions", testCases: [
        { input: "92", expectedOutput: "Grade A" },
        { input: "80", expectedOutput: "Grade B" },
        { input: "65", expectedOutput: "Grade C" },
        { input: "40", expectedOutput: "Grade F" },
    ] },
    8: { id: 8, title: "Secure Logic Gates", testCases: [
        { input: "2000", expectedOutput: "Leap Year" },
        { input: "1900", expectedOutput: "Not Leap Year" },
        { input: "2024", expectedOutput: "Leap Year" },
        { input: "2023", expectedOutput: "Not Leap Year" },
    ] },
    9: { id: 9, title: "Switching Frequencies", testCases: [
        { input: "1", expectedOutput: "One" },
        { input: "2", expectedOutput: "Two" },
        { input: "3", expectedOutput: "Three" },
        { input: "9", expectedOutput: "Unknown Signal" },
    ] },
    10: { id: 10, title: "Iterative Extraction", testCases: [
        { input: "5", expectedOutput: "Sum: 15" },
        { input: "10", expectedOutput: "Sum: 55" },
    ] },
    11: { id: 11, title: "Loop Encryption", testCases: [
        { input: "3", expectedOutput: "1 2 3" },
        { input: "5", expectedOutput: "1 2 3 4 5" },
    ] },
    12: { id: 12, title: "Breakout Protocols", testCases: [
        { input: "5 10 0", expectedOutput: "Sum: 15" },
        { input: "1 2 3 4 0", expectedOutput: "Sum: 10" },
    ] },
    13: { id: 13, title: "Nested Surveillance", testCases: [
        { input: "2", expectedOutput: "2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20" },
    ] },
    14: { id: 14, title: "Agent Signature", requiredOutput: "Hello Agent, ready for duty" },
    15: { id: 15, title: "Data Return Payload", testCases: [
        { input: "3 9", expectedOutput: "Max: 9" },
        { input: "14 7", expectedOutput: "Max: 14" },
    ] },
    16: { id: 16, title: "Scope & Lifetime", requiredOutput: "Count: 1 Count: 2" },
    17: { id: 17, title: "Array Grid Infiltration", testCases: [
        { input: "4\n1 2 3 4", expectedOutput: "Sum: 10" },
        { input: "3\n5 10 15", expectedOutput: "Sum: 30" },
    ] },
    18: { id: 18, title: "Operative Strings", testCases: [
        { input: "agent", expectedOutput: "Vowels: 2" },
        { input: "spy", expectedOutput: "Vowels: 0" },
    ] },
    19: { id: 19, title: "Pointer Intel Retrieval", testCases: [
        { input: "5 3", expectedOutput: "A: 3 B: 5" },
        { input: "10 20", expectedOutput: "A: 20 B: 10" },
    ] },
    20: { id: 20, title: "Secure Memory Allocator", requiredOutput: "42" },
    21: { id: 21, title: "Advanced Control Logic", testCases: [
        { input: "3 9 5", expectedOutput: "Max: 9" },
        { input: "10 2 8", expectedOutput: "Max: 10" },
    ] },
    22: { id: 22, title: "Loop Optimization Protocol", testCases: [
        { input: "7", expectedOutput: "Prime" },
        { input: "9", expectedOutput: "Not Prime" },
        { input: "2", expectedOutput: "Prime" },
        { input: "1", expectedOutput: "Not Prime" },
    ] },
    23: { id: 23, title: "Pointer Arithmetic", testCases: [
        { input: "4\n1 2 3 4", expectedOutput: "Sum: 10" },
        { input: "3\n7 8 9", expectedOutput: "Sum: 24" },
    ] },
    24: { id: 24, title: "Struct Blueprinting", requiredOutput: "Agent: Platypus ID: 007" },
    25: { id: 25, title: "Formatted Intel Report", testCases: [
        { input: "Fox 5", expectedOutput: "Codename: Fox | Clearance: 5" },
        { input: "Owl 2", expectedOutput: "Codename: Owl | Clearance: 2" },
    ] },
    26: { id: 26, title: "Dynamic Grid Buffer", testCases: [
        { input: "4\n2 4 6 8", expectedOutput: "Sum: 20" },
        { input: "3\n1 1 1", expectedOutput: "Sum: 3" },
    ] },
    27: { id: 27, title: "Recursive Signal Decryptor", testCases: [
        { input: "5", expectedOutput: "Factorial: 120" },
        { input: "0", expectedOutput: "Factorial: 1" },
        { input: "6", expectedOutput: "Factorial: 720" },
    ] },
    28: { id: 28, title: "Memory Infiltration", requiredOutput: "Memory Allocated" },
    29: { id: 29, title: "Recursion Master", testCases: [
        { input: "6", expectedOutput: "Fibonacci: 8" },
        { input: "10", expectedOutput: "Fibonacci: 55" },
    ] },
    30: { id: 30, title: "Bitwise Masking Protocol", testCases: [
        { input: "13", expectedOutput: "Set Bits: 3" },
        { input: "255", expectedOutput: "Set Bits: 8" },
        { input: "0", expectedOutput: "Set Bits: 0" },
    ] },
    31: { id: 31, title: "String Manipulation", testCases: [
        { input: "code", expectedOutput: "Reversed: edoc" },
        { input: "spy", expectedOutput: "Reversed: yps" },
    ] },
    32: { id: 32, title: "Matrix Transposition", testCases: [
        { input: "1 2\n3 4", expectedOutput: "1 3\n2 4" },
    ] },
    33: { id: 33, title: "Enum Protocol", testCases: [
        { input: "0", expectedOutput: "Monday" },
        { input: "3", expectedOutput: "Thursday" },
        { input: "6", expectedOutput: "Sunday" },
    ] },
    34: { id: 34, title: "Callback Compass", requiredOutput: "Result: 8" },
    35: { id: 35, title: "Linked List Insertion", requiredOutput: "Nodes: 3" },
    36: { id: 36, title: "Stack Protocol", requiredOutput: "Top: 10" },
    37: { id: 37, title: "Queue Protocol", requiredOutput: "Front: 7" },
    38: { id: 38, title: "String Tokenization", testCases: [
        { input: "red fox jumps", expectedOutput: "Words: 3" },
        { input: "spy network", expectedOutput: "Words: 2" },
    ] },
    39: { id: 39, title: "Sorting Protocol", testCases: [
        { input: "4\n4 3 2 1", expectedOutput: "1 2 3 4" },
        { input: "3\n9 5 7", expectedOutput: "5 7 9" },
    ] },
    40: { id: 40, title: "Binary Search Protocol", testCases: [
        { input: "6", expectedOutput: "Found at: 2" },
        { input: "11", expectedOutput: "Not Found" },
    ] },
    41: { id: 41, title: "Deep Function Injection", testCases: [
        { input: "2 10", expectedOutput: "Power: 1024" },
        { input: "3 4", expectedOutput: "Power: 81" },
    ] },
    42: { id: 42, title: "Buffer Overflow Audit", testCases: [
        { input: "agent", expectedOutput: "Length: 5" },
        { input: "undercover", expectedOutput: "Length: 10" },
    ] },
    43: { id: 43, title: "Macro Inline Optimization", testCases: [
        { input: "9", expectedOutput: "Square: 81" },
        { input: "12", expectedOutput: "Square: 144" },
    ] },
    44: { id: 44, title: "XOR Cipher Decryption", testCases: [
        { input: "78", expectedOutput: "Decrypted: 100" },
        { input: "0", expectedOutput: "Decrypted: 42" },
    ] },
    45: { id: 45, title: "Linked List Reverse", requiredOutput: "Head: 3" },
    46: { id: 46, title: "Dynamic 2D Matrix", requiredOutput: "Trace: 15" },
    47: { id: 47, title: "Recursive Digit Decay", testCases: [
        { input: "38", expectedOutput: "Root: 2" },
        { input: "987", expectedOutput: "Root: 6" },
    ] },
    48: { id: 48, title: "Bit Mastery", testCases: [
        { input: "1", expectedOutput: "Reversed: 128" },
        { input: "255", expectedOutput: "Reversed: 255" },
        { input: "10", expectedOutput: "Reversed: 80" },
    ] },
    49: { id: 49, title: "Selection Sort Mastery", testCases: [
        { input: "5\n5 4 3 2 1", expectedOutput: "1 2 3 4 5" },
        { input: "4\n7 1 9 3", expectedOutput: "1 3 7 9" },
    ] },
    50: { id: 50, title: "Run-Length Encoding", testCases: [
        { input: "aaabbc", expectedOutput: "3a2b1c" },
        { input: "hhhhi", expectedOutput: "4h1i" },
    ] },
    51: { id: 51, title: "Custom Hash Function", testCases: [
        { input: "cat", expectedOutput: "Hash: 67" },
        { input: "dog", expectedOutput: "Hash: 63" },
    ] },
    52: { id: 52, title: "Tower of Hanoi", testCases: [
        { input: "3", expectedOutput: "Move disk 1 from A to C\nMove disk 2 from A to B\nMove disk 1 from C to B\nMove disk 3 from A to C\nMove disk 1 from B to A\nMove disk 2 from B to C\nMove disk 1 from A to C" },
    ] },
    53: { id: 53, title: "Callback Matrix", requiredOutput: "1 4\n9 16" },
    54: { id: 54, title: "Nested Struct Vault", requiredOutput: "Codename: Wolf Clearance: 7" },
    55: { id: 55, title: "Memory Arena", requiredOutput: "Last Agent: 3" },
    56: { id: 56, title: "Circular Buffer", requiredOutput: "Buffer: 4 2 3" },
    57: { id: 57, title: "Matrix Multiply", testCases: [
        { input: "1 2\n3 4\n1 0\n0 1", expectedOutput: "1 2\n3 4" },
    ] },
    58: { id: 58, title: "Substring Search", testCases: [
        { input: "hello", expectedOutput: "Found at: 0" },
        { input: "world", expectedOutput: "Found at: 6" },
        { input: "zzz", expectedOutput: "Not Found" },
    ] },
    59: { id: 59, title: "Palindrome Protocol", testCases: [
        { input: "radar", expectedOutput: "Palindrome" },
        { input: "code", expectedOutput: "Not Palindrome" },
        { input: "level", expectedOutput: "Palindrome" },
    ] },
    60: { id: 60, title: "The Final Infiltration", requiredOutput: "Top Score: 95" },
};
