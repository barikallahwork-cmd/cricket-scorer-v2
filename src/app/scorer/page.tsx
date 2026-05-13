'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import useMatchStore from '@/store/matchStore';
import ScorerPanel from '@/components/scorer/ScorerPanel';
import MatchSetup from '@/components/scorer/MatchSetup';
import { useRouter } from 'next/navigation';

export default function ScorerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = searchParams.get('new') === '1';
  const { activeMatchId, matches } = useMatchStore();

  if (isNew || !activeMatchId || !matches[activeMatchId]) {
    return (
      <div className="min-h-screen bg-[#070d1a] p-4">
        <div className="max-w-5xl mx-auto pt-4">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white text-sm">← Back</button>
            <h1 className="text-xl font-bold text-white">New Match</h1>
          </div>
          <MatchSetup onComplete={() => router.push('/scorer')} />
        </div>
      </div>
    );
  }

  return <ScorerPanel />;
}
