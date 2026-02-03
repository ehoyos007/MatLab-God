'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-5xl md:text-7xl font-bold text-[--color-cyan] tracking-tight">
        MATLAB-GOD
      </h1>
      <p className="text-[--color-dim] text-base md:text-lg text-center">
        ECH 3854 — Engineering Computations Trainer
      </p>

      <div className="flex flex-col gap-4 mt-8 w-full max-w-xs">
        <Link
          href="/modules"
          className="block text-center py-4 px-8 rounded-lg font-bold text-lg bg-[--color-cyan] text-[--color-bg] hover:shadow-[0_0_20px_var(--color-cyan)] transition-all"
        >
          CHALLENGE ROOMS
        </Link>
        <Link
          href="/exam-prep"
          className="block text-center py-4 px-8 rounded-lg font-bold text-lg bg-[--color-gold] text-[--color-bg] hover:shadow-[0_0_20px_var(--color-gold)] transition-all"
        >
          EXAM PREP
        </Link>
        <Link
          href="/cheatsheet"
          className="block text-center py-4 px-8 rounded-lg font-bold text-lg bg-[--color-green] text-[--color-bg] hover:shadow-[0_0_20px_var(--color-green)] transition-all"
        >
          CHEAT SHEET
        </Link>
        <Link
          href="/dashboard"
          className="block text-center py-4 px-8 rounded-lg font-bold text-lg bg-[--color-panel] text-[--color-dim] hover:text-[--color-text] hover:shadow-[0_0_20px_rgba(80,80,106,0.3)] transition-all border border-[--color-dim]"
        >
          DASHBOARD
        </Link>
      </div>
    </div>
  );
}
