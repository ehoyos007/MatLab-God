# Plan: MatLab-God

## Phase 1 — MVP

**Goal:** Playable challenge rooms for Modules 1-4 with scoring and persistence.

### Step 1: Project Scaffold
- Create folder structure: `data/modules/`, `utils/`, `assets/icons/`, `assets/sounds/`
- Initialize `progress.mat` with empty structure

### Step 2: Utility Functions
Build standalone `.m` files before touching the app:
1. `safeEval.m` — Wraps `evalc()` in try/catch, uses `timer` for 5-second timeout, pre-scans for dangerous functions (`delete`, `system`, `!`, `rmdir`)
2. `checkAnswer.m` — Takes student code, challenge struct. Routes to string comparison or safeEval based on `challenge.useEval`. Returns `{isCorrect, output, errorMsg}`
3. `updateProgress.m` — Loads/saves `progress.mat`. Functions: `loadProgress()`, `saveChallenge(moduleIdx, challengeIdx, stars, attempts, hints)`, `getModuleStars(moduleIdx)`
4. `loadModule.m` — Loads a `moduleXX.mat` file, returns array of challenge structs
5. `generateCheatSheet.m` — Iterates progress, collects explanations from completed challenges, formats as text

### Step 3: Challenge Content (Modules 1-4)
Create `.mat` files with 3-5 challenges each. Each challenge is a struct with fields defined in PRD. Focus on fix-the-bug as primary type. Include 1 predict-output per module for variety.

### Step 4: App Designer UI
Build `MatLabGod.mlapp` with these views (using tab groups or panel visibility toggling):
1. **Main Menu** — Title, 4 buttons (Modules, Exam Prep, Cheat Sheet, Settings)
2. **Module Select** — Grid of 11 panels showing module name + star count. Clickable.
3. **Challenge View** — Code TextArea (editable), expected output TextArea (read-only), hint button, submit button, feedback label, star display
4. **Result Overlay** — Stars earned, explanation, next/retry buttons

### Step 5: Wiring
Connect UI callbacks to utility functions. Flow:
1. Module select -> `loadModule(n)` -> display first challenge
2. Submit -> `checkAnswer()` -> update feedback + stars
3. Hint -> reveal next hint, decrement max stars
4. Next -> advance challenge index or return to module select
5. On any completion -> `updateProgress()`

### Step 6: Test
- Play through all Module 1-4 challenges
- Verify progress saves/loads across app restarts
- Test eval timeout with intentional infinite loop
- Test all 3 star scenarios

---

## Phase 2 — Exam Prep & Theme

### Step 7: Additional Challenge Types
- Predict-output: Show code + multiple choice or free-text answer field
- Fill-in-blank: Show code with `___` placeholders, student fills in

### Step 8: Exam Prep Mode
- Select scope: Midterm 1 (M1-4), Midterm 2 (M5-9), Final (all)
- Timer with countdown display
- Random question selection from relevant modules
- No code execution, output prediction only
- Score summary at end

### Step 9: Cheat Sheet
- `generateCheatSheet.m` builds structured text from completed challenges
- Display in a scrollable text panel
- "Export to .txt" button for printing

### Step 10: Theming
- Dark background (#1a1a2e or similar)
- Neon green (#39ff14), cyan (#00fff5), magenta (#ff006e) accents
- Monospace font for all code areas
- Star icons (filled yellow, empty gray)
- Green/red feedback colors on submit

---

## Phase 3 — Full Content

### Step 11: Modules 5-11 Content
- 3-5 challenges per module, escalating difficulty
- Mix of all 3 challenge types
- Align to textbook chapters and homework patterns

### Step 12: Polish
- Sound effects (short .wav files, togglable)
- Progress dashboard with bar charts
- Edge case handling throughout
