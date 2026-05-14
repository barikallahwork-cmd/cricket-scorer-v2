'use client';

import { useEffect, useRef } from 'react';
import useMatchStore from '@/store/matchStore';
import useTournamentStore from '@/store/tournamentStore';

export function useTournamentSync() {
  const { matches, activeMatchId } = useMatchStore();
  const { tournaments, updateFixture } = useTournamentStore();
  const syncedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!activeMatchId) return;
    const match = matches[activeMatchId];
    if (!match?.tournamentId || !match?.fixtureId) return;
    if (match.status !== 'finished') return;
    if (syncedRef.current.has(match.fixtureId)) return;

    const tournament = tournaments[match.tournamentId];
    if (!tournament) return;
    const fixture = tournament.fixtures.find(f => f.id === match.fixtureId);
    if (!fixture || fixture.status === 'completed') return;

    const team1 = match.teams[0];
    const team2 = match.teams[1];

    // Resolve winner to tournament team ID
    let winnerTeamId: string | undefined;
    const result = match.result ?? '';
    if (result.toLowerCase().includes('tied') || result.toLowerCase() === 'match tied') {
      winnerTeamId = 'tie';
    } else if (result.includes(' won ')) {
      const winnerName = result.split(' won ')[0];
      if (team1.name === winnerName) winnerTeamId = match.tournamentTeam1Id;
      else if (team2.name === winnerName) winnerTeamId = match.tournamentTeam2Id;
    }

    // Map innings runs to fixture team1/team2
    const inn1 = match.innings[0];
    const inn2 = match.innings[1];
    let team1Runs: number | undefined;
    let team2Runs: number | undefined;
    if (inn1) {
      if (inn1.battingTeamId === team1.id) {
        team1Runs = inn1.runs;
        team2Runs = inn2?.runs;
      } else {
        team2Runs = inn1.runs;
        team1Runs = inn2?.runs;
      }
    }

    updateFixture(match.tournamentId, match.fixtureId, {
      status: 'completed',
      winnerTeamId,
      result,
      team1Runs,
      team2Runs,
      matchCode: match.matchCode,
    });

    syncedRef.current.add(match.fixtureId);
  }, [matches, activeMatchId, tournaments]);
}
