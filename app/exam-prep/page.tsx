'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { MODULES } from '@/lib/modules';
import {
  generateExamQuestions,
  saveExamScore,
  loadProgress,
  ExamQuestion,
} from '@/lib/engine';
import { ExamScore, GameProgress } from '@/lib/types';

type Phase = 'setup' | 'session' | 'results';

const SCOPES: { label: string; modules: number[] }[] = [
  { label: 'Midterm 1 (M1-4)', modules: [1, 2, 3, 4] },
  { label: 'Midterm 2 (M5-9)', modules: [5, 6, 7, 8, 9] },
  { label: 'Final (M1-11)', modules: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
];

const TIME_OPTIONS = [15, 30, 60];
const QUESTION_COUNT = 10;

export default function ExamPrepPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [scopeIdx, setScopeIdx] = useState(0);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState<{ correct: boolean; moduleId: number }[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const endSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('results');
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'session') return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          endSession();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, endSession]);

  // Save score on results
  useEffect(() => {
    if (phase !== 'results' || answers.length === 0) return;
    const breakdown: ExamScore['moduleBreakdown'] = {};
    for (const a of answers) {
      if (!breakdown[a.moduleId]) breakdown[a.moduleId] = { correct: 0, total: 0 };
      breakdown[a.moduleId].total++;
      if (a.correct) breakdown[a.moduleId].correct++;
    }
    const score: ExamScore = {
      score: answers.filter((a) => a.correct).length,
      total: answers.length,
      scope: SCOPES[scopeIdx].label,
      timestamp: Date.now(),
      moduleBreakdown: breakdown,
    };
    const progress = loadProgress();
    saveExamScore(progress, score);
  }, [phase, answers, scopeIdx]);

  function startExam() {
    const scope = SCOPES[scopeIdx];
    const qs = generateExamQuestions(MODULES, scope.modules, QUESTION_COUNT);
    setQuestions(qs);
    setCurrentQ(0);
    setAnswers([]);
    setAnswer('');
    setSubmitted(false);
    setLastCorrect(null);
    setSecondsLeft(timeLimit * 60);
    setPhase('session');
  }

  function submitAnswer() {
    if (submitted || !questions[currentQ]) return;
    const q = questions[currentQ];
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

    let correct: boolean;
    if (q.challenge.type === 'predict_output') {
      correct = normalize(answer) === normalize(q.challenge.expectedOutput);
    } else {
      correct = normalize(answer) === normalize(q.challenge.expectedOutput);
    }

    setLastCorrect(correct);
    setSubmitted(true);
    setAnswers((prev) => [...prev, { correct, moduleId: q.moduleId }]);
  }

  function nextQuestion() {
    if (currentQ + 1 >= questions.length) {
      endSession();
    } else {
      setCurrentQ((c) => c + 1);
      setAnswer('');
      setSubmitted(false);
      setLastCorrect(null);
    }
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const timerDanger = secondsLeft < 120;

  // --- SETUP ---
  if (phase === 'setup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <Link href="/" className="text-[--color-dim] hover:text-[--color-cyan] text-sm mb-4">
          &larr; Back to Menu
        </Link>
        <h1 className="text-4xl font-bold text-[--color-gold]">EXAM PREP</h1>
        <p className="text-[--color-dim] text-center">
          Predict MATLAB output under time pressure. 10 questions per session.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
          <label className="text-sm text-[--color-dim]">Exam Scope</label>
          <div className="flex flex-col gap-2">
            {SCOPES.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setScopeIdx(i)}
                className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                  scopeIdx === i
                    ? 'bg-[--color-gold] text-[--color-bg]'
                    : 'bg-[--color-panel] text-[--color-dim] hover:text-[--color-text]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <label className="text-sm text-[--color-dim] mt-2">Time Limit</label>
          <div className="flex gap-2">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTimeLimit(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  timeLimit === t
                    ? 'bg-[--color-cyan] text-[--color-bg]'
                    : 'bg-[--color-panel] text-[--color-dim] hover:text-[--color-text]'
                }`}
              >
                {t} min
              </button>
            ))}
          </div>

          <button
            onClick={startExam}
            className="mt-4 py-4 rounded-lg font-bold text-lg bg-[--color-green] text-[--color-bg] hover:shadow-[0_0_20px_var(--color-green)] transition-all"
          >
            START EXAM
          </button>
        </div>
      </div>
    );
  }

  // --- SESSION ---
  if (phase === 'session' && questions[currentQ]) {
    const q = questions[currentQ];
    return (
      <div className="min-h-screen flex flex-col">
        {/* Timer bar */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-4 py-2 font-bold text-lg ${
            timerDanger ? 'bg-[--color-pink] text-white timer-pulse' : 'bg-[--color-panel] text-[--color-cyan]'
          }`}
        >
          <span>
            Q{currentQ + 1}/{questions.length}
          </span>
          <span className="font-mono text-2xl">
            {mm}:{ss}
          </span>
          <span className="text-sm text-[--color-dim]">Module {q.moduleId}</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 max-w-2xl mx-auto w-full">
          <h2 className="text-xl font-bold text-[--color-gold]">{q.challenge.title}</h2>
          <p className="text-sm text-[--color-dim] text-center">{q.challenge.description}</p>

          <pre className="code-editor readonly w-full whitespace-pre-wrap">{q.challenge.brokenCode}</pre>

          <p className="text-sm font-bold text-[--color-cyan]">What is the output?</p>

          <textarea
            className="code-editor w-full"
            rows={3}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitted}
            placeholder="Type the predicted output..."
          />

          {lastCorrect !== null && (
            <div
              className={`text-lg font-bold ${
                lastCorrect ? 'text-[--color-green]' : 'text-[--color-pink]'
              }`}
            >
              {lastCorrect ? 'Correct!' : `Wrong. Expected: ${q.challenge.expectedOutput}`}
            </div>
          )}

          {!submitted ? (
            <button
              onClick={submitAnswer}
              disabled={!answer.trim()}
              className="py-3 px-8 rounded-lg font-bold bg-[--color-cyan] text-[--color-bg] hover:shadow-[0_0_20px_var(--color-cyan)] transition-all disabled:opacity-40"
            >
              SUBMIT
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="py-3 px-8 rounded-lg font-bold bg-[--color-gold] text-[--color-bg] hover:shadow-[0_0_20px_var(--color-gold)] transition-all"
            >
              {currentQ + 1 >= questions.length ? 'SEE RESULTS' : 'NEXT'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- RESULTS ---
  const correctCount = answers.filter((a) => a.correct).length;
  const breakdown: { [moduleId: number]: { correct: number; total: number } } = {};
  for (const a of answers) {
    if (!breakdown[a.moduleId]) breakdown[a.moduleId] = { correct: 0, total: 0 };
    breakdown[a.moduleId].total++;
    if (a.correct) breakdown[a.moduleId].correct++;
  }
  const weakModules = Object.entries(breakdown)
    .filter(([, v]) => v.correct / v.total < 0.5)
    .map(([id]) => {
      const m = MODULES.find((m) => m.id === Number(id));
      return m ? `M${m.id}: ${m.name}` : `Module ${id}`;
    });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-4xl font-bold text-[--color-gold]">RESULTS</h1>
      <div className="text-6xl font-bold text-[--color-cyan]">
        {correctCount}/{answers.length}
      </div>
      <p className="text-[--color-dim]">{SCOPES[scopeIdx].label}</p>

      <div className="w-full max-w-md">
        <h3 className="text-sm font-bold text-[--color-dim] mb-2">Per-Module Breakdown</h3>
        {Object.entries(breakdown).map(([modId, { correct, total }]) => {
          const mod = MODULES.find((m) => m.id === Number(modId));
          return (
            <div key={modId} className="flex items-center justify-between py-1">
              <span className="text-sm">M{modId}: {mod?.shortName ?? '?'}</span>
              <span
                className={`text-sm font-bold ${
                  correct === total ? 'text-[--color-green]' : correct === 0 ? 'text-[--color-pink]' : 'text-[--color-gold]'
                }`}
              >
                {correct}/{total}
              </span>
            </div>
          );
        })}
      </div>

      {weakModules.length > 0 && (
        <div className="bg-[--color-panel] rounded-lg p-4 w-full max-w-md">
          <p className="text-sm font-bold text-[--color-pink]">Weak Areas:</p>
          <ul className="text-sm text-[--color-dim] mt-1">
            {weakModules.map((w) => (
              <li key={w}>- {w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-4 mt-4">
        <button
          onClick={() => {
            setPhase('setup');
            setAnswers([]);
          }}
          className="py-3 px-6 rounded-lg font-bold bg-[--color-cyan] text-[--color-bg] hover:shadow-[0_0_20px_var(--color-cyan)] transition-all"
        >
          TRY AGAIN
        </button>
        <Link
          href="/"
          className="py-3 px-6 rounded-lg font-bold bg-[--color-panel] text-[--color-dim] hover:text-[--color-text] transition-all"
        >
          BACK TO MENU
        </Link>
      </div>
    </div>
  );
}
