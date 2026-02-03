'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ChallengeView from '@/components/ChallengeView';

function ChallengeLoader() {
  const params = useSearchParams();
  const moduleId = parseInt(params.get('module') || '1', 10);
  return <ChallengeView moduleId={moduleId} />;
}

export default function ChallengePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[--color-dim]">Loading...</div>}>
      <ChallengeLoader />
    </Suspense>
  );
}
