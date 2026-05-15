'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, User, ChevronRight, Shield, Star, Trophy, Calendar, MapPin } from 'lucide-react';
import useMatchStore from '@/store/matchStore';
import useTournamentStore from '@/store/tournamentStore';
import { Team, Player, MatchFormat } from '@/store/types';
import { TournamentTeam, Fixture } from '@/store/tournamentTypes';
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

function teamFromTournamentTeam(tt: TournamentTeam): Team {
  const names = tt.players?.length ? tt.players : Array.from({ length: 11 }, (_, i) => `Player ${i + 1}`);
  return {
    id: generateId(),
    name: tt.name,
    shortName: tt.shortName,
    color: tt.color,
    players: names.map((name, i) => ({
      id: generateId(),
      name: name || `Player ${i + 1}`,
      isCaptain: tt.captainName ? name === tt.captainName : i === 0,
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
      <button onClick={onToggleCaptain} title="Captain"
        className={`p-1.5 rounded-md transition-colors ${player.isCaptain ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-yellow-400'}`}>
        <Star className="w-3.5 h-3.5" />
      </button>
      <button onClick={onToggleWK} title="Wicket Keeper"
        className={`p-1.5 rounded-md transition-colors ${player.isWicketKeeper ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-blue-400'}`}>
        <Shield className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function TeamEditor({ team, onChange, title }: { team: Team; onChange: (t: Team) => void; title: string }) {
  function updatePlayer(idx: number, p: Player) {
    const players = [...team.players]; players[idx] = p; onChange({ ...team, players });
  }
  function toggleCaptain(idx: number) {
    onChange({ ...team, players: team.players.map((p, i) => ({ ...p, isCaptain: i === idx })) });
  }
  function toggleWK(idx: number) {
    onChange({ ...team, players: team.players.map((p, i) => ({ ...p, isWicketKeeper: i === idx })) });
  }
  return (
    <div className="score-card">
      <h3 className="font-bold text-white mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><label className="label">Team Name</label><input className="input-field" value={team.name} onChange={e => onChange({ ...team, name: e.target.value })} placeholder="Team Name" /></div>
        <div><label className="label">Short Name</label><input className="input-field" value={team.shortName} onChange={e => onChange({ ...team, shortName: e.target.value.toUpperCase().slice(0, 4) })} placeholder="ABC" maxLength={4} /></div>
      </div>
      <div className="mb-4">
        <label className="label">Team Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button key={c} onClick={() => onChange({ ...team, color: c })} style={{ background: c }}
              className={`w-8 h-8 rounded-full transition-transform ${team.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'}`}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Playing XI</label>
          <span className="text-xs text-slate-500"><Star className="w-3 h-3 inline mr-1 text-yellow-500" />Captain <Shield className="w-3 h-3 inline ml-2 mr-1 text-blue-400" />WK</span>
        </div>
        <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
          {team.players.map((p, i) => (
            <PlayerRow key={p.id} player={p} index={i} onChange={np => updatePlayer(i, np)} onToggleCaptain={() => toggleCaptain(i)} onToggleWK={() => toggleWK(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

type Step = 'type' | 'format' | 'tournament' | 'fixture' | 'teams';

export default function MatchSetup({ onComplete }: { onComplete: () => void }) {
  const { createMatch } = useMatchStore();
  const { tournaments, updateFixture } = useTournamentStore();
  const tournamentList = Object.values(tournaments).sort((a, b) => b.createdAt - a.createdAt);

  const [step, setStep] = useState<Step>('type');
  const [matchType, setMatchType] = useState<'regular' | 'tournament'>('regular');
  const [format, setFormat] = useState<MatchFormat>('T20');
  const [maxOvers, setMaxOvers] = useState(20);
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [team1, setTeam1] = useState<Team>(makeDefaultTeam('Team Alpha', 'ALP', '#ef4444'));
  const [team2, setTeam2] = useState<Team>(makeDefaultTeam('Team Bravo', 'BRV', '#3b82f6'));
  const [linkedTournamentId, setLinkedTournamentId] = useState<string | undefined>();
  const [linkedFixtureId, setLinkedFixtureId] = useState<string | undefined>();
  const [linkedTeam1Id, setLinkedTeam1Id] = useState<string | undefined>();
  const [linkedTeam2Id, setLinkedTeam2Id] = useState<string | undefined>();

  const selectedTournament = tournamentList.find(t => t.id === selectedTournamentId);
  const availableFixtures = selectedTournament?.fixtures.filter(f => f.status === 'scheduled' && f.team1Id && f.team2Id) ?? [];

  function selectFixture(fixture: Fixture) {
    if (!selectedTournament) return;
    const tTeam1 = selectedTournament.teams.find(t => t.id === fixture.team1Id);
    const tTeam2 = selectedTournament.teams.find(t => t.id === fixture.team2Id);
    if (!tTeam1 || !tTeam2) return;
    setTeam1(teamFromTournamentTeam(tTeam1));
    setTeam2(teamFromTournamentTeam(tTeam2));
    setMaxOvers(selectedTournament.oversPerInnings ?? 20);
    setVenue(fixture.ground || selectedTournament.venue || '');
    setDate(fixture.date || new Date().toISOString().split('T')[0]);
    setFormat('Custom');
    setLinkedTournamentId(selectedTournament.id);
    setLinkedFixtureId(fixture.id);
    setLinkedTeam1Id(fixture.team1Id);
    setLinkedTeam2Id(fixture.team2Id);
    setStep('teams');
  }

  function handleCreate() {
    const matchId = createMatch({ format, maxOvers, venue, date, team1, team2, tournamentId: linkedTournamentId, fixtureId: linkedFixtureId, tournamentTeam1Id: linkedTeam1Id, tournamentTeam2Id: linkedTeam2Id });
    if (linkedTournamentId && linkedFixtureId) {
      const newMatch = useMatchStore.getState().matches[matchId];
      if (newMatch?.matchCode) {
        updateFixture(linkedTournamentId, linkedFixtureId, { status: 'live', matchCode: newMatch.matchCode });
      }
    }
    onComplete();
  }

  // ——— Step: type ———
  if (step === 'type') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Match</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => { setMatchType('regular'); setStep('format'); }} className="score-card text-left p-6 hover:border-green-600/50 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-green-700/20 flex items-center justify-center mb-4 group-hover:bg-green-700/40 transition-colors">
              <User className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-bold text-white text-lg mb-1">Regular Match</h3>
            <p className="text-slate-400 text-sm">Standalone match with custom teams and format.</p>
          </button>
          <button onClick={() => { setMatchType('tournament'); setStep('tournament'); }}
            className={`score-card text-left p-6 transition-colors group ${tournamentList.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:border-yellow-600/50'}`}
            disabled={tournamentList.length === 0}
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-700/20 flex items-center justify-center mb-4 group-hover:bg-yellow-700/40 transition-colors">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="font-bold text-white text-lg mb-1">Tournament Fixture</h3>
            <p className="text-slate-400 text-sm">
              {tournamentList.length === 0 ? 'Create a tournament first.' : 'Link to a fixture — teams and overs auto-populate.'}
            </p>
          </button>
        </div>
      </motion.div>
    );
  }

  // ——— Step: pick tournament ———
  if (step === 'tournament') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep('type')} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h2 className="text-2xl font-bold text-white">Select Tournament</h2>
        </div>
        <div className="space-y-3">
          {tournamentList.map(t => (
            <button key={t.id} onClick={() => { setSelectedTournamentId(t.id); setStep('fixture'); }}
              className="w-full score-card text-left p-4 hover:border-yellow-600/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">{t.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.teams.length} teams · {t.fixtures.filter(f => f.status === 'scheduled').length} available fixtures · {t.oversPerInnings ?? 20} overs/innings
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  // ——— Step: pick fixture ———
  if (step === 'fixture') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep('tournament')} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h2 className="text-2xl font-bold text-white">Select Fixture</h2>
          {selectedTournament && <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded-full">{selectedTournament.name}</span>}
        </div>
        {availableFixtures.length === 0 ? (
          <div className="score-card text-center py-10">
            <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No scheduled fixtures available.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableFixtures.map(f => {
              const t1 = selectedTournament?.teams.find(t => t.id === f.team1Id);
              const t2 = selectedTournament?.teams.find(t => t.id === f.team2Id);
              if (!t1 || !t2) return null;
              return (
                <button key={f.id} onClick={() => selectFixture(f)} className="w-full score-card text-left p-4 hover:border-green-600/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">{f.stage}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: t1.color }} />
                      <span className="font-semibold text-white text-sm truncate">{t1.name}</span>
                    </div>
                    <span className="text-slate-500 text-xs shrink-0">vs</span>
                    <div className="flex items-center gap-1.5 min-w-0 justify-end">
                      <span className="font-semibold text-white text-sm truncate">{t2.name}</span>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: t2.color }} />
                    </div>
                  </div>
                  {(f.date || f.ground) && (
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-3">
                      {f.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{f.date}</span>}
                      {f.ground && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{f.ground}</span>}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  // ——— Step: format (regular match only) ———
  if (step === 'format') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep('type')} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h2 className="text-2xl font-bold text-white">Match Details</h2>
        </div>
        <div className="score-card mb-6">
          <h3 className="font-semibold text-white mb-4">Match Format</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {FORMATS.map(f => (
              <button key={f.value} onClick={() => { setFormat(f.value); setMaxOvers(f.overs); }}
                className={`py-4 rounded-xl font-bold text-lg transition-all ${format === f.value ? 'bg-green-600 text-white shadow-lg shadow-green-900/40 scale-105' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                {f.label}
              </button>
            ))}
          </div>
          {format === 'Custom' && (
            <div className="mb-4">
              <label className="label">Custom Overs</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setMaxOvers(Math.max(1, maxOvers - 1))} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"><Minus className="w-4 h-4" /></button>
                <span className="text-2xl font-bold text-white w-16 text-center">{maxOvers}</span>
                <button onClick={() => setMaxOvers(Math.min(200, maxOvers + 1))} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Venue</label><input className="input-field" value={venue} onChange={e => setVenue(e.target.value)} placeholder="Stadium name" /></div>
            <div><label className="label">Date</label><input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          </div>
        </div>
        <button onClick={() => setStep('teams')} className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base">
          Next: Team Setup <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    );
  }

  // ——— Step: teams ———
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setStep(matchType === 'tournament' ? 'fixture' : 'format')} className="text-slate-400 hover:text-white text-sm">← Back</button>
        <h2 className="text-2xl font-bold text-white">Team Setup</h2>
        {matchType === 'tournament' && selectedTournament && (
          <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Trophy className="w-3 h-3" />{selectedTournament.name}
          </span>
        )}
      </div>
      {matchType === 'tournament' && (
        <div className="score-card mb-4 p-3 flex flex-wrap gap-4 text-sm">
          <span className="text-slate-400">Overs: <span className="text-white font-semibold">{maxOvers}</span></span>
          {venue && <span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /><span className="text-white">{venue}</span></span>}
          {date && <span className="text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /><span className="text-white">{date}</span></span>}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <TeamEditor team={team1} onChange={setTeam1} title="Team 1" />
        <TeamEditor team={team2} onChange={setTeam2} title="Team 2" />
      </div>
      <button onClick={handleCreate} className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base">
        <User className="w-5 h-5" /> Create Match & Go to Toss
      </button>
    </motion.div>
  );
}
