'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MODULES } from '@/lib/modules';
import {
  loadProgress,
  saveChallengeResult,
  checkAnswer,
  calculateStars,
} from '@/lib/engine';
import { GameProgress, Challenge } from '@/lib/types';
import { useChatContext } from '@/lib/ChatContext';

function StarDisplay({ count, max }: { count: number; max: number }) {
  return (
    <span className="text-xl md:text-2xl tracking-widest">
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} className={i < count ? 'star-filled' : 'star-empty'}>
          {i < max ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  fix_bug: { label: 'FIX THE BUG', color: 'text-[--color-pink]' },
  predict_output: { label: 'PREDICT OUTPUT', color: 'text-[--color-gold]' },
  fill_blank: { label: 'FILL IN BLANK', color: 'text-[--color-cyan]' },
};

export default function ChallengeView({ moduleId }: { moduleId: number }) {
  const mod = MODULES.find((m) => m.id === moduleId);
  const challenges = mod?.challenges ?? [];

  const [index, setIndex] = useState(0);
  const [code, setCode] = useState('');
  const [answer, setAnswer] = useState('');
  const [progress, setProgress] = useState<GameProgress>({ modules: {}, examScores: [] });
  const [hints, setHints] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [maxStars, setMaxStars] = useState(3);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'correct' | 'wrong' | 'solution' | '' }>({ text: '', type: '' });
  const [shakeCode, setShakeCode] = useState(false);
  const [flashCorrect, setFlashCorrect] = useState(false);

  const challenge: Challenge | undefined = challenges[index];
  const { setChallengeContext } = useChatContext();

  useEffect(() => {
    if (challenge) {
      setChallengeContext({
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        code: challenge.brokenCode,
        module: moduleId,
      });
    }
    return () => setChallengeContext(null);
  }, [challenge, moduleId, setChallengeContext]);

  const loadChallenge = useCallback((ch: Challenge) => {
    setCode(ch.brokenCode);
    setAnswer('');
    setHints(0);
    setAttempts(0);
    setMaxStars(3);
    setCompleted(false);
    setFeedback({ text: '', type: '' });
  }, []);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    if (challenge) loadChallenge(challenge);
  }, [index, challenge, loadChallenge]);

  if (!mod || challenges.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[--color-dim]">No challenges available for this module.</p>
        <Link href="/modules" className="text-[--color-cyan] hover:underline">
          &lt; Back to modules
        </Link>
      </div>
    );
  }

  const handleSubmit = () => {
    if (completed || !challenge) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const studentInput = challenge.type === 'predict_output' ? answer : code;
    const result = checkAnswer(studentInput, challenge);

    if (result.correct) {
      const stars = calculateStars(newAttempts, hints);
      setCompleted(true);
      setFlashCorrect(true);
      setTimeout(() => setFlashCorrect(false), 600);
      setFeedback({
        text: challenge.explanation,
        type: 'correct',
      });
      const updated = saveChallengeResult(progress, moduleId, challenge.id, stars, newAttempts, hints);
      setProgress(updated);
    } else {
      setShakeCode(true);
      setTimeout(() => setShakeCode(false), 400);

      if (newAttempts >= 3) {
        setCompleted(true);
        setFeedback({
          text: `Solution:\n${challenge.correctCode}\n\n${challenge.explanation}`,
          type: 'solution',
        });
        const updated = saveChallengeResult(progress, moduleId, challenge.id, 0, newAttempts, hints);
        setProgress(updated);
      } else {
        setFeedback({
          text: result.feedback || `Wrong (attempt ${newAttempts}/3)`,
          type: 'wrong',
        });
      }
    }
  };

  const handleHint = () => {
    if (!challenge || hints >= challenge.hints.length) return;
    const newHints = hints + 1;
    setHints(newHints);
    if (newHints > 1) {
      setMaxStars((prev) => Math.max(1, prev - 1));
    }
  };

  const handleNext = () => {
    if (index < challenges.length - 1) {
      setIndex(index + 1);
    }
  };

  const earnedStars = completed
    ? calculateStars(attempts, hints)
    : maxStars;

  const feedbackColor =
    feedback.type === 'correct'
      ? 'text-[--color-green]'
      : feedback.type === 'solution'
      ? 'text-[--color-gold]'
      : feedback.type === 'wrong'
      ? 'text-[--color-pink]'
      : '';

  const typeInfo = TYPE_LABELS[challenge.type] ?? { label: challenge.type, color: 'text-[--color-text]' };

  return (
    <div className={`min-h-screen px-3 md:px-4 py-4 md:py-6 max-w-5xl mx-auto ${flashCorrect ? 'flash-correct' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Link
            href="/modules"
            className="text-[--color-cyan] hover:underline font-bold text-sm shrink-0"
          >
            &lt; BACK
          </Link>
          <span className="text-[--color-cyan] font-bold text-base md:text-xl truncate">
            Module {moduleId}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <span className="text-[--color-dim] text-xs md:text-sm">
            {index + 1} / {challenges.length}
          </span>
          <StarDisplay count={completed ? earnedStars : 0} max={maxStars} />
        </div>
      </div>

      {/* Challenge type + title */}
      <div className="mb-4">
        <span className={`text-xs font-bold ${typeInfo.color}`}>
          {typeInfo.label}
        </span>
        <h2 className="text-lg md:text-xl font-bold text-[--color-text] mt-1">
          {challenge.title}
        </h2>
        <p className="text-[--color-dim] text-sm mt-2 whitespace-pre-line">
          {challenge.description}
        </p>
      </div>

      {/* Code panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-[--color-green] text-sm font-bold mb-1 block">
            {challenge.type === 'predict_output' ? 'Code (read-only):' : 'Your Code:'}
          </label>
          <textarea
            className={`code-editor h-40 md:h-48 ${shakeCode ? 'shake' : ''} ${challenge.type === 'predict_output' ? 'readonly' : ''}`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            readOnly={challenge.type === 'predict_output'}
            spellCheck={false}
          />
        </div>
        <div>
          <label className="text-[--color-gold] text-sm font-bold mb-1 block">
            {challenge.type === 'predict_output' ? 'Your Answer:' : 'Expected Output:'}
          </label>
          {challenge.type === 'predict_output' ? (
            <textarea
              className="code-editor h-40 md:h-48"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type the expected output..."
              spellCheck={false}
            />
          ) : (
            <textarea
              className="code-editor readonly h-40 md:h-48"
              value={challenge.expectedOutput}
              readOnly
            />
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={handleSubmit}
          disabled={completed}
          className="min-h-[44px] px-5 md:px-6 py-3 rounded-lg font-bold bg-[--color-green] text-[--color-bg] disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_15px_var(--color-green)] transition-all"
        >
          SUBMIT
        </button>
        <button
          onClick={handleHint}
          disabled={completed || hints >= (challenge.hints?.length ?? 0)}
          className="min-h-[44px] px-5 md:px-6 py-3 rounded-lg font-bold bg-[--color-gold] text-[--color-bg] disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_15px_var(--color-gold)] transition-all"
        >
          HINT ({hints}/{challenge.hints?.length ?? 0})
        </button>
        {completed && index < challenges.length - 1 && (
          <button
            onClick={handleNext}
            className="min-h-[44px] px-5 md:px-6 py-3 rounded-lg font-bold bg-[--color-cyan] text-[--color-bg] hover:shadow-[0_0_15px_var(--color-cyan)] transition-all"
          >
            NEXT &gt;
          </button>
        )}
        {completed && index === challenges.length - 1 && (
          <Link
            href="/modules"
            className="min-h-[44px] flex items-center px-5 md:px-6 py-3 rounded-lg font-bold bg-[--color-cyan] text-[--color-bg] hover:shadow-[0_0_15px_var(--color-cyan)] transition-all"
          >
            DONE
          </Link>
        )}
      </div>

      {/* Hints */}
      {hints > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-[--color-panel] border border-[#1a1a2e]">
          {challenge.hints.slice(0, hints).map((h, i) => (
            <p key={i} className="text-[--color-gold] text-sm mb-1">
              <span className="font-bold">Hint {i + 1}:</span> {h}
            </p>
          ))}
        </div>
      )}

      {/* Feedback */}
      {feedback.text && (
        <div className={`p-3 md:p-4 rounded-lg bg-[--color-panel] border border-[#1a1a2e] ${feedbackColor}`}>
          <pre className="whitespace-pre-wrap text-sm font-[family-name:var(--font-mono)] overflow-x-auto">
            {feedback.type === 'correct' && (
              <span className="text-[--color-green] font-bold text-base md:text-lg block mb-2">
                CORRECT! {'★'.repeat(earnedStars)}{'☆'.repeat(3 - earnedStars)}
              </span>
            )}
            {feedback.text}
          </pre>
        </div>
      )}
    </div>
  );
}
