'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useMatchStore from '@/store/matchStore';
import ScorerPanel from '@/components/scorer/ScorerPanel';
import MatchSetup from '@/components/scorer/MatchSetup';
import { useFirebaseSync } from '@/hooks/useFirebaseSync';
import { useTournamentSync } from '@/hooks/useTournamentSync';

export default function ScorerPage() {
  const router = useRouter();
  const { activeMatchId, matches } = useMatchStore();
  const [showSetup, setShowSetup] = useState(false);
  const [ready, setReady] = useState(false);
  useFirebaseSync();
  useTournamentSync();

  useEffect(() => {
    // Read URL params client-side — avoids useSearchParams static export issue
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === '1') setShowSetup(true);
    setReady(true);
  }, []);

  if (!ready) return null;

  if (showSetup || !activeMatchId || !matches[activeMatchId]) {
    return (
      <div className="min-h-screen bg-[#070d1a] p-4">
        <div className="max-w-5xl mx-auto pt-4">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white text-sm">
              ← Back
            </button>
            <h1 className="text-xl font-bold text-white">New Match</h1>
          </div>
          <MatchSetup onComplete={() => { setShowSetup(false); router.push('/scorer'); }} />
        </div>
      </div>
    );
  }

  return <ScorerPanel />;
}
