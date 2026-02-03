# Context: MatLab-God

## Domain

**MatLab-God** is a personal MATLAB App Designer study tool for ECH 3854 (Engineering Computations) at USF, Spring 2025. The course teaches MATLAB fundamentals across 11 modules, with paper-based exams allowing one note sheet.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | MATLAB App Designer | Runs inside MATLAB, no extra dependencies |
| Game mechanic | Puzzle/challenge rooms | Self-contained, easy to build incrementally |
| Primary challenge type | Fix the bug | Most engaging, tests real debugging skills |
| Code execution | Hybrid (string + eval) | String check for simple, eval for complex |
| Scoring | 3-star system | Motivating without being punitive |
| Hints | Progressive (3) + solution reveal | Balances learning with frustration prevention |
| Bonus features | Exam prep mode + cheat sheet builder | Directly useful for course exams |
| UI theme | Retro/game-like (dark + neon) | Makes practice feel like play |
| Audience | Personal use only | Simplifies scope significantly |

## Course Details

- **Textbook:** MATLAB for Engineers, Holly Moore, 6th Ed (Pearson)
- **MATLAB version:** 2024b
- **Exams:** Paper-based, closed book, 1 note sheet allowed
- **11 modules:** Basics, Functions, Matrices, Plotting, User Functions, I/O, Statistics, Logic, Loops, Advanced Matrices, Numerical Methods

## Glossary

| Term | Meaning |
|------|---------|
| Challenge room | A module's set of 5-10 coding puzzles |
| Star rating | 0-3 score per challenge based on attempts and hints |
| safeEval | Wrapper around eval() with try/catch and timeout |
| Cheat sheet | Auto-generated 1-page reference from completed challenges |
| Exam prep mode | Timed, no-execution practice simulating paper exams |
