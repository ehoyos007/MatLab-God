'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MODULES } from '@/lib/modules';
import { loadProgress, resetProgress, getModuleStars } from '@/lib/engine';
import { GameProgress } from '@/lib/types';

export default function DashboardPage() {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) return null;

  // Stats
  let totalStarsEarned = 0;
  let totalStarsPossible = 0;
  let totalCompleted = 0;
  const totalChallenges = MODULES.reduce((s, m) => s + m.challenges.length, 0);

  const moduleStats = MODULES.map((mod) => {
    const { earned, possible } = getModuleStars(progress, mod.id, mod.challenges.length);
    totalStarsEarned += earned;
    totalStarsPossible += possible;
    const completed = Object.values(progress.modules[mod.id] ?? {}).filter((c) => c.completed).length;
    totalCompleted += completed;
    return { mod, earned, possible, completed };
  });

  const maxStars = Math.max(...moduleStats.map((s) => s.possible), 1);

  // Weakest modules (lowest star %)
  const weakest = moduleStats
    .filter((s) => s.possible > 0)
    .sort((a, b) => a.earned / a.possible - b.earned / b.possible)
    .slice(0, 3)
    .filter((s) => s.earned < s.possible);

  function handleReset() {
    resetProgress();
    setProgress(loadProgress());
    setConfirmReset(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 gap-8">
      <Link href="/" className="text-[--color-dim] hover:text-[--color-cyan] text-sm">
        &larr; Back to Menu
      </Link>
      <h1 className="text-4xl font-bold text-[--color-cyan]">DASHBOARD</h1>

      {/* Overall stats */}
      <div className="flex gap-8 text-center">
        <div>
          <div className="text-3xl font-bold text-[--color-gold]">
            {totalStarsEarned}/{totalStarsPossible}
          </div>
          <div className="text-xs text-[--color-dim]">Stars</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[--color-green]">
            {totalCompleted}/{totalChallenges}
          </div>
          <div className="text-xs text-[--color-dim]">Completed</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[--color-cyan]">
            {progress.examScores.length}
          </div>
          <div className="text-xs text-[--color-dim]">Exams Taken</div>
        </div>
      </div>

      {/* Per-module bar chart */}
      <div className="w-full max-w-lg">
        <h2 className="text-sm font-bold text-[--color-dim] mb-3">Stars Per Module</h2>
        <div className="flex flex-col gap-2">
          {moduleStats.map(({ mod, earned, possible }) => (
            <div key={mod.id} className="flex items-center gap-3">
              <span className="text-xs w-20 text-right text-[--color-dim] shrink-0">
                M{mod.id}
              </span>
              <div className="flex-1 bg-[--color-panel] rounded-full h-5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${possible > 0 ? (earned / maxStars) * 100 : 0}%`,
                    background:
                      earned === possible && possible > 0
                        ? 'var(--color-green)'
                        : 'var(--color-gold)',
                  }}
                />
              </div>
              <span className="text-xs w-12 text-[--color-dim]">
                {earned}/{possible}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weakest modules */}
      {weakest.length > 0 && (
        <div className="w-full max-w-lg bg-[--color-panel] rounded-lg p-4">
          <h2 className="text-sm font-bold text-[--color-pink] mb-2">Needs Work</h2>
          {weakest.map(({ mod, earned, possible }) => (
            <div key={mod.id} className="flex justify-between text-sm py-1">
              <span>
                M{mod.id}: {mod.name}
              </span>
              <span className="text-[--color-dim]">
                {possible > 0 ? Math.round((earned / possible) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recent exam scores */}
      {progress.examScores.length > 0 && (
        <div className="w-full max-w-lg">
          <h2 className="text-sm font-bold text-[--color-dim] mb-3">Recent Exams</h2>
          <div className="flex flex-col gap-2">
            {[...progress.examScores]
              .reverse()
              .slice(0, 10)
              .map((es, i) => (
                <div key={i} className="flex items-center justify-between bg-[--color-panel] rounded-lg px-4 py-2">
                  <span className="text-sm">{es.scope}</span>
                  <span
                    className={`text-sm font-bold ${
                      es.score / es.total >= 0.7
                        ? 'text-[--color-green]'
                        : es.score / es.total >= 0.4
                          ? 'text-[--color-gold]'
                          : 'text-[--color-pink]'
                    }`}
                  >
                    {es.score}/{es.total}
                  </span>
                  <span className="text-xs text-[--color-dim]">
                    {new Date(es.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Reset */}
      <div className="mt-4">
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="py-2 px-6 rounded-lg text-sm font-bold bg-[--color-panel] text-[--color-pink] hover:bg-[--color-pink] hover:text-white transition-all"
          >
            Reset Progress
          </button>
        ) : (
          <div className="flex gap-3 items-center">
            <span className="text-sm text-[--color-pink]">Are you sure?</span>
            <button
              onClick={handleReset}
              className="py-2 px-4 rounded-lg text-sm font-bold bg-[--color-pink] text-white"
            >
              Yes, Reset
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="py-2 px-4 rounded-lg text-sm font-bold bg-[--color-panel] text-[--color-dim]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
