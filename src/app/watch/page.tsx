'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Wifi, WifiOff, Shield, LogOut } from 'lucide-react';
import useMatchStore from '@/store/matchStore';
import { useFirebaseReceiver, useFirebaseSync } from '@/hooks/useFirebaseSync';
import ScoreboardDisplay from '@/components/display/ScoreboardDisplay';
import ScorerPanel from '@/components/scorer/ScorerPanel';

type Role = 'viewer' | 'scorer' | 'admin';

function AdminControls({ matchCode }: { matchCode: string }) {
  const { activeMatchId, matches, endMatch } = useMatchStore();
  const match = activeMatchId ? matches[activeMatchId] : null;
  if (!match) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1928]/95 backdrop-blur border-t border-[#1e3a5f] px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="text-xs text-slate-400">
          <span className="text-amber-400 font-bold">ADMIN</span> · {matchCode}
          <span className="ml-3 text-slate-500">SCR: {match.scorerCode} · ADM: {match.adminCode}</span>
        </div>
        {match.status !== 'finished' && (
          <button
            onClick={() => { if (confirm('End this match?')) endMatch(); }}
            className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            End Match
          </button>
        )}
      </div>
    </div>
  );
}

export default function WatchPage() {
  const router = useRouter();
  const [matchCode, setMatchCode] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('viewer');
  const [connected, setConnected] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [ready, setReady] = useState(false);
  const { matches, activeMatchId } = useMatchStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code')?.toUpperCase() ?? null;
    const r = (params.get('role') as Role) ?? 'viewer';
    setMatchCode(code);
    setRole(r);
    setReady(true);
  }, []);

  useFirebaseReceiver(matchCode);
  // Only push to Firebase after connected and only for non-viewer roles.
  // Prevents stale localStorage from overwriting live scorer state on join.
  useFirebaseSync(connected && role !== 'viewer');

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
          <button onClick={() => router.push('/')} className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Go Home</button>
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
          <button onClick={() => router.push('/')} className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Try Another Code</button>
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
          {role !== 'viewer' && (
            <p className="text-amber-400 text-sm mt-2 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              {role === 'scorer' ? 'Scorer' : 'Admin'} access
            </p>
          )}
        </div>
      </div>
    );
  }

  // Scorer mode — full scoring panel
  if (role === 'scorer') {
    return (
      <div className="relative">
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded-full text-xs text-green-400">
          <Wifi className="w-3 h-3" />
          SCORER · {matchCode}
        </div>
        <ScorerPanel />
      </div>
    );
  }

  // Admin mode — scoreboard + admin controls bar
  if (role === 'admin') {
    return (
      <div className="relative pb-16">
        <div className="fixed bottom-16 right-4 z-50 flex items-center gap-1.5 bg-amber-900/80 backdrop-blur px-2 py-1 rounded-full text-xs text-amber-400">
          <Shield className="w-3 h-3" />
          ADMIN · {matchCode}
        </div>
        <ScoreboardDisplay />
        <AdminControls matchCode={matchCode} />
      </div>
    );
  }

  // Viewer mode (default)
  return (
    <div className="relative">
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded-full text-xs text-green-400">
        <Wifi className="w-3 h-3" />
        LIVE · {matchCode}
      </div>
      <ScoreboardDisplay />
    </div>
  );
}
