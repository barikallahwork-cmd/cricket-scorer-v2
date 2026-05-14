export type TournamentFormat = 'league' | 'knockout' | 'round_robin' | 'league_knockout' | 'custom';
export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';
export type FixtureStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface TournamentTeam {
  id: string;
  name: string;
  shortName: string;
  color: string;
  captainName: string;
}

export interface Fixture {
  id: string;
  tournamentId: string;
  team1Id: string;
  team2Id: string;
  date: string;
  time: string;
  ground: string;
  stage: string;
  matchCode?: string;
  result?: string;
  status: FixtureStatus;
  winnerTeamId?: string;
  team1Runs?: number;
  team1Wickets?: number;
  team1Overs?: string;
  team2Runs?: number;
  team2Wickets?: number;
  team2Overs?: string;
}

export interface PointsEntry {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsScored: number;
  runsConceded: number;
  nrr: number;
}

export interface Tournament {
  id: string;
  name: string;
  organizer: string;
  startDate: string;
  endDate: string;
  venue: string;
  format: TournamentFormat;
  teams: TournamentTeam[];
  fixtures: Fixture[];
  pointsTable: PointsEntry[];
  description: string;
  status: TournamentStatus;
  createdAt: number;
}
