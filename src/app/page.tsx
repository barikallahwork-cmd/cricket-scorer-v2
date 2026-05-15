'use client';

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useMatchStore from '@/store/matchStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Plus, Play, Trash2, Calendar, MapPin, Users, X, Globe, LogOut } from 'lucide-react';
import { Match } from '@/store/types';
import { getMatchTitle } from '@/utils/formatting';
import { resolveCode } from '@/hooks/useFirebaseSync';
import { useAuth } from '@/contexts/AuthContext';

function StatusBadge({ status }: { status: Match['status'] }) {
  const configs = {
    live: { label: 'LIVE', cls: 'bg-red-600 text-white animate-pulse' },
    finished: { label: 'FINISHED', cls: 'bg-gray-600 text-gray-200' },
    toss: { label: 'TOSS', cls: 'bg-yellow-600 text-black' },
    setup: { label: 'SETUP', cls: 'bg-blue-700 text-white' },
    innings_setup: { label: 'SETUP', cls: 'bg-blue-700 text-white' },
    innings_break: { label: 'BREAK', cls: 'bg-orange-600 text-white' },
    awaiting_batsman: { label: 'LIVE', cls: 'bg-red-600 text-white' },
    awaiting_bowler: { label: 'LIVE', cls: 'bg-red-600 text-white' },
    super_over: { label: 'SUPER OVER', cls: 'bg-purple-600 text-white' },
  };
  const c = configs[status] || configs.setup;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { matches, activeMatchId, setActiveMatch, deleteMatch } = useMatchStore();
  const matchList = Object.values(matches).sort((a, b) => b.updatedAt - a.updatedAt);
  const { user, logout } = useAuth();
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  function resumeMatch(id: string) {
    setActiveMatch(id);
    router.push('/scorer');
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    setJoinError('');
    try {
      const result = await resolveCode(code);
      if (!result) { setJoinError('Code not found. Check the code and try again.'); return; }
      const { matchCode, role } = result;
      if (role === 'viewer') router.push(`/watch?code=${matchCode}`);
      else router.push(`/watch?code=${matchCode}&role=${role}`);
    } catch {
      setJoinError('Connection error. Please try again.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070d1a]">
      {/* Header */}
      <header className="bg-[#0f1928] border-b border-[#1e3a5f] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-none">CricScore Pro</h1>
              <p className="text-xs text-slate-400">Live Cricket Scorer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/grounds')}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Grounds</span>
            </button>
            <button
              onClick={() => router.push('/tournament')}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Tournament</span>
            </button>
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Users className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">Join</span>
            </button>
            <button
              onClick={() => router.push('/scorer?new=1')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">New</span>
            </button>
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700 ml-1">
                <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    : (user.displayName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()
                  }
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {matchList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-[#0f1928] border-2 border-[#1e3a5f] flex items-center justify-center mx-auto mb-6">
              <Activity className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Matches Yet</h2>
            <p className="text-slate-400 mb-8">Create your first match to start scoring live cricket</p>
            <button
              onClick={() => router.push('/scorer?new=1')}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Match
            </button>
          </motion.div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Matches</h2>
            <div className="grid gap-4">
              {matchList.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#0f1928] border border-[#1e3a5f] hover:border-green-700/50 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-white text-lg truncate">{getMatchTitle(match)}</h3>
                        <StatusBadge status={match.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" />
                          {match.format} • {match.maxOvers} overs
                        </span>
                        {match.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {match.venue}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {match.date}
                        </span>
                      </div>
                      {match.innings.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {match.innings.map((inn, idx) => {
                            const team = match.teams.find(t => t.id === inn.battingTeamId);
                            return (
                              <div key={idx} className="bg-slate-800/60 rounded-lg px-3 py-1.5 text-sm">
                                <span className="text-slate-400">{team?.shortName} </span>
                                <span className="font-bold text-white">{inn.runs}/{inn.wickets}</span>
                                <span className="text-slate-400"> ({inn.overs}.{inn.balls})</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {match.result && (
                        <p className="mt-2 text-green-400 text-sm font-medium">{match.result}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {match.status !== 'finished' && (
                        <button
                          onClick={() => resumeMatch(match.id)}
                          className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          {match.status === 'toss' || match.status === 'setup' ? 'Setup' : 'Score'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Delete this match?')) deleteMatch(match.id);
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer hint for display screen */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => window.open(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/display`, '_blank', 'noopener')}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-sm font-medium px-3 py-2 rounded-lg transition-colors shadow-lg"
        >
          <Activity className="w-4 h-4 text-green-400" />
          Open Display Screen
        </button>
      </div>

      {/* Join Match Modal */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowJoin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f1928] border border-[#1e3a5f] rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Join Live Match</h2>
                <button onClick={() => setShowJoin(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-400 text-sm mb-4">Enter viewer (CRK), scorer (SCR), or admin (ADM) code</p>
              <input
                autoFocus
                type="text"
                placeholder="CRK• SCR• ADM•••••"
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                className="w-full bg-slate-800 border border-slate-600 text-white font-mono text-lg text-center rounded-xl px-4 py-3 mb-2 focus:outline-none focus:border-green-500 placeholder-slate-500 tracking-widest"
                maxLength={10}
              />
              {joinError && <p className="text-red-400 text-xs text-center mb-3">{joinError}</p>}
              {!joinError && <div className="mb-4" />}
              <button
                onClick={handleJoin}
                disabled={!joinCode.trim() || joining}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {joining ? 'Looking up...' : 'Join'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
