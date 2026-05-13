'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { Match, Innings } from '@/store/types';
import { getTeam } from '@/utils/formatting';
import useMatchStore from '@/store/matchStore';

interface Props {
  match: Match;
  innings: Innings;
}

export default function NewBatsmanModal({ match, innings }: Props) {
  const { selectNewBatsman } = useMatchStore();
  const [selected, setSelected] = useState('');
  const battingTeam = getTeam(match, innings.battingTeamId);

  const dismissed = Object.values(innings.battingScores)
    .filter(s => s.isOut || s.isRetired)
    .map(s => s.playerId);
  const currentlyIn = innings.currentBatsmen.filter(Boolean);
  const available = battingTeam.players.filter(
    p => !dismissed.includes(p.id) && !currentlyIn.includes(p.id)
  );

  function handleSelect() {
    if (!selected) return;
    selectNewBatsman(selected);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#0f1928] border border-green-800/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <UserPlus className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold text-white">Next Batsman</h3>
          </div>

          {available.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-slate-400">All batsmen dismissed</p>
              <p className="text-slate-500 text-sm mt-1">Innings complete</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-5 max-h-64 overflow-y-auto">
                {available.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selected === p.id
                        ? 'bg-green-600 text-white font-semibold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p.name}
                    {p.isCaptain && <span className="ml-1 text-yellow-400 text-xs">(C)</span>}
                    {p.isWicketKeeper && <span className="ml-1 text-blue-400 text-xs">(WK)</span>}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSelect}
                disabled={!selected}
                className="w-full btn-primary py-2.5 disabled:opacity-50"
              >
                Send In
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
