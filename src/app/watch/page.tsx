'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import useMatchStore from '@/store/matchStore';
import { useFirebaseReceiver } from '@/hooks/useFirebaseSync';
import ScoreboardDisplay from '@/components/display/ScoreboardDisplay';

export default function WatchPage() {
  const router = useRouter();
  const [matchCode, setMatchCode] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [ready, setReady] = useState(false);
  const { matches, activeMatchId } = useMatchStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code')?.toUpperCase() ?? null;
    setMatchCode(code);
    setReady(true);
  }, []);

  useFirebaseReceiver(matchCode);

  useEffect(() => {
    if (!matchCode || !ready) return;
    const match = activeMatchId ? matches[activeMatchId] : null;
    if (match?.matchCode === matchCode) {
      setConnected(true);
      setNotFound(false);
    } else {
      const timeout = setTimeout(() => setNotFound(true), 8000);
      return () => clearTimeout(timeout);
    }
  }, [matches, activeMatchId, matchCode, ready]);

  if (!ready) return null;

  if (!matchCode) {
    return (
      <div className="min-h-screen bg-[#070d1a] flex items-center justify-center p-4">
        <div className="text-center">
          <Activity className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Match Code</h1>
          <p className="text-slate-400 mb-6">Use a share link or enter a code from the homepage.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (notFound && !connected) {
    return (
      <div className="min-h-screen bg-[#070d1a] flex items-center justify-center p-4">
        <div className="text-center">
          <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Match Not Found</h1>
          <p className="text-slate-400 mb-2">No live match found for code</p>
          <p className="text-green-400 font-bold text-xl mb-6">{matchCode}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Try Another Code
          </button>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-[#070d1a] flex items-center justify-center p-4">
        <div className="text-center">
          <Wifi className="w-12 h-12 text-green-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-xl font-bold text-white mb-2">Connecting to match...</h1>
          <p className="text-green-400 font-mono text-lg">{matchCode}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="fixed top-2 left-2 z-50 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded-full text-xs text-green-400">
        <Wifi className="w-3 h-3" />
        LIVE · {matchCode}
      </div>
      <ScoreboardDisplay />
    </div>
  );
}
