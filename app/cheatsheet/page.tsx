'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadProgress, generateCheatSheet } from '@/lib/engine';
import { MODULES } from '@/lib/modules';

export default function CheatSheetPage() {
  const [sheet, setSheet] = useState('Loading...');

  useEffect(() => {
    const progress = loadProgress();
    setSheet(generateCheatSheet(progress, MODULES));
  }, []);

  const handleExport = () => {
    const blob = new Blob([sheet], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matlab_cheatsheet.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen px-3 md:px-4 py-6 md:py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 md:gap-4 mb-6 flex-wrap">
        <Link
          href="/"
          className="text-[--color-cyan] hover:underline font-bold shrink-0"
        >
          &lt; BACK
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-[--color-green]">
          AUTO-GENERATED CHEAT SHEET
        </h1>
      </div>

      <pre className="code-editor readonly min-h-[300px] md:min-h-[400px] mb-6 whitespace-pre-wrap break-words overflow-x-auto text-xs md:text-sm">
        {sheet}
      </pre>

      <button
        onClick={handleExport}
        className="min-h-[44px] px-6 py-3 rounded-lg font-bold bg-[--color-green] text-[--color-bg] hover:shadow-[0_0_15px_var(--color-green)] transition-all"
      >
        EXPORT .TXT
      </button>
    </div>
  );
}
