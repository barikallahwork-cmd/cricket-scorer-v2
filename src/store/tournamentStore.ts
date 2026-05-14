'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Tournament, TournamentTeam, Fixture, PointsEntry, TournamentFormat } from './tournamentTypes';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function generateRoundRobinFixtures(tournamentId: string, teams: TournamentTeam[]): Fixture[] {
  const fixtures: Fixture[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        id: generateId(),
        tournamentId,
        team1Id: teams[i].id,
        team2Id: teams[j].id,
        date: '', time: '', ground: '',
        stage: 'League',
        status: 'scheduled',
      });
    }
  }
  return fixtures;
}

function generateKnockoutFixtures(tournamentId: string, teams: TournamentTeam[]): Fixture[] {
  const fixtures: Fixture[] = [];
  const stages = teams.length <= 2 ? ['Final'] :
    teams.length <= 4 ? ['Semi Final', 'Final'] :
    teams.length <= 8 ? ['Quarter Final', 'Semi Final', 'Final'] :
    ['Round of 16', 'Quarter Final', 'Semi Final', 'Final'];

  // Only generate first round
  for (let i = 0; i < Math.floor(teams.length / 2); i++) {
    fixtures.push({
      id: generateId(),
      tournamentId,
      team1Id: teams[i * 2].id,
      team2Id: teams[i * 2 + 1].id,
      date: '', time: '', ground: '',
      stage: stages[0],
      status: 'scheduled',
    });
  }
  return fixtures;
}

function recalcPoints(teams: TournamentTeam[], fixtures: Fixture[]): PointsEntry[] {
  const map: Record<string, PointsEntry> = {};
  for (const t of teams) {
    map[t.id] = { teamId: t.id, played: 0, won: 0, lost: 0, tied: 0, noResult: 0, points: 0, runsScored: 0, runsConceded: 0, nrr: 0 };
  }
  for (const f of fixtures) {
    if (f.status !== 'completed' || !f.winnerTeamId) continue;
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
}
interface TournamentActions {
  createTournament(data: { name: string; organizer: string; startDate: string; endDate: string; venue: string; format: TournamentFormat; description: string }): string;
  addTeam(tournamentId: string, team: Omit<TournamentTeam, 'id'>): void;
  removeTeam(tournamentId: string, teamId: string): void;
  generateFixtures(tournamentId: string): void;
  updateFixture(tournamentId: string, fixtureId: string, data: Partial<Fixture>): void;
  deleteTournament(id: string): void;
}

type Store = TournamentState & TournamentActions;

export const useTournamentStore = create<Store>()(
  persist(
    (set, get) => ({
      tournaments: {},

      createTournament(data) {
        const id = generateId();
        const tournament: Tournament = {
          id, ...data,
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
          const newTeam: TournamentTeam = { ...team, id: generateId() };
          return { tournaments: { ...s.tournaments, [tournamentId]: { ...t, teams: [...t.teams, newTeam] } } };
        });
      },

      removeTeam(tournamentId, teamId) {
        set(s => {
          const t = s.tournaments[tournamentId];
          if (!t) return s;
          return { tournaments: { ...s.tournaments, [tournamentId]: { ...t, teams: t.teams.filter(tm => tm.id !== teamId) } } };
        });
      },

      generateFixtures(tournamentId) {
        const t = get().tournaments[tournamentId];
        if (!t || t.teams.length < 2) return;
        const fixtures = t.format === 'knockout' || t.format === 'custom'
          ? generateKnockoutFixtures(tournamentId, t.teams)
          : generateRoundRobinFixtures(tournamentId, t.teams);
        set(s => ({ tournaments: { ...s.tournaments, [tournamentId]: { ...t, fixtures, status: 'ongoing' } } }));
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
    }),
    { name: 'cricket-tournament-v1', storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }) }
  )
);

export default useTournamentStore;
