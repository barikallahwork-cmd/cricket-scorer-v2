'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Match, Innings, WicketType } from '@/store/types';
import { getTeam, getPlayerName } from '@/utils/formatting';
import useMatchStore, { ScoreBallParams } from '@/store/matchStore';

const WICKET_TYPES: { type: WicketType; emoji: string; needsFielder: boolean; needsBowlerWicket: boolean }[] = [
  { type: 'Bowled', emoji: '🏏', needsFielder: false, needsBowlerWicket: true },
  { type: 'Caught', emoji: '🙌', needsFielder: true, needsBowlerWicket: true },
  { type: 'LBW', emoji: '⚖️', needsFielder: false, needsBowlerWicket: true },
  { type: 'Run Out', emoji: '🏃', needsFielder: true, needsBowlerWicket: false },
  { type: 'Stumped', emoji: '🧤', needsFielder: true, needsBowlerWicket: true },
  { type: 'Hit Wicket', emoji: '😮', needsFielder: false, needsBowlerWicket: true },
  { type: 'Obstructing Field', emoji: '🚫', needsFielder: false, needsBowlerWicket: false },
  { type: 'Retired Hurt', emoji: '🤕', needsFielder: false, needsBowlerWicket: false },
];

interface Props {
  match: Match;
  innings: Innings;
  runs: number;
  extraType?: string;
  onConfirm: (params: ScoreBallParams) => void;
  onClose: () => void;
}

export default function WicketModal({ match, innings, runs, extraType, onConfirm, onClose }: Props) {
  const [wicketType, setWicketType] = useState<WicketType>('Bowled');
  const [batsmanOut, setBatsmanOut] = useState(innings.currentBatsmen[innings.strikerIndex]);
  const [fielder, setFielder] = useState('');

  const bowlingTeam = getTeam(match, innings.bowlingTeamId);
  const battingTeam = getTeam(match, innings.battingTeamId);
  const typeConfig = WICKET_TYPES.find(w => w.type === wicketType)!;

  const currentBatsmen = innings.currentBatsmen.filter(Boolean).map(id => ({
    id,
    name: getPlayerName(match, id),
  }));

  function handleConfirm() {
    onConfirm({
      runs,
      extraType: extraType as any,
      isWicket: true,
      wicketType,
      batsmanOut,
      fielder: fielder || undefined,
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#0f1928] border border-red-800/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-red-400">Wicket!</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Wicket Type */}
          <div className="mb-4">
            <label className="label">Dismissal Type</label>
            <div className="grid grid-cols-2 gap-2">
              {WICKET_TYPES.map(w => (
                <button
                  key={w.type}
                  onClick={() => setWicketType(w.type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    wicketType === w.type
                      ? 'bg-red-700 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{w.emoji}</span>
                  {w.type}
                </button>
              ))}
            </div>
          </div>

          {/* Batsman Out */}
          <div className="mb-4">
            <label className="label">Batsman Out</label>
            <div className="grid grid-cols-2 gap-2">
              {currentBatsmen.map(b => (
                <button
                  key={b.id}
                  onClick={() => setBatsmanOut(b.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    batsmanOut === b.id
                      ? 'bg-red-700 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Fielder */}
          {typeConfig.needsFielder && (
            <div className="mb-4">
              <label className="label">
                {wicketType === 'Caught' ? 'Caught By' :
                 wicketType === 'Stumped' ? 'Wicket Keeper' :
                 wicketType === 'Run Out' ? 'Fielder' : 'Fielder'}
              </label>
              <select
                className="input-field"
                value={fielder}
                onChange={e => setFielder(e.target.value)}
              >
                <option value="">Select fielder...</option>
                {bowlingTeam.players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 btn-secondary py-2.5">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!batsmanOut}
              className="flex-1 btn-danger py-2.5 disabled:opacity-50"
            >
              Confirm Wicket
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
