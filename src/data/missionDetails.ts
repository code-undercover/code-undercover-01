// Briefing copy only. components/mission/panels/LeftPanel.tsx (client graph)
// imports this module, so it must never hold answers, expected outputs or
// validation rules — those stay in missionsData.ts and the *.server.ts files.
export const missionDetails: Record<number, { description: string; briefing: string }> = {
    1: {
        description: "Learn how to use the printf function in C to display output on the screen. In this task, students will learn how to include the standard input/output library and use printf to print a message to the terminal. The expected output from the program will be: \"Hello Agent \"",
        briefing: "Learn how to use the printf function in C to display output on the screen. In this task, students will learn how to include the standard input/output library and use printf to print a message to the terminal. The expected output from the program will be: \"Hello Agent \"",
    },
    2: {
        description: "An enemy agent has scrambled the variable declarations in our communication module. Data types are mismatched and values are corrupted. Restore order by demonstrating mastery of C data types and variable declarations.",
        briefing: "I have to show chief, that how capable I am. I have to track the ID of Agent platypus. Using scanf(\"%d\", &id) I can do this.",
    },
    3: {
        description: "The agency's security gate system has malfunctioned. The conditional logic controlling access doors is broken — some doors stay open when they should be locked. Fix the control flow to restore proper gate operation.",
        briefing: "IMPRESSIVE!! The agency has been waiting for someone like you. Register now by Entering printing the name of you and enter the batch code 9870— Agent Platypus needs a partner on the field ",
    },
    4: {
        description: "You are a secret agent trying to access a classified system. The system password is 'agent007'. You have maximum 3 attempts. Use a loop to allow repeated password attempts. If the password is correct, print 'Access Granted'. If incorrect, print 'Wrong Password'. After 3 failed attempts, print 'System Locked'.",
        briefing: "Agent, a classified terminal has been discovered at the enemy base. The password is 'agent007' — but the system only allows 3 attempts before permanent lockdown. Write a loop-based access protocol: read the password each attempt, print 'Access Granted' if correct (and break), 'Wrong Password' if wrong, and 'System Locked' after 3 failures.",
    },
    5: {
        description: "The agency's codebase has become a monolithic mess — thousands of lines in a single file with duplicated logic everywhere. Refactor the system by extracting reusable functions with proper signatures and return types.",
        briefing: "Learn to declare and define functions in C. Understand parameter passing (by value vs by reference), return types, function prototypes, and recursive functions. Write modular, reusable code.",
    },
    6: {
        description: "The encryption module needs arithmetic verification. Use C arithmetic operators to compute a checksum for the transmission.",
        briefing: "Agent, the cipher requires a checksum. Read two operands and broadcast their sum. Print 'Sum: X'.",
    },
    7: {
        description: "HQ needs a grading system for new recruits. Build conditional logic that classifies scores into letter grades.",
        briefing: "Read a recruit's score and route it through conditional branches. Print the correct letter grade.",
    },
    8: {
        description: "Calendar protocols require correct leap-year detection. Combine logical operators to evaluate the standard leap-year rule.",
        briefing: "The year database is corrupt. Read a year and verify it against the leap-year rule. Print 'Leap Year' or 'Not Leap Year'.",
    },
    9: {
        description: "The radio module routes signal codes through a switch board. Replace the tangled if/else chains with a clean switch statement.",
        briefing: "Route the incoming signal code through a switch. Map 1→'One', 2→'Two', 3→'Three', else 'Unknown Signal'.",
    },
    10: {
        description: "Extract sequential intelligence from a stream of natural numbers. Use a while loop to accumulate a running total.",
        briefing: "Read n and sum the natural numbers from 1 to n with a while loop. Print 'Sum: X'.",
    },
    11: {
        description: "The transmitter needs a sequenced burst. Use a for loop to emit the number line 1..n.",
        briefing: "Read n and emit the sequence 1 2 3 ... n, space-separated, using a for loop.",
    },
    12: {
        description: "The feed parser must stop safely at the end-of-stream marker. Use break to halt accumulation at zero.",
        briefing: "Read integers and sum them, breaking on 0. Print 'Sum: X'.",
    },
    13: {
        description: "Surveillance grids need a multiplication table overlay. Use nested loops to render a table for any input.",
        briefing: "Read n and print its multiplication table from 1 to 10 using nested loops.",
    },
    14: {
        description: "Every agent needs a signature routine. Build a void function that broadcasts a standard greeting.",
        briefing: "Define void greet() and call it from main(). Output 'Hello Agent, ready for duty'.",
    },
    15: {
        description: "Field reports need a max function. Build a reusable routine that returns the larger of two values.",
        briefing: "Define a max function, read two integers, and print 'Max: X'.",
    },
    16: {
        description: "Scope discipline prevents data leaks. Demonstrate static variable persistence inside a function.",
        briefing: "Use a static counter in a function called twice from main(). Output 'Count: 1 Count: 2'.",
    },
    17: {
        description: "Intercept a linear data stream and aggregate it. Store values in an array and compute the total.",
        briefing: "Read n then n integers into an array, sum them, and print 'Sum: X'.",
    },
    18: {
        description: "Analyze intercepted text for vowel density. Traverse a string and count its vowels.",
        briefing: "Read a string and print 'Vowels: X' counting a, e, i, o, u.",
    },
    19: {
        description: "A pointer is your surgical instrument. Swap two values through dereferenced pointers.",
        briefing: "Read two integers, swap them using pointers, and print 'A: X B: Y'.",
    },
    20: {
        description: "The heap is a controlled environment. Allocate, assign, verify, and release a single integer.",
        briefing: "Allocate one int with malloc, set it to 42, print it, and free it. Output '42'.",
    },
    21: {
        description: "Multi-layer decisions require nested logic. Determine the largest of three operatives' scores.",
        briefing: "Read three integers and print 'Max: X' for the largest.",
    },
    22: {
        description: "Prime keys are the backbone of encryption. Optimize a primality check with an efficient loop.",
        briefing: "Read an integer and print exactly 'Prime' or 'Not Prime'.",
    },
    23: {
        description: "Walk memory without an index. Traverse an array using pointer arithmetic.",
        briefing: "Read n then n integers, sum them using pointers, and print 'Sum: X'.",
    },
    24: {
        description: "Model the operatives with structures. Group related fields into a single blueprinted type.",
        briefing: "Define a struct with name and id, initialize to 'Platypus' / 007, print 'Agent: Platypus ID: 007'.",
    },
    25: {
        description: "Compose formatted intelligence without printing directly. Use sprintf to build a report buffer.",
        briefing: "Read a codename and clearance, compose with sprintf, and print the report.",
    },
    26: {
        description: "The heap can grow to fit the payload. Allocate an array at runtime and aggregate it.",
        briefing: "Allocate an array of n ints with malloc, sum them, print 'Sum: X', then free.",
    },
    27: {
        description: "Recursion unwraps nested signals. Compute a factorial with a recursive function.",
        briefing: "Write a recursive factorial and print 'Factorial: X'.",
    },
    28: {
        description: "The heap is hostile to the unprepared. Audit allocations with NULL guards.",
        briefing: "Allocate with malloc, check NULL, print 'Memory Allocated' on success, then free.",
    },
    29: {
        description: "The Fibonacci sequence powers the signal generator. Master recursion with a classic definition.",
        briefing: "Write a recursive fibonacci and print 'Fibonacci: X'.",
    },
    30: {
        description: "Bit fields hide secrets in plain sight. Count the set bits of an intercepted key.",
        briefing: "Read an integer and print 'Set Bits: X' counting binary 1-bits.",
    },
    31: {
        description: "Reversing a buffer is a core manipulation skill. Rewrite a string in place.",
        briefing: "Read a string and print 'Reversed: X'.",
    },
    32: {
        description: "Rebuild a 2D grid by transposing rows and columns. Master nested array access.",
        briefing: "Read a 2x2 matrix and print its transpose.",
    },
    33: {
        description: "Enumeration gives names to states. Route a day code through a typed enum + switch.",
        briefing: "Read 0-6 and print the weekday (0=Monday ... 6=Sunday) via enum + switch.",
    },
    34: {
        description: "Function pointers let behavior be chosen at runtime. Wire a callback compass.",
        briefing: "Define add/sub, select via function pointer, compute 5+3, print 'Result: 8'.",
    },
    35: {
        description: "Linked lists chain data without fixed sizes. Insert nodes and count the chain.",
        briefing: "Build a 3-node list (1,2,3), traverse it, print 'Nodes: 3'.",
    },
    36: {
        description: "LIFO discipline is a systems staple. Implement an array-backed stack.",
        briefing: "Push 10 and 20, pop once, print 'Top: 10'.",
    },
    37: {
        description: "FIFO dispatch keeps streams fair. Implement a circular queue.",
        briefing: "Enqueue 5 and 7, dequeue once, print 'Front: 7'.",
    },
    38: {
        description: "Tokenize a raw intelligence stream. Count the words in a sentence.",
        briefing: "Read a sentence with fgets and print 'Words: X'.",
    },
    39: {
        description: "Order is a weapon. Bubble-sort an out-of-order payload.",
        briefing: "Read n then n ints, bubble-sort ascending, print the list.",
    },
    40: {
        description: "Logarithmic search beats linear brute force. Binary-search a sorted array.",
        briefing: "Binary-search [2,4,6,8,10] for the input. Print 'Found at: X' or 'Not Found'.",
    },
    41: {
        description: "Inject exponential computing power. Write a recursive exponentiation routine.",
        briefing: "Read base and exponent, compute recursively, print 'Power: X'.",
    },
    42: {
        description: "Legacy input routines are a liability. Audit and patch unsafe buffer reads.",
        briefing: "Read a string safely with fgets, trim the newline, print 'Length: X'.",
    },
    43: {
        description: "Compile-time constants cost nothing at runtime. Optimize with macros.",
        briefing: "Define SQUARE(x), read an int, print 'Square: X'.",
    },
    44: {
        description: "XOR ciphers are reversible and everywhere. Decrypt an intercepted byte.",
        briefing: "Read a cipher integer, XOR with key 42, print 'Decrypted: X'.",
    },
    45: {
        description: "Rewire the chain end-to-end. Reverse a linked list's pointers.",
        briefing: "Build 1->2->3, reverse it, print 'Head: 3'.",
    },
    46: {
        description: "Pointer-to-pointer grids scale to any size. Allocate and audit a dynamic matrix.",
        briefing: "Allocate a 3x3 matrix, sum the main diagonal, print 'Trace: 15', and free.",
    },
    47: {
        description: "Decay large payloads to a single digit. Compute the digital root.",
        briefing: "Read an integer and print 'Root: X' — its digital root.",
    },
    48: {
        description: "Master raw bit manipulation. Reverse the bit order of a byte.",
        briefing: "Read a value 0-255 and print 'Reversed: X' with bits reversed.",
    },
    49: {
        description: "Selection sorting minimizes swaps. Master quadratic selection sort.",
        briefing: "Read n then n ints, selection-sort ascending, print the list.",
    },
    50: {
        description: "Compress repetitive streams. Encode runs of identical characters.",
        briefing: "Read a string and print its RLE as count+char tokens.",
    },
    51: {
        description: "Design a minimal hash for keyed lookups. Hash a codename with modulo arithmetic.",
        briefing: "Read a string and print 'Hash: X' = sum of codes modulo 97.",
    },
    52: {
        description: "The classic recursion puzzle. Log every move of Tower of Hanoi.",
        briefing: "Solve Hanoi for n=3, printing each move from A to C via B.",
    },
    53: {
        description: "Decouple traversal from operation. Apply a callback across a grid.",
        briefing: "Apply a square callback to [[1,2],[3,4]] and print '1 4\\n9 16'.",
    },
    54: {
        description: "Layer your data with nested structs. Model an operative's full dossier.",
        briefing: "Define a nested struct with codename 'Wolf' / clearance 7. Print 'Codename: Wolf Clearance: 7'.",
    },
    55: {
        description: "Provision many agents at once. Allocate and audit a struct array on the heap.",
        briefing: "Allocate an array of 3 agents (ids 1,2,3), print 'Last Agent: 3', and free.",
    },
    56: {
        description: "Ring buffers wrap around and overwrite the oldest data. Build a capacity-3 buffer.",
        briefing: "Write 1,2,3,4 into a capacity-3 ring (4 overwrites 1). Print 'Buffer: 4 2 3'.",
    },
    57: {
        description: "Triple-nested loops power matrix products. Multiply two 2x2 grids.",
        briefing: "Read two 2x2 matrices and print their product.",
    },
    58: {
        description: "No libc shortcuts allowed. Implement substring search by hand.",
        briefing: "Search 'hello world' for the input. Print 'Found at: X' or 'Not Found'.",
    },
    59: {
        description: "Mirrored phrases verify identity. Check a word against its reversal.",
        briefing: "Read a word and print exactly 'Palindrome' or 'Not Palindrome'.",
    },
    60: {
        description: "The final mission unites structs, arrays, and logic into a complete intelligence report.",
        briefing: "Define struct Agent { int id; int score; }, create a team of 3 (scores 85, 95, 70), and print 'Top Score: 95'.",
    },
};
