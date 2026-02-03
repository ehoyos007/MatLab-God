'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MODULES } from '@/lib/modules';
import { loadProgress, getModuleStars } from '@/lib/engine';
import { GameProgress } from '@/lib/types';

function Stars({ earned, possible }: { earned: number; possible: number }) {
  if (possible === 0) return null;
  return (
    <span className="text-sm">
      <span className="star-filled">{'★'.repeat(Math.min(earned, 3))}</span>
      <span className="text-[--color-dim] ml-1">{earned}/{possible}</span>
    </span>
  );
}

export default function ModuleSelectPage() {
  const [progress, setProgress] = useState<GameProgress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  return (
    <div className="min-h-screen px-3 md:px-4 py-6 md:py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 flex-wrap">
        <Link
          href="/"
          className="text-[--color-cyan] hover:underline font-bold min-h-[44px] flex items-center"
        >
          &lt; BACK
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-[--color-cyan]">
          SELECT A MODULE
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod) => {
          const hasContent = mod.challenges.length > 0;
          const stars = progress
            ? getModuleStars(progress, mod.id, mod.challenges.length)
            : { earned: 0, possible: mod.challenges.length * 3 };

          return hasContent ? (
            <Link
              key={mod.id}
              href={`/challenge?module=${mod.id}`}
              className="block p-4 md:p-5 rounded-lg bg-[--color-panel] border border-[#1a1a2e] hover:border-[--color-cyan] hover:shadow-[0_0_15px_rgba(0,255,245,0.1)] transition-all min-h-[44px]"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[--color-dim] text-xs mb-1">MODULE {mod.id}</div>
                  <div className="text-[--color-cyan] font-bold text-base md:text-lg">{mod.name}</div>
                  <div className="text-[--color-dim] text-sm mt-1">
                    {mod.challenges.length} challenges
                  </div>
                </div>
                <Stars earned={stars.earned} possible={stars.possible} />
              </div>
            </Link>
          ) : (
            <div
              key={mod.id}
              className="p-4 md:p-5 rounded-lg bg-[--color-panel] border border-[#1a1a2e] opacity-40"
            >
              <div className="text-[--color-dim] text-xs mb-1">MODULE {mod.id}</div>
              <div className="text-[--color-dim] font-bold text-base md:text-lg">{mod.name}</div>
              <div className="text-[--color-dim] text-sm mt-1">Coming soon</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
