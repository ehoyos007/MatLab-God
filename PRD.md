# MatLab-God: Product Requirements Document

## Overview

**MatLab-God** is a MATLAB App Designer application with a game-like puzzle interface designed to help a student learn MATLAB for ECH 3854 (Engineering Computations) at USF. The app maps 1:1 to the course's 11-module syllabus and features challenge rooms, a star-based scoring system, progressive hints, exam prep tools, and an auto-generated cheat sheet.

---

## Target User

- **Who:** Single user (the developer) studying ECH 3854 Spring 2025
- **Skill level:** Some MATLAB basics (variables, syntax), needs practice with functions, matrices, loops, statistics
- **Goal:** Supplement course material with interactive, game-like practice aligned to the syllabus

---

## Platform & Technology

| Aspect | Decision |
|--------|----------|
| **Platform** | MATLAB App Designer (.mlapp) |
| **Runtime** | MATLAB 2024b (USF site license) |
| **Toolboxes** | None required beyond base MATLAB |
| **Distribution** | Local use only |
| **Code execution** | Hybrid: string comparison for simple challenges, `eval()` with `try/catch` for advanced ones |

### Why App Designer?
- Runs natively inside the same MATLAB environment used for class
- No external dependencies or web hosting
- Direct access to MATLAB's execution engine for code validation
- Aligns with the course's MATLAB-centric workflow

---

## Core Mechanics

### Challenge Rooms (Puzzle System)

Each of the 11 modules is a **"room"** containing 5-10 challenges. Challenge types:

| Type | Description | Star Criteria |
|------|-------------|---------------|
| **Fix the Bug** | Given broken code, find and fix the error | Stars: correctness, attempts, hint usage |
| **Predict the Output** | Read code, predict what it produces | Stars: correctness on first try |
| **Fill in the Blank** | Complete partially-written code | Stars: correctness, attempts |

Primary focus is **Fix the Bug** challenges, with the other types mixed in for variety.

### Scoring: 3-Star System

Each challenge awards 0-3 stars:
- **3 stars:** Correct on first attempt, no hints used
- **2 stars:** Correct with 1 hint or on second attempt
- **1 star:** Correct with 2+ hints or 3+ attempts
- **0 stars:** Not yet completed

Module progress displayed as total stars earned / total possible (e.g., 18/30).

### Hint System

Each challenge has 3 progressive hints + a full solution reveal:

1. **Hint 1** (free): Vague nudge ("Check the loop bounds")
2. **Hint 2** (costs 1 star max): More specific ("Line 3 has an off-by-one error")
3. **Hint 3** (costs 1 star max): Nearly gives it away ("Change `i <= n` to `i < n`")
4. **Solution reveal** (after 3 failed attempts): Full solution with line-by-line explanation

---

## Module Map (Syllabus Alignment)

| Room | Module | Topic | Key Concepts |
|------|--------|-------|--------------|
| 1 | Module 1 | MATLAB Basics | Variables, arrays, formatting, workspace |
| 2 | Module 2 | Using Functions | Built-in functions, `help`, `doc`, math functions |
| 3 | Module 3 | Matrices | Creation, indexing, colon operator, concatenation |
| 4 | Module 4 | Plotting | `plot`, `xlabel`, `title`, subplots, formatting |
| 5 | Module 5 | User Functions | Function files, input/output args, scope |
| 6 | Module 6 | User I/O | `input`, `disp`, `fprintf`, file I/O |
| 7 | Module 7 | Statistics | Mean, variance, PDFs, histograms, confidence intervals |
| 8 | Module 8 | Logical Functions | `if/elseif/else`, `switch`, relational operators |
| 9 | Module 9 | Loops | `for`, `while`, nested loops, `break`, vectorization |
| 10 | Module 10 | Advanced Matrices | Matrix algebra, determinants, inverse, systems of equations |
| 11 | Module 11 | Numerical Methods | Symbolic math, numerical techniques (TBD) |

---

## Bonus Features

### Exam Prep Mode

Simulates paper-based exam conditions (no MATLAB execution):
- Timed sessions (configurable: 15, 30, 60 min)
- Syntax recall flashcards (e.g., "How do you create a 3x3 identity matrix?")
- Output prediction questions only (no code running, mirrors actual exam format)
- Score summary at the end with weak-area identification
- Covers content cumulatively (Midterm 1: Modules 1-4, Midterm 2: Modules 5-9, Final: All)

### Cheat Sheet Builder

Auto-generates a condensed reference sheet as you progress:
- Unlocks syntax snippets as you complete challenges
- Organized by module/topic
- Exportable as a formatted text file (for printing as the allowed 1-page exam note sheet)
- Highlights concepts you struggled with (low-star challenges)

---

## UI/UX Design

### Theme: Game-Like / Retro

- **Color scheme:** Dark background with neon accent colors (think arcade/retro terminal)
- **Typography:** Monospace fonts for code, bold headers
- **Visual elements:**
  - Module select screen as a "world map" or room grid
  - Star icons for scoring (filled/empty)
  - Progress bars per module
  - Simple pixel-art or icon decorations
  - Color-coded challenge types
- **Feedback animations:**
  - Green flash on correct answer
  - Red shake on wrong answer
  - Star fill animation on completion
  - Sound effects (optional toggle): success chime, error buzz

### Screen Flow

```
[Main Menu]
    |
    |-- [Module Select] (11 rooms, star counts shown)
    |       |
    |       |-- [Challenge View] (code editor + output panel + hints)
    |       |       |-- Submit -> [Result: stars + explanation]
    |       |       |-- Hints -> [Progressive reveal]
    |       |
    |       |-- [Module Summary] (stars, completed %, weak areas)
    |
    |-- [Exam Prep] (select exam scope -> timed session)
    |
    |-- [Cheat Sheet] (view/export auto-generated reference)
    |
    |-- [Progress Dashboard] (overall stats, module breakdown)
    |
    |-- [Settings] (sound on/off, reset progress)
```

### App Designer Layout (Challenge View)

```
+--------------------------------------------------+
| [< Back]  Module 3: Matrices  [Hint] [Stars: **] |
+--------------------------------------------------+
| Challenge 4/8: Fix the Bug              Type: Bug |
+----------------------------+---------------------+
|                            |                     |
|  Code Editor Panel         |  Expected Output    |
|  (TextArea, editable)      |  (TextArea, read)   |
|                            |                     |
|  A = [1 2 3; 4 5 6];      |  ans =              |
|  B = A(2,3)               |      6              |
|  C = A(:,2)               |  ans =              |
|                            |      2              |
|                            |      5              |
+----------------------------+---------------------+
| [Run Code]  [Submit Answer]  [Show Hint (1/3)]   |
+--------------------------------------------------+
| Output/Feedback Panel                             |
| > Your output: ...                                |
+--------------------------------------------------+
```

---

## Code Execution Strategy

### String Check (Simple Challenges)
```matlab
% Compare student answer to expected
if strcmp(strtrim(studentAnswer), strtrim(expectedAnswer))
    % Correct
end
```

### eval() Execution (Advanced Challenges)
```matlab
try
    % Capture output
    evalc(studentCode);
    % Compare workspace variables or output
catch ME
    % Show error message to student
    feedbackText = ['Error: ' ME.message];
end
```

### Safety Considerations
- Wrap all `eval()` calls in `try/catch`
- Set a timeout using `timer` to prevent infinite loops
- Restrict dangerous functions (e.g., `delete`, `system`, `!`) via string scanning before eval
- Since this is single-user local, security is low concern but infinite loops must be handled

---

## Data Storage

All progress stored in a local `.mat` file:

```matlab
progress.modules(i).challenges(j).stars = 2;
progress.modules(i).challenges(j).attempts = 3;
progress.modules(i).challenges(j).hintsUsed = 1;
progress.modules(i).challenges(j).completed = true;
progress.examScores = [85, 72, ...];
progress.cheatSheet = struct(...);  % Auto-built entries
```

Challenge content stored in structured `.mat` or `.m` data files per module.

---

## Content Format (Per Challenge)

```matlab
challenge.id = 'M3_C4';
challenge.module = 3;
challenge.type = 'fix_bug';          % 'fix_bug', 'predict_output', 'fill_blank'
challenge.title = 'Matrix Indexing Error';
challenge.description = 'This code should extract the element at row 2, column 3, but has a bug.';
challenge.brokenCode = 'A = [1 2 3; 4 5 6];\nB = A(3,2);';
challenge.correctCode = 'A = [1 2 3; 4 5 6];\nB = A(2,3);';
challenge.expectedOutput = 'B =\n     6';
challenge.hints = {
    'Check the indexing order: A(row, col)'
    'The row and column indices are swapped'
    'Change A(3,2) to A(2,3)'
};
challenge.explanation = 'MATLAB uses (row, col) indexing. A(2,3) gets row 2, column 3 = 6.';
challenge.useEval = true;            % false = string comparison only
```

---

## Architecture Overview

```
MatLab-God/
├── MatLabGod.mlapp              % Main App Designer file
├── data/
│   ├── modules/
│   │   ├── module01_basics.mat
│   │   ├── module02_functions.mat
│   │   ├── ...
│   │   └── module11_numerical.mat
│   ├── progress.mat             % User progress (auto-saved)
│   └── cheatsheet.mat           % Auto-generated reference data
├── utils/
│   ├── loadModule.m             % Load challenge data for a module
│   ├── checkAnswer.m            % Validate student answer (string or eval)
│   ├── updateProgress.m         % Save progress to .mat
│   ├── generateCheatSheet.m     % Build cheat sheet from progress
│   ├── safeEval.m               % Sandboxed eval with timeout
│   └── examPrepQuestions.m      % Generate exam prep question sets
├── assets/
│   ├── icons/                   % Star icons, module icons
│   └── sounds/                  % Optional sound effects
├── ECH3854_Syllabus_Outline.md  % Course reference
├── PRD.md                       % This file
├── TASKS.md
├── PLAN.md
├── PROGRESS.md
├── CONTEXT.md
└── TEST_LOG.md
```

---

## Risks & Constraints

| Risk | Mitigation |
|------|------------|
| `eval()` infinite loops | Timer-based timeout (5 sec max), pre-scan for `while true` |
| App Designer UI limitations | Keep UI simple; avoid complex animations; use uihtml for richer elements if needed |
| Content creation is time-consuming | Start with 3-5 challenges per module, expand as semester progresses |
| MATLAB version differences | Target 2024b only; test on USF license |
| No multiplayer/sharing needed | Single-user simplifies everything |

---

## MVP Scope (Phase 1)

Build the minimum to start using immediately:

1. Main menu with module selection
2. Challenge view with code editor, submit, and feedback
3. Fix-the-bug challenges for Modules 1-4 (3 challenges each)
4. Star scoring and progress persistence
5. Basic hint system (3 hints per challenge)

### Phase 2

6. Predict-output and fill-in-blank challenge types
7. Exam prep mode (Midterm 1 scope)
8. Cheat sheet auto-generation
9. Themed UI (colors, icons, animations)

### Phase 3

10. Challenges for Modules 5-11
11. Full exam prep (Midterm 2, Final)
12. Sound effects
13. Polish and edge cases
