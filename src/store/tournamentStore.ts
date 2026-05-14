'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Tournament, TournamentTeam, Fixture, PointsEntry, TournamentFormat, Ground, FixtureMode, ManagedTeam } from './tournamentTypes';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function generateRoundRobinFixtures(tournamentId: string, teams: TournamentTeam[]): Fixture[] {
  const fixtures: Fixture[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({ id: generateId(), tournamentId, team1Id: teams[i].id, team2Id: teams[j].id, date: '', time: '', ground: '', stage: 'League', status: 'scheduled' });
    }
  }
  return fixtures;
}

function generateKnockoutFixtures(tournamentId: string, teams: TournamentTeam[]): Fixture[] {
  const firstStage = teams.length <= 2 ? 'Final' : teams.length <= 4 ? 'Semi Final' : teams.length <= 8 ? 'Quarter Final' : 'Round of 16';
  const fixtures: Fixture[] = [];
  for (let i = 0; i < Math.floor(teams.length / 2); i++) {
    fixtures.push({ id: generateId(), tournamentId, team1Id: teams[i * 2].id, team2Id: teams[i * 2 + 1].id, date: '', time: '', ground: '', stage: firstStage, status: 'scheduled' });
  }
  return fixtures;
}

function generateLeagueKnockoutFixtures(tournamentId: string, teams: TournamentTeam[]): Fixture[] {
  const league = generateRoundRobinFixtures(tournamentId, teams);
  const knockoutStages = teams.length <= 4 ? ['Final'] : teams.length <= 6 ? ['Semi Final', 'Final'] : ['Quarter Final', 'Semi Final', 'Final'];
  const knockout: Fixture[] = knockoutStages.slice(0, 1).map(stage => ({
    id: generateId(), tournamentId, team1Id: '', team2Id: '', date: '', time: '', ground: '', stage, status: 'scheduled' as const,
  }));
  return [...league, ...knockout];
}

function recalcPoints(teams: TournamentTeam[], fixtures: Fixture[]): PointsEntry[] {
  const map: Record<string, PointsEntry> = {};
  for (const t of teams) {
    map[t.id] = { teamId: t.id, played: 0, won: 0, lost: 0, tied: 0, noResult: 0, points: 0, runsScored: 0, runsConceded: 0, nrr: 0 };
  }
  for (const f of fixtures) {
    if (f.status !== 'completed' || !f.winnerTeamId || !f.team1Id || !f.team2Id) continue;
    const t1 = map[f.team1Id]; const t2 = map[f.team2Id];
    if (!t1 || !t2) continue;
    t1.played++; t2.played++;
    if (f.winnerTeamId === 'tie') { t1.tied++; t2.tied++; t1.points += 1; t2.points += 1; }
    else if (f.winnerTeamId === f.team1Id) { t1.won++; t1.points += 2; t2.lost++; }
    else { t2.won++; t2.points += 2; t1.lost++; }
    if (f.team1Runs !== undefined) { t1.runsScored += f.team1Runs; t1.runsConceded += f.team2Runs ?? 0; t2.runsScored += f.team2Runs ?? 0; t2.runsConceded += f.team1Runs; }
  }
  for (const entry of Object.values(map)) {
    const diff = entry.runsScored - entry.runsConceded;
    entry.nrr = entry.played > 0 ? parseFloat((diff / entry.played).toFixed(3)) : 0;
  }
  return Object.values(map).sort((a, b) => b.points - a.points || b.nrr - a.nrr);
}

interface TournamentState {
  tournaments: Record<string, Tournament>;
  managedTeams: ManagedTeam[];
}
interface TournamentActions {
  createTournament(data: { name: string; organizer: string; startDate: string; endDate: string; venue: string; format: TournamentFormat; description: string; oversPerInnings?: number }): string;
  addTeam(tournamentId: string, team: Omit<TournamentTeam, 'id'>): void;
  removeTeam(tournamentId: string, teamId: string): void;
  addGround(tournamentId: string, ground: Omit<Ground, 'id'>): void;
  removeGround(tournamentId: string, groundId: string): void;
  setFixtureMode(tournamentId: string, mode: FixtureMode): void;
  generateFixtures(tournamentId: string): void;
  addCustomFixture(tournamentId: string, fixture: Omit<Fixture, 'id' | 'tournamentId'>): void;
  removeFixture(tournamentId: string, fixtureId: string): void;
  updateFixture(tournamentId: string, fixtureId: string, data: Partial<Fixture>): void;
  deleteTournament(id: string): void;
  // Managed teams
  createManagedTeam(team: Omit<ManagedTeam, 'id'>): string;
  updateManagedTeam(id: string, data: Partial<Omit<ManagedTeam, 'id'>>): void;
  deleteManagedTeam(id: string): void;
}

type Store = TournamentState & TournamentActions;

export const useTournamentStore = create<Store>()(
  persist(
    (set, get) => ({
      tournaments: {},
      managedTeams: [],

      createTournament(data) {
        const id = generateId();
        const tournament: Tournament = {
          id, ...data,
          oversPerInnings: data.oversPerInnings ?? 20,
          fixtureMode: 'auto',
          grounds: [],
          teams: [], fixtures: [], pointsTable: [],
          status: 'upcoming',
          createdAt: Date.now(),
        };
        set(s => ({ tournaments: { ...s.tournaments, [id]: tournament } }));
        return id;
      },

      addTeam(tournamentId, team) {
        set(s => {
          const t = s.tournaments[tournamentId];
          if (!t) return s;
          return { tournaments: { ...s.tournaments, [tournamentId]: { ...t, teams: [...t.teams, { ...team, id: generateId() }] } } };
        });
      },

      removeTeam(tournamentId, teamId) {
        set(s => {
          const t = s.tournaments[tournamentId];
          if (!t) return s;
          return { tournaments: { ...s.tournaments, [tournamentId]: { ...t, teams: t.teams.filter(tm => tm.id !== teamId) } } };
        });
      },

      addGround(tournamentId, ground) {
        set(s => {
          const t = s.tournaments[tournamentId];
          if (!t) return s;
          const newGround: Ground = { ...ground, id: generateId() };
          return { tournaments: { ...s.tournaments, [tournamentId]: { ...t, grounds: [...(t.grounds ?? []), newGround] } } };
        });
      },

      removeGround(tournamentId, groundId) {
        set(s => {
          const t = s.tournaments[tournamentId];
          if (!t) return s;
          return { tournaments: { ...s.tournaments, [tournamentId]: { ...t, grounds: t.grounds.filter(g => g.id !== groundId) } } };
        });
      },

      setFixtureMode(tournamentId, mode) {
        set(s => {
          const t = s.tournaments[tournamentId];
          if (!t) return s;
          return { tournaments: { ...s.tournaments, [tournamentId]: { ...t, fixtureMode: mode } } };
        });
      },

      generateFixtures(tournamentId) {
        const t = get().tournaments[tournamentId];
        if (!t || t.teams.length < 2) return;
        let fixtures: Fixture[];
        if (t.format === 'knockout') fixtures = generateKnockoutFixtures(tournamentId, t.teams);
        else if (t.format === 'league_knockout') fixtures = generateLeagueKnockoutFixtures(tournamentId, t.teams);
        else fixtures = generateRoundRobinFixtures(tournamentId, t.teams);
        set(s => ({ tournaments: { ...s.tournaments, [tournamentId]: { ...t, fixtures, fixtureMode: 'auto', status: 'ongoing' } } }));
      },

      addCustomFixture(tournamentId, fixture) {
        set(s => {
          const t = s.tournaments[tournamentId];
          if (!t) return s;
          const newFixture: Fixture = { ...fixture, id: generateId(), tournamentId };
          const fixtures = [...t.fixtures, newFixture];
          return { tournaments: { ...s.tournaments, [tournamentId]: { ...t, fixtures, status: 'ongoing' } } };
        });
      },

      removeFixture(tournamentId, fixtureId) {
        set(s => {
          const t = s.tournaments[tournamentId];
          if (!t) return s;
          const fixtures = t.fixtures.filter(f => f.id !== fixtureId);
          const pointsTable = recalcPoints(t.teams, fixtures);
          return { tournaments: { ...s.tournaments, [tournamentId]: { ...t, fixtures, pointsTable } } };
        });
      },

      updateFixture(tournamentId, fixtureId, data) {
        set(s => {
          const t = s.tournaments[tournamentId];
          if (!t) return s;
          const fixtures = t.fixtures.map(f => f.id === fixtureId ? { ...f, ...data } : f);
          const pointsTable = recalcPoints(t.teams, fixtures);
          return { tournaments: { ...s.tournaments, [tournamentId]: { ...t, fixtures, pointsTable } } };
        });
      },

      deleteTournament(id) {
        set(s => { const { [id]: _, ...rest } = s.tournaments; return { tournaments: rest }; });
      },

      createManagedTeam(team) {
        const id = generateId();
        const newTeam: ManagedTeam = { ...team, id };
        set(s => ({ managedTeams: [...s.managedTeams, newTeam] }));
        return id;
      },

      updateManagedTeam(id, data) {
        set(s => ({ managedTeams: s.managedTeams.map(t => t.id === id ? { ...t, ...data } : t) }));
      },

      deleteManagedTeam(id) {
        set(s => ({ managedTeams: s.managedTeams.filter(t => t.id !== id) }));
      },
    }),
    { name: 'cricket-tournament-v1', storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }) }
  )
);

export default useTournamentStore;
