export type ChallengeType = 'fix_bug' | 'predict_output' | 'fill_blank';

export interface Challenge {
  id: string;
  module: number;
  type: ChallengeType;
  title: string;
  description: string;
  brokenCode: string;
  correctCode: string;
  expectedOutput: string;
  hints: string[];
  explanation: string;
  validator?: (studentCode: string) => boolean; // custom JS validator
}

export interface ModuleData {
  id: number;
  name: string;
  shortName: string;
  challenges: Challenge[];
}

export interface ChallengeProgress {
  stars: number;
  attempts: number;
  hintsUsed: number;
  completed: boolean;
}

export interface ModuleProgress {
  [challengeId: string]: ChallengeProgress;
}

export interface ExamScore {
  score: number;
  total: number;
  scope: string;
  timestamp: number;
  moduleBreakdown: { [moduleId: number]: { correct: number; total: number } };
}

export interface GameProgress {
  modules: { [moduleId: number]: ModuleProgress };
  examScores: ExamScore[];
}
