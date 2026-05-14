'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, MapPin, Wifi, ArrowLeft } from 'lucide-react';
import { useAllMatches } from '@/hooks/useFirebaseSync';
import { Match } from '@/store/types';
import { getMatchTitle } from '@/utils/formatting';

interface LiveMatch {
  matchCode: string;
  match: Match;
  syncedAt: number;
}

export default function GroundsPage() {
  const router = useRouter();
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);

  useAllMatches((entries) => {
    const parsed: LiveMatch[] = [];
    for (const entry of entries) {
      try {
        if (!entry.payload) continue;
        const data = JSON.parse(entry.payload);
        const match: Match | null = data.activeMatchId ? data.matches?.[data.activeMatchId] : null;
        if (!match) continue;
        parsed.push({ matchCode: entry.matchCode, match, syncedAt: entry.syncedAt });
      } catch {}
    }
    parsed.sort((a, b) => b.syncedAt - a.syncedAt);
    setLiveMatches(parsed);
  });

  const activeMatches = liveMatches.filter(m => m.match.status !== 'finished');
  const finishedMatches = liveMatches.filter(m => m.match.status === 'finished');

  function statusLabel(status: Match['status']) {
    if (['live', 'awaiting_batsman', 'awaiting_bowler'].includes(status)) return { label: 'LIVE', cls: 'bg-red-600 animate-pulse' };
    if (status === 'innings_break') return { label: 'BREAK', cls: 'bg-orange-600' };
    if (status === 'finished') return { label: 'DONE', cls: 'bg-slate-600' };
    return { label: 'SETUP', cls: 'bg-blue-700' };
  }

  function scoreDisplay(match: Match) {
    const inn = match.innings[match.currentInningsIndex];
    if (!inn) return null;
    const team = match.teams.find(t => t.id === inn.battingTeamId);
    return `${team?.shortName} ${inn.runs}/${inn.wickets} (${inn.overs}.${inn.balls})`;
  }

  return (
    <div className="min-h-screen bg-[#070d1a]">
      <header className="bg-[#0f1928] border-b border-[#1e3a5f] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-none">Live Grounds</h1>
            <p className="text-xs text-slate-400">All active matches</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
            <Wifi className="w-3 h-3 animate-pulse" />
            {activeMatches.length} live
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {liveMatches.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Live Matches</h2>
            <p className="text-slate-500">Matches will appear here once scorers start syncing.</p>
          </div>
        ) : (
          <>
            {activeMatches.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Live Now</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {activeMatches.map((entry, i) => {
                    const { label, cls } = statusLabel(entry.match.status);
                    return (
                      <motion.div
                        key={entry.matchCode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-[#0f1928] border border-[#1e3a5f] hover:border-green-700/50 rounded-xl p-4 cursor-pointer transition-colors"
                        onClick={() => router.push(`/watch?code=${entry.matchCode}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-white">{getMatchTitle(entry.match)}</h3>
                          <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                        </div>
                        {scoreDisplay(entry.match) && (
                          <p className="text-green-400 font-mono text-sm mb-2">{scoreDisplay(entry.match)}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {entry.match.venue || 'Unknown Ground'}
                          </span>
                          <span className="font-mono text-slate-600">{entry.matchCode}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {finishedMatches.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Completed</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {finishedMatches.map((entry) => (
                    <div key={entry.matchCode} className="bg-[#0f1928] border border-[#1e3a5f] rounded-xl p-4 opacity-60">
                      <h3 className="font-semibold text-white mb-1">{getMatchTitle(entry.match)}</h3>
                      {entry.match.result && <p className="text-green-400 text-sm">{entry.match.result}</p>}
                      <p className="text-xs text-slate-600 mt-1 font-mono">{entry.matchCode}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
