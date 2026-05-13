'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, User, ChevronRight, Shield, Star } from 'lucide-react';
import useMatchStore from '@/store/matchStore';
import { Team, Player, MatchFormat } from '@/store/types';
import { generateId } from '@/utils/formatting';

const FORMATS: { label: string; value: MatchFormat; overs: number }[] = [
  { label: 'T20', value: 'T20', overs: 20 },
  { label: 'ODI', value: 'ODI', overs: 50 },
  { label: 'Test', value: 'Test', overs: 90 },
  { label: 'Custom', value: 'Custom', overs: 10 },
];

const COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316'];

function makeDefaultTeam(name: string, shortName: string, color: string): Team {
  return {
    id: generateId(),
    name,
    shortName,
    color,
    players: Array.from({ length: 11 }, (_, i) => ({
      id: generateId(),
      name: `Player ${i + 1}`,
      isCaptain: i === 0,
      isWicketKeeper: i === 6,
    })),
  };
}

interface PlayerRowProps {
  player: Player;
  index: number;
  onChange: (p: Player) => void;
  onToggleCaptain: () => void;
  onToggleWK: () => void;
}

function PlayerRow({ player, index, onChange, onToggleCaptain, onToggleWK }: PlayerRowProps) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-6 text-center text-slate-500 text-sm shrink-0">{index + 1}</span>
      <input
        className="input-field text-sm flex-1 py-1.5"
        value={player.name}
        onChange={e => onChange({ ...player, name: e.target.value })}
        placeholder={`Player ${index + 1}`}
      />
      <button
        onClick={onToggleCaptain}
        title="Captain"
        className={`p-1.5 rounded-md transition-colors ${player.isCaptain ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-yellow-400'}`}
      >
        <Star className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onToggleWK}
        title="Wicket Keeper"
        className={`p-1.5 rounded-md transition-colors ${player.isWicketKeeper ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-blue-400'}`}
      >
        <Shield className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface TeamEditorProps {
  team: Team;
  onChange: (t: Team) => void;
  title: string;
}

function TeamEditor({ team, onChange, title }: TeamEditorProps) {
  function updatePlayer(idx: number, p: Player) {
    const players = [...team.players];
    players[idx] = p;
    onChange({ ...team, players });
  }
  function toggleCaptain(idx: number) {
    const players = team.players.map((p, i) => ({ ...p, isCaptain: i === idx }));
    onChange({ ...team, players });
  }
  function toggleWK(idx: number) {
    const players = team.players.map((p, i) => ({ ...p, isWicketKeeper: i === idx }));
    onChange({ ...team, players });
  }

  return (
    <div className="score-card">
      <h3 className="font-bold text-white mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label">Team Name</label>
          <input
            className="input-field"
            value={team.name}
            onChange={e => onChange({ ...team, name: e.target.value })}
            placeholder="Team Name"
          />
        </div>
        <div>
          <label className="label">Short Name</label>
          <input
            className="input-field"
            value={team.shortName}
            onChange={e => onChange({ ...team, shortName: e.target.value.toUpperCase().slice(0, 4) })}
            placeholder="ABC"
            maxLength={4}
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="label">Team Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => onChange({ ...team, color: c })}
              style={{ background: c }}
              className={`w-8 h-8 rounded-full transition-transform ${team.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'}`}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Playing XI</label>
          <span className="text-xs text-slate-500">
            <Star className="w-3 h-3 inline mr-1 text-yellow-500" />Captain
            <Shield className="w-3 h-3 inline ml-2 mr-1 text-blue-400" />WK
          </span>
        </div>
        <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
          {team.players.map((p, i) => (
            <PlayerRow
              key={p.id}
              player={p}
              index={i}
              onChange={np => updatePlayer(i, np)}
              onToggleCaptain={() => toggleCaptain(i)}
              onToggleWK={() => toggleWK(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props {
  onComplete: () => void;
}

export default function MatchSetup({ onComplete }: Props) {
  const { createMatch } = useMatchStore();
  const [step, setStep] = useState<'format' | 'teams'>('format');
  const [format, setFormat] = useState<MatchFormat>('T20');
  const [maxOvers, setMaxOvers] = useState(20);
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [team1, setTeam1] = useState<Team>(makeDefaultTeam('Team Alpha', 'ALP', '#ef4444'));
  const [team2, setTeam2] = useState<Team>(makeDefaultTeam('Team Bravo', 'BRV', '#3b82f6'));

  function selectFormat(f: typeof FORMATS[0]) {
    setFormat(f.value);
    setMaxOvers(f.overs);
  }

  function handleCreate() {
    createMatch({ format, maxOvers, venue, date, team1, team2 });
    onComplete();
  }

  if (step === 'format') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Match</h2>
        <div className="score-card mb-6">
          <h3 className="font-semibold text-white mb-4">Match Format</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {FORMATS.map(f => (
              <button
                key={f.value}
                onClick={() => selectFormat(f)}
                className={`py-4 rounded-xl font-bold text-lg transition-all ${format === f.value
                  ? 'bg-green-600 text-white shadow-lg shadow-green-900/40 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {format === 'Custom' && (
            <div className="mb-4">
              <label className="label">Custom Overs</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setMaxOvers(Math.max(1, maxOvers - 1))} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-bold text-white w-16 text-center">{maxOvers}</span>
                <button onClick={() => setMaxOvers(Math.min(200, maxOvers + 1))} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Venue</label>
              <input className="input-field" value={venue} onChange={e => setVenue(e.target.value)} placeholder="Stadium name" />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>
        <button
          onClick={() => setStep('teams')}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base"
        >
          Next: Team Setup <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep('format')} className="text-slate-400 hover:text-white transition-colors text-sm">← Back</button>
        <h2 className="text-2xl font-bold text-white">Team Setup</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <TeamEditor team={team1} onChange={setTeam1} title="Team 1" />
        <TeamEditor team={team2} onChange={setTeam2} title="Team 2" />
      </div>
      <button
        onClick={handleCreate}
        className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base"
      >
        <User className="w-5 h-5" />
        Create Match & Go to Toss
      </button>
    </motion.div>
  );
}
