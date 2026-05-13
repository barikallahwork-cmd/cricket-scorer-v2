'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import useMatchStore from '@/store/matchStore';
import { Match, Player } from '@/store/types';
import { getTeam } from '@/utils/formatting';
import { Crosshair, Wind } from 'lucide-react';

interface Props {
  match: Match;
  isSecondInnings?: boolean;
}

function PlayerPicker({
  players,
  selected,
  onSelect,
  label,
  exclude,
}: {
  players: Player[];
  selected: string;
  onSelect: (id: string) => void;
  label: string;
  exclude?: string[];
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
        {players
          .filter(p => !exclude?.includes(p.id))
          .map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
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
    </div>
  );
}

export default function InningsSetup({ match, isSecondInnings = false }: Props) {
  const { startInnings } = useMatchStore();
  const innings = match.innings[match.currentInningsIndex];
  const battingTeam = getTeam(match, innings.battingTeamId);
  const bowlingTeam = getTeam(match, innings.bowlingTeamId);

  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');

  function handleStart() {
    if (!striker || !nonStriker || !bowler) return;
    startInnings(striker, nonStriker, bowler);
  }

  const firstInnings = match.innings[0];
  const target = isSecondInnings && firstInnings ? firstInnings.runs + 1 : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white">
          {isSecondInnings ? '2nd Innings Setup' : '1st Innings Setup'}
        </h2>
        {target && (
          <div className="mt-2 inline-flex items-center gap-2 bg-orange-600/20 border border-orange-600/40 rounded-full px-4 py-1.5">
            <span className="text-orange-400 font-bold">Target: {target}</span>
            <span className="text-slate-400 text-sm">runs in {match.maxOvers} overs</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="score-card">
          <div className="flex items-center gap-2 mb-4">
            <Crosshair className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-white">Batting: {battingTeam.shortName}</h3>
          </div>
          <PlayerPicker
            players={battingTeam.players}
            selected={striker}
            onSelect={setStriker}
            label="Opening Batsman (Striker)"
            exclude={[nonStriker]}
          />
          <div className="my-3" />
          <PlayerPicker
            players={battingTeam.players}
            selected={nonStriker}
            onSelect={setNonStriker}
            label="Opening Batsman (Non-Striker)"
            exclude={[striker]}
          />
        </div>

        <div className="score-card">
          <div className="flex items-center gap-2 mb-4">
            <Wind className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Bowling: {bowlingTeam.shortName}</h3>
          </div>
          <PlayerPicker
            players={bowlingTeam.players}
            selected={bowler}
            onSelect={setBowler}
            label="Opening Bowler"
          />
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!striker || !nonStriker || !bowler}
        className="w-full mt-6 btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Start {isSecondInnings ? '2nd' : '1st'} Innings
      </button>
    </motion.div>
  );
}
