'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import useMatchStore from '@/store/matchStore';
import { Match } from '@/store/types';
import { Coins } from 'lucide-react';

interface Props {
  match: Match;
}

export default function TossSetup({ match }: Props) {
  const { setToss } = useMatchStore();
  const [winnerId, setWinnerId] = useState('');
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat');

  function handleSubmit() {
    if (!winnerId) return;
    setToss(winnerId, decision);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Coins className="w-8 h-8 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Toss</h2>
        <p className="text-slate-400 text-sm mt-1">{match.teams[0].shortName} vs {match.teams[1].shortName}</p>
      </div>

      <div className="score-card mb-4">
        <label className="label">Toss Winner</label>
        <div className="grid grid-cols-2 gap-3">
          {match.teams.map(team => (
            <button
              key={team.id}
              onClick={() => setWinnerId(team.id)}
              style={{ borderColor: winnerId === team.id ? team.color : undefined }}
              className={`py-4 rounded-xl font-bold text-lg border-2 transition-all ${
                winnerId === team.id
                  ? 'text-white bg-slate-700 scale-105'
                  : 'text-slate-300 bg-slate-800 border-transparent hover:bg-slate-700'
              }`}
            >
              <span className="block text-2xl mb-1">{team.shortName}</span>
              <span className="text-sm font-normal text-slate-400">{team.name}</span>
            </button>
          ))}
        </div>
      </div>

      {winnerId && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="score-card mb-6">
          <label className="label">Decision</label>
          <div className="grid grid-cols-2 gap-3">
            {(['bat', 'bowl'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDecision(d)}
                className={`py-3 rounded-xl font-semibold capitalize transition-all ${
                  decision === d
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {d === 'bat' ? '🏏 Bat First' : '⚾ Bowl First'}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!winnerId}
        className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm Toss & Setup Innings
      </button>
    </motion.div>
  );
}
