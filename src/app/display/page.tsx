'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ScoreboardDisplay from '@/components/display/ScoreboardDisplay';

function DisplayContent() {
  const params = useSearchParams();
  const code = params.get('code');
  return <ScoreboardDisplay matchCode={code} />;
}

export default function DisplayPage() {
  return (
    <Suspense fallback={null}>
      <DisplayContent />
    </Suspense>
  );
}
