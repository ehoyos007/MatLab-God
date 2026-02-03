import { Challenge, GameProgress, ChallengeProgress, ExamScore } from './types';

const STORAGE_KEY = 'matlab-god-progress';

// --- Progress persistence ---

export function loadProgress(): GameProgress {
  if (typeof window === 'undefined') return { modules: {}, examScores: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { modules: {}, examScores: [] };
}

export function saveProgress(progress: GameProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getChallengeProgress(
  progress: GameProgress,
  moduleId: number,
  challengeId: string
): ChallengeProgress | null {
  return progress.modules[moduleId]?.[challengeId] ?? null;
}

export function saveChallengeResult(
  progress: GameProgress,
  moduleId: number,
  challengeId: string,
  stars: number,
  attempts: number,
  hintsUsed: number
): GameProgress {
  const updated = { ...progress, modules: { ...progress.modules } };
  if (!updated.modules[moduleId]) updated.modules[moduleId] = {};
  updated.modules[moduleId] = {
    ...updated.modules[moduleId],
    [challengeId]: { stars, attempts, hintsUsed, completed: true },
  };
  saveProgress(updated);
  return updated;
}

// --- Answer checking ---

export function checkAnswer(
  studentCode: string,
  challenge: Challenge
): { correct: boolean; feedback: string } {
  const trimmed = studentCode.trim();

  if (challenge.type === 'predict_output') {
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const correct = normalize(trimmed) === normalize(challenge.expectedOutput);
    return {
      correct,
      feedback: correct ? '' : 'Not quite. Try again.',
    };
  }

  // For fix_bug and fill_blank: use validator if available, else string match
  if (challenge.validator) {
    const correct = challenge.validator(trimmed);
    return {
      correct,
      feedback: correct ? '' : 'Your code doesn\'t produce the expected result.',
    };
  }

  // Fallback: normalized string comparison
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
  const correct = normalize(trimmed) === normalize(challenge.correctCode);
  return {
    correct,
    feedback: correct ? '' : 'Code does not match the expected solution.',
  };
}

// --- Star calculation ---

export function calculateStars(attempts: number, hintsUsed: number): number {
  let stars = 3;
  // Lose a star for each attempt after the first
  if (attempts > 1) stars--;
  if (attempts > 2) stars--;
  // Hints after the first free one cost stars
  if (hintsUsed > 1) stars--;
  if (hintsUsed > 2) stars--;
  return Math.max(0, Math.min(3, stars));
}

// --- Module stats ---

export function getModuleStars(
  progress: GameProgress,
  moduleId: number,
  totalChallenges: number
): { earned: number; possible: number } {
  const mod = progress.modules[moduleId];
  if (!mod) return { earned: 0, possible: totalChallenges * 3 };
  let earned = 0;
  for (const ch of Object.values(mod)) {
    earned += ch.stars;
  }
  return { earned, possible: totalChallenges * 3 };
}

// --- Cheat sheet ---

export function generateCheatSheet(
  progress: GameProgress,
  modules: { id: number; name: string; challenges: Challenge[] }[]
): string {
  const lines: string[] = ['=== MATLAB CHEAT SHEET (Auto-Generated) ===', ''];

  for (const mod of modules) {
    const modProgress = progress.modules[mod.id];
    if (!modProgress) continue;

    const completedChallenges = mod.challenges.filter(
      (ch) => modProgress[ch.id]?.completed
    );
    if (completedChallenges.length === 0) continue;

    lines.push(`--- Module ${mod.id}: ${mod.name} ---`);
    for (const ch of completedChallenges) {
      lines.push(`  * ${ch.title}`);
      lines.push(`    ${ch.explanation}`);
    }
    lines.push('');
  }

  if (lines.length <= 2) {
    lines.push('No challenges completed yet. Start playing to build your cheat sheet!');
  }

  return lines.join('\n');
}

// --- Exam prep ---

export interface ExamQuestion {
  challenge: Challenge;
  moduleId: number;
}

export function generateExamQuestions(
  modules: { id: number; challenges: Challenge[] }[],
  scopeModuleIds: number[],
  count: number
): ExamQuestion[] {
  const pool: ExamQuestion[] = [];
  for (const mod of modules) {
    if (!scopeModuleIds.includes(mod.id)) continue;
    for (const ch of mod.challenges) {
      pool.push({ challenge: ch, moduleId: mod.id });
    }
  }
  // Shuffle and pick count
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function saveExamScore(
  progress: GameProgress,
  score: ExamScore
): GameProgress {
  const updated = { ...progress, examScores: [...progress.examScores, score] };
  saveProgress(updated);
  return updated;
}
