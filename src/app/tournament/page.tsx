'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, ArrowLeft, Users, Calendar, Trash2, Play, BarChart2, List, ChevronRight, MapPin, Zap, PenLine } from 'lucide-react';
import useTournamentStore from '@/store/tournamentStore';
import { Tournament, TournamentTeam, Fixture, TournamentFormat, Ground } from '@/store/tournamentTypes';

const COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316'];
const FORMATS: { label: string; value: TournamentFormat }[] = [
  { label: 'League (Round Robin)', value: 'league' },
  { label: 'Knockout', value: 'knockout' },
  { label: 'Round Robin', value: 'round_robin' },
  { label: 'League + Knockout', value: 'league_knockout' },
  { label: 'Custom', value: 'custom' },
];
const STAGE_PRESETS = ['League', 'Group Stage', 'Quarter Final', 'Semi Final', 'Final', 'Plate Final', 'Custom'];

type View = 'list' | 'create' | 'detail';
type DetailTab = 'overview' | 'teams' | 'fixtures' | 'points' | 'grounds';

// ——— Create Tournament Form ———
function CreateForm({ onDone }: { onDone: () => void }) {
  const { createTournament } = useTournamentStore();
  const [form, setForm] = useState({ name: '', organizer: '', startDate: '', endDate: '', venue: '', format: 'league' as TournamentFormat, description: '' });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    createTournament(form);
    onDone();
  }
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const cls = 'w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 placeholder-slate-500';
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-xs text-slate-400 mb-1 block">Tournament Name *</label><input required className={cls} placeholder="Premier League 2026" value={form.name} onChange={f('name')} /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">Organizer</label><input className={cls} placeholder="Cricket Club" value={form.organizer} onChange={f('organizer')} /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">Start Date</label><input type="date" className={cls} value={form.startDate} onChange={f('startDate')} /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">End Date</label><input type="date" className={cls} value={form.endDate} onChange={f('endDate')} /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">Venue</label><input className={cls} placeholder="Main Ground" value={form.venue} onChange={f('venue')} /></div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Format</label>
          <select className={cls} value={form.format} onChange={f('format')}>
            {FORMATS.map(fmt => <option key={fmt.value} value={fmt.value}>{fmt.label}</option>)}
          </select>
        </div>
      </div>
      <div><label className="text-xs text-slate-400 mb-1 block">Description</label><textarea className={cls} rows={2} placeholder="Optional description..." value={form.description} onChange={f('description')} /></div>
      <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors">Create Tournament</button>
    </form>
  );
}

// ——— Add Team Form ———
function AddTeamForm({ tournamentId, onDone }: { tournamentId: string; onDone: () => void }) {
  const { addTeam } = useTournamentStore();
  const [form, setForm] = useState({ name: '', shortName: '', captainName: '', color: COLORS[0] });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    addTeam(tournamentId, form);
    setForm({ name: '', shortName: '', captainName: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    onDone();
  }
  const cls = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-green-500 placeholder-slate-500 text-sm';
  return (
    <form onSubmit={submit} className="bg-slate-800/40 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Add Team</h3>
      <div className="grid grid-cols-2 gap-2">
        <input required className={cls} placeholder="Team Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <input className={cls} placeholder="Short (e.g. CSK)" maxLength={4} value={form.shortName} onChange={e => setForm(p => ({ ...p, shortName: e.target.value.toUpperCase() }))} />
        <input className={cls} placeholder="Captain Name" value={form.captainName} onChange={e => setForm(p => ({ ...p, captainName: e.target.value }))} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Color</span>
          <div className="flex gap-1 flex-wrap">
            {COLORS.slice(0, 5).map(c => (
              <button type="button" key={c} onClick={() => setForm(p => ({ ...p, color: c }))} className={`w-5 h-5 rounded-full border-2 ${form.color === c ? 'border-white' : 'border-transparent'}`} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl text-sm transition-colors">Add Team</button>
    </form>
  );
}

// ——— Add Ground Form ———
function AddGroundForm({ tournamentId, onDone }: { tournamentId: string; onDone: () => void }) {
  const { addGround } = useTournamentStore();
  const [form, setForm] = useState({ name: '', location: '' });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    addGround(tournamentId, form);
    setForm({ name: '', location: '' });
    onDone();
  }
  const cls = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-green-500 placeholder-slate-500 text-sm';
  return (
    <form onSubmit={submit} className="bg-slate-800/40 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Add Ground</h3>
      <div className="grid grid-cols-2 gap-2">
        <input required className={cls} placeholder="Ground Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <input className={cls} placeholder="Location (optional)" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
      </div>
      <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-xl text-sm transition-colors">Add Ground</button>
    </form>
  );
}

// ——— Add Custom Fixture Form ———
function AddCustomFixtureForm({ tournament, onDone }: { tournament: Tournament; onDone: () => void }) {
  const { addCustomFixture } = useTournamentStore();
  const [form, setForm] = useState({
    team1Id: tournament.teams[0]?.id ?? '',
    team2Id: tournament.teams[1]?.id ?? '',
    stage: 'League',
    customStage: '',
    date: '',
    time: '',
    groundId: '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.team1Id || !form.team2Id || form.team1Id === form.team2Id) return;
    const stage = form.stage === 'Custom' ? (form.customStage.trim() || 'Custom') : form.stage;
    const ground = tournament.grounds.find(g => g.id === form.groundId);
    addCustomFixture(tournament.id, {
      team1Id: form.team1Id,
      team2Id: form.team2Id,
      stage,
      date: form.date,
      time: form.time,
      groundId: form.groundId || undefined,
      ground: ground?.name ?? '',
      status: 'scheduled',
    });
    onDone();
  }

  const cls = 'w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-green-500 text-sm';

  return (
    <form onSubmit={submit} className="bg-slate-800/40 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Add Fixture</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Team 1 *</label>
          <select className={cls} value={form.team1Id} onChange={e => setForm(p => ({ ...p, team1Id: e.target.value }))}>
            {tournament.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Team 2 *</label>
          <select className={cls} value={form.team2Id} onChange={e => setForm(p => ({ ...p, team2Id: e.target.value }))}>
            {tournament.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Stage</label>
          <select className={cls} value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}>
            {STAGE_PRESETS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {form.stage === 'Custom' && (
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Stage Name</label>
            <input className={cls} placeholder="e.g. Round of 16" value={form.customStage} onChange={e => setForm(p => ({ ...p, customStage: e.target.value }))} />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" className={cls} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
        <input type="time" className={cls} value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
      </div>
      {tournament.grounds.length > 0 && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Ground</label>
          <select className={cls} value={form.groundId} onChange={e => setForm(p => ({ ...p, groundId: e.target.value }))}>
            <option value="">No ground selected</option>
            {tournament.grounds.map(g => <option key={g.id} value={g.id}>{g.name}{g.location ? ` — ${g.location}` : ''}</option>)}
          </select>
        </div>
      )}
      {form.team1Id === form.team2Id && form.team1Id && (
        <p className="text-xs text-red-400">Team 1 and Team 2 must be different.</p>
      )}
      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl text-sm transition-colors">Add Fixture</button>
    </form>
  );
}

// ——— Fixture Card ———
function FixtureCard({ fixture, teams, grounds, onUpdate, onDelete }: { fixture: Fixture; teams: TournamentTeam[]; grounds?: Ground[]; onUpdate: (data: Partial<Fixture>) => void; onDelete?: () => void }) {
  const t1 = teams.find(t => t.id === fixture.team1Id);
  const t2 = teams.find(t => t.id === fixture.team2Id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    date: fixture.date,
    time: fixture.time,
    ground: fixture.ground,
    groundId: fixture.groundId ?? '',
    matchCode: fixture.matchCode ?? '',
    winnerTeamId: fixture.winnerTeamId ?? '',
    team1Runs: fixture.team1Runs ?? '' as number | string,
    team2Runs: fixture.team2Runs ?? '' as number | string,
  });

  if (!t1 && !t2) return null;

  function save() {
    const isCompleted = !!form.winnerTeamId;
    const selectedGround = grounds?.find(g => g.id === form.groundId);
    onUpdate({
      date: form.date,
      time: form.time,
      groundId: form.groundId || undefined,
      ground: selectedGround ? selectedGround.name : (form.ground as string),
      matchCode: form.matchCode || undefined,
      winnerTeamId: form.winnerTeamId || undefined,
      team1Runs: form.team1Runs !== '' ? Number(form.team1Runs) : undefined,
      team2Runs: form.team2Runs !== '' ? Number(form.team2Runs) : undefined,
      status: isCompleted ? 'completed' : 'scheduled',
    });
    setEditing(false);
  }

  const statusCls: Record<string, string> = { scheduled: 'bg-slate-700 text-slate-300', live: 'bg-red-600 text-white', completed: 'bg-green-800 text-green-300', cancelled: 'bg-slate-800 text-slate-500' };
  const winner = form.winnerTeamId ? teams.find(t => t.id === form.winnerTeamId) : null;
  const groundName = grounds?.find(g => g.id === fixture.groundId)?.name || fixture.ground;

  return (
    <div className="bg-[#0f1928] border border-[#1e3a5f] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{fixture.stage}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusCls[fixture.status] ?? statusCls.scheduled}`}>{fixture.status}</span>
          {onDelete && (
            <button onClick={onDelete} className="text-slate-600 hover:text-red-400 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {t1 && <div className="w-3 h-3 rounded-full" style={{ background: t1.color }} />}
          <span className="font-semibold text-white text-sm">{t1 ? (t1.shortName || t1.name) : 'TBD'}</span>
        </div>
        <span className="text-slate-500 text-xs">vs</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">{t2 ? (t2.shortName || t2.name) : 'TBD'}</span>
          {t2 && <div className="w-3 h-3 rounded-full" style={{ background: t2.color }} />}
        </div>
      </div>
      {fixture.status === 'completed' && winner && (
        <p className="text-green-400 text-xs mb-2">{winner.name} won</p>
      )}
      {(fixture.date || groundName) && (
        <p className="text-xs text-slate-500 mb-2">{fixture.date} {fixture.time} {groundName && `• ${groundName}`}</p>
      )}
      {fixture.matchCode && <p className="text-xs font-mono text-slate-600 mb-2">{fixture.matchCode}</p>}

      {editing ? (
        <div className="space-y-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            <input type="time" className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
          </div>
          {grounds && grounds.length > 0 ? (
            <select className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none" value={form.groundId} onChange={e => setForm(p => ({ ...p, groundId: e.target.value }))}>
              <option value="">No ground</option>
              {grounds.map(g => <option key={g.id} value={g.id}>{g.name}{g.location ? ` — ${g.location}` : ''}</option>)}
            </select>
          ) : (
            <input className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none" placeholder="Ground" value={form.ground as string} onChange={e => setForm(p => ({ ...p, ground: e.target.value }))} />
          )}
          <input className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none font-mono" placeholder="Match Code (CRK...)" value={form.matchCode} onChange={e => setForm(p => ({ ...p, matchCode: e.target.value.toUpperCase() }))} />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none" placeholder={`${t1 ? (t1.shortName || t1.name) : 'T1'} runs`} value={form.team1Runs} onChange={e => setForm(p => ({ ...p, team1Runs: e.target.value }))} />
            <input type="number" className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none" placeholder={`${t2 ? (t2.shortName || t2.name) : 'T2'} runs`} value={form.team2Runs} onChange={e => setForm(p => ({ ...p, team2Runs: e.target.value }))} />
          </div>
          <select className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none" value={form.winnerTeamId} onChange={e => setForm(p => ({ ...p, winnerTeamId: e.target.value }))}>
            <option value="">Result pending</option>
            {t1 && <option value={t1.id}>{t1.name} won</option>}
            {t2 && <option value={t2.id}>{t2.name} won</option>}
            <option value="tie">Tie / No result</option>
          </select>
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold py-1.5 rounded-lg">Save</button>
            <button onClick={() => setEditing(false)} className="flex-1 bg-slate-700 text-white text-xs font-semibold py-1.5 rounded-lg">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="w-full text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg py-1.5 transition-colors">
          Edit
        </button>
      )}
    </div>
  );
}

// ——— Points Table ———
function PointsTable({ tournament }: { tournament: Tournament }) {
  if (tournament.teams.length === 0) return <p className="text-slate-500 text-sm">Add teams and generate fixtures first.</p>;
  const table = tournament.pointsTable.length > 0 ? tournament.pointsTable : tournament.teams.map(t => ({ teamId: t.id, played: 0, won: 0, lost: 0, tied: 0, noResult: 0, points: 0, runsScored: 0, runsConceded: 0, nrr: 0 }));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
            <th className="text-left py-2 pr-4">Team</th>
            <th className="py-2 px-2 text-center">P</th>
            <th className="py-2 px-2 text-center">W</th>
            <th className="py-2 px-2 text-center">L</th>
            <th className="py-2 px-2 text-center">T</th>
            <th className="py-2 px-2 text-center">Pts</th>
            <th className="py-2 px-2 text-center">NRR</th>
          </tr>
        </thead>
        <tbody>
          {table.map((entry, i) => {
            const team = tournament.teams.find(t => t.id === entry.teamId);
            if (!team) return null;
            return (
              <tr key={entry.teamId} className={`border-b border-slate-800/50 ${i < 4 ? 'text-white' : 'text-slate-400'}`}>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: team.color }} />
                    <span className="font-medium">{team.shortName || team.name}</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center">{entry.played}</td>
                <td className="py-2 px-2 text-center text-green-400">{entry.won}</td>
                <td className="py-2 px-2 text-center text-red-400">{entry.lost}</td>
                <td className="py-2 px-2 text-center">{entry.tied}</td>
                <td className="py-2 px-2 text-center font-bold">{entry.points}</td>
                <td className="py-2 px-2 text-center text-xs">{entry.nrr > 0 ? '+' : ''}{entry.nrr.toFixed(3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ——— Tournament Detail ———
function TournamentDetail({ tournament }: { tournament: Tournament }) {
  const { addTeam, removeTeam, generateFixtures, updateFixture, removeFixture, setFixtureMode, removeGround } = useTournamentStore();
  const [tab, setTab] = useState<DetailTab>('overview');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddGround, setShowAddGround] = useState(false);
  const [showAddFixture, setShowAddFixture] = useState(false);

  const grounds = tournament.grounds ?? [];
  const fixtureMode = tournament.fixtureMode ?? 'auto';

  const tabs: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Trophy className="w-3.5 h-3.5" /> },
    { key: 'teams', label: `Teams (${tournament.teams.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'fixtures', label: `Fixtures (${tournament.fixtures.length})`, icon: <List className="w-3.5 h-3.5" /> },
    { key: 'points', label: 'Points', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: 'grounds', label: `Grounds (${grounds.length})`, icon: <MapPin className="w-3.5 h-3.5" /> },
  ];

  // Derive unique stages in order
  const stageOrder = ['League', 'Group Stage', 'Quarter Final', 'Semi Final', 'Final', 'Plate Final'];
  const fixtureStages = Array.from(new Set(tournament.fixtures.map(f => f.stage))).sort((a, b) => {
    const ai = stageOrder.indexOf(a); const bi = stageOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1; if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800/40 p-1 rounded-xl overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Format', val: FORMATS.find(f => f.value === tournament.format)?.label ?? tournament.format },
              { label: 'Teams', val: tournament.teams.length.toString() },
              { label: 'Fixtures', val: tournament.fixtures.length.toString() },
              { label: 'Status', val: tournament.status },
            ].map(item => (
              <div key={item.label} className="bg-slate-800/40 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                <p className="font-bold text-white capitalize">{item.val}</p>
              </div>
            ))}
          </div>
          {tournament.organizer && <p className="text-slate-400 text-sm">Organizer: <span className="text-white">{tournament.organizer}</span></p>}
          {tournament.venue && <p className="text-slate-400 text-sm">Venue: <span className="text-white">{tournament.venue}</span></p>}
          {tournament.startDate && <p className="text-slate-400 text-sm">Dates: <span className="text-white">{tournament.startDate} — {tournament.endDate}</span></p>}
          {tournament.description && <p className="text-slate-400 text-sm">{tournament.description}</p>}
        </div>
      )}

      {/* Teams */}
      {tab === 'teams' && (
        <div className="space-y-4">
          <AnimatePresence>
            {showAddTeam && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <AddTeamForm tournamentId={tournament.id} onDone={() => setShowAddTeam(false)} />
              </motion.div>
            )}
          </AnimatePresence>
          {!showAddTeam && (
            <button onClick={() => setShowAddTeam(true)} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
              <Plus className="w-4 h-4" /> Add Team
            </button>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {tournament.teams.map(team => (
              <div key={team.id} className="bg-[#0f1928] border border-[#1e3a5f] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: team.color }}>{team.shortName?.[0] || team.name[0]}</div>
                  <div>
                    <p className="font-semibold text-white text-sm">{team.name}</p>
                    {team.captainName && <p className="text-xs text-slate-500">c: {team.captainName}</p>}
                  </div>
                </div>
                <button onClick={() => removeTeam(tournament.id, team.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {tournament.teams.length >= 2 && tournament.fixtures.length === 0 && (
            <button onClick={() => generateFixtures(tournament.id)} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors mt-2">
              <Play className="w-4 h-4" /> Generate Fixtures
            </button>
          )}
        </div>
      )}

      {/* Fixtures */}
      {tab === 'fixtures' && (
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-800/40 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFixtureMode(tournament.id, 'auto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${fixtureMode === 'auto' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Zap className="w-3.5 h-3.5" /> Auto
            </button>
            <button
              onClick={() => setFixtureMode(tournament.id, 'custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${fixtureMode === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <PenLine className="w-3.5 h-3.5" /> Custom
            </button>
          </div>

          {/* Auto mode: generate button */}
          {fixtureMode === 'auto' && tournament.fixtures.length === 0 && tournament.teams.length >= 2 && (
            <button onClick={() => generateFixtures(tournament.id)} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
              <Play className="w-4 h-4" /> Generate Fixtures
            </button>
          )}
          {fixtureMode === 'auto' && tournament.fixtures.length === 0 && tournament.teams.length < 2 && (
            <p className="text-slate-500 text-sm">Add at least 2 teams in the Teams tab, then generate fixtures.</p>
          )}

          {/* Custom mode: add fixture */}
          {fixtureMode === 'custom' && (
            <>
              {tournament.teams.length < 2 ? (
                <p className="text-slate-500 text-sm">Add at least 2 teams first.</p>
              ) : (
                <>
                  <AnimatePresence>
                    {showAddFixture && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <AddCustomFixtureForm tournament={tournament} onDone={() => setShowAddFixture(false)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!showAddFixture && (
                    <button onClick={() => setShowAddFixture(true)} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                      <Plus className="w-4 h-4" /> Add Fixture
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* Fixture List (both modes) */}
          {tournament.fixtures.length > 0 && (
            <div className="space-y-4">
              {fixtureStages.map(stage => {
                const stageFixtures = tournament.fixtures.filter(f => f.stage === stage);
                if (stageFixtures.length === 0) return null;
                return (
                  <div key={stage}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{stage}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {stageFixtures.map(f => (
                        <FixtureCard
                          key={f.id}
                          fixture={f}
                          teams={tournament.teams}
                          grounds={grounds}
                          onUpdate={data => updateFixture(tournament.id, f.id, data)}
                          onDelete={fixtureMode === 'custom' ? () => removeFixture(tournament.id, f.id) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Points Table */}
      {tab === 'points' && <PointsTable tournament={tournament} />}

      {/* Grounds */}
      {tab === 'grounds' && (
        <div className="space-y-4">
          <AnimatePresence>
            {showAddGround && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <AddGroundForm tournamentId={tournament.id} onDone={() => setShowAddGround(false)} />
              </motion.div>
            )}
          </AnimatePresence>
          {!showAddGround && (
            <button onClick={() => setShowAddGround(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
              <Plus className="w-4 h-4" /> Add Ground
            </button>
          )}
          {grounds.length === 0 && !showAddGround && (
            <div className="text-center py-10">
              <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No grounds added yet. Add grounds to assign them to fixtures.</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {grounds.map(ground => (
              <div key={ground.id} className="bg-[#0f1928] border border-[#1e3a5f] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{ground.name}</p>
                    {ground.location && <p className="text-xs text-slate-500">{ground.location}</p>}
                  </div>
                </div>
                <button onClick={() => removeGround(tournament.id, ground.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ——— Main Page ———
export default function TournamentPage() {
  const router = useRouter();
  const { tournaments, deleteTournament } = useTournamentStore();
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tournamentList = Object.values(tournaments).sort((a, b) => b.createdAt - a.createdAt);
  const selected = selectedId ? tournaments[selectedId] : null;

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-[#070d1a]">
        <header className="bg-[#0f1928] border-b border-[#1e3a5f] sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setView('list')} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="font-bold text-white">New Tournament</h1>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">
          <CreateForm onDone={() => setView('list')} />
        </main>
      </div>
    );
  }

  if (view === 'detail' && selected) {
    return (
      <div className="min-h-screen bg-[#070d1a]">
        <header className="bg-[#0f1928] border-b border-[#1e3a5f] sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setView('list')} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h1 className="font-bold text-white truncate">{selected.name}</h1>
            <button onClick={() => { if (confirm('Delete tournament?')) { deleteTournament(selected.id); setView('list'); } }} className="ml-auto p-2 text-slate-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          <TournamentDetail tournament={selected} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070d1a]">
      <header className="bg-[#0f1928] border-b border-[#1e3a5f] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div>
              <h1 className="font-bold text-white leading-none">Tournaments</h1>
              <p className="text-xs text-slate-400">Manage competitions</p>
            </div>
          </div>
          <button onClick={() => setView('create')} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {tournamentList.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Tournaments Yet</h2>
            <p className="text-slate-500 mb-6">Create your first tournament to manage fixtures, teams, and standings.</p>
            <button onClick={() => setView('create')} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              <Plus className="w-5 h-5" /> Create Tournament
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tournamentList.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-[#0f1928] border border-[#1e3a5f] hover:border-yellow-700/40 rounded-xl p-4 cursor-pointer transition-colors"
                onClick={() => { setSelectedId(t.id); setView('detail'); }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white">{t.name}</h3>
                    {t.organizer && <p className="text-xs text-slate-500">{t.organizer}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${t.status === 'ongoing' ? 'bg-green-800 text-green-300' : t.status === 'completed' ? 'bg-slate-700 text-slate-400' : 'bg-blue-900 text-blue-300'}`}>{t.status}</span>
                </div>
                <div className="flex gap-4 text-sm text-slate-400 mb-3">
                  <span>{t.teams.length} teams</span>
                  <span>{t.fixtures.length} fixtures</span>
                  <span className="capitalize">{FORMATS.find(f => f.value === t.format)?.label ?? t.format}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{t.startDate || 'TBD'}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
