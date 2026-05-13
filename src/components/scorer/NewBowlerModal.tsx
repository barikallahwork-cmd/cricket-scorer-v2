'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind } from 'lucide-react';
import { Match, Innings } from '@/store/types';
import { getTeam } from '@/utils/formatting';
import useMatchStore from '@/store/matchStore';

interface Props {
  match: Match;
  innings: Innings;
}

export default function NewBowlerModal({ match, innings }: Props) {
  const { selectNewBowler } = useMatchStore();
  const [selected, setSelected] = useState('');
  const bowlingTeam = getTeam(match, innings.bowlingTeamId);

  function handleSelect() {
    if (!selected) return;
    selectNewBowler(selected);
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
          className="bg-[#0f1928] border border-blue-800/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <Wind className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Select Bowler</h3>
            <span className="text-sm text-slate-400">Over {innings.overs + 1}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-5 max-h-64 overflow-y-auto">
            {bowlingTeam.players.map(p => {
              const bf = innings.bowlingFigures[p.id];
              const isLastBowler = p.id === innings.lastBowler;
              return (
                <button
                  key={p.id}
                  onClick={() => !isLastBowler && setSelected(p.id)}
                  disabled={isLastBowler}
                  className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    selected === p.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : isLastBowler
                      ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div>{p.name}</div>
                  {bf && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      {bf.overs}.{bf.balls} ov • {bf.wickets}/{bf.runs}
                    </div>
                  )}
                  {isLastBowler && <div className="text-xs text-slate-500 mt-0.5">Cannot bowl consecutive</div>}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSelect}
            disabled={!selected}
            className="w-full btn-primary py-2.5 disabled:opacity-50"
          >
            Confirm Bowler
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
