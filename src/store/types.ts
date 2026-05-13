export type MatchFormat = 'T20' | 'ODI' | 'Test' | 'Custom';
export type MatchStatus = 'setup' | 'toss' | 'innings_setup' | 'live' | 'awaiting_batsman' | 'awaiting_bowler' | 'innings_break' | 'super_over' | 'finished';
export type WicketType = 'Bowled' | 'Caught' | 'LBW' | 'Run Out' | 'Stumped' | 'Hit Wicket' | 'Obstructing Field' | 'Handled Ball' | 'Timed Out' | 'Retired Hurt' | 'Retired';
export type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty';
export type TossDecision = 'bat' | 'bowl';

export interface Player {
  id: string;
  name: string;
  isCaptain: boolean;
  isWicketKeeper: boolean;
  photo?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo?: string;
  players: Player[];
}

export interface Ball {
  id: string;
  overNumber: number;
  ballInOver: number;
  legalBallNumber: number;
  runs: number;
  extraType?: ExtraType;
  extraRuns: number;
  totalRuns: number;
  isWicket: boolean;
  wicketType?: WicketType;
  batsmanOut?: string;
  fielder?: string;
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;
  isNoBall: boolean;
  isWide: boolean;
  isFreeHit: boolean;
  isDRS: boolean;
  isBoundary: boolean;
  isSix: boolean;
  commentary: string;
  timestamp: number;
  inningsScore: number;
}

export interface BattingScore {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  isRetired: boolean;
  dismissal?: string;
  bowlerId?: string;
  fielderId?: string;
  inAt: number;
}

export interface BowlingFigure {
  playerId: string;
  overs: number;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
}

export interface Partnership {
  batsman1Id: string;
  batsman2Id: string;
  runs: number;
  balls: number;
  startWicket: number;
  isActive: boolean;
}

export interface FallOfWicket {
  wicket: number;
  playerId: string;
  runs: number;
  oversDisplay: string;
}

export interface OverSummary {
  overNumber: number;
  runs: number;
  wickets: number;
  bowlerId: string;
  balls: string[];
  maidenOver: boolean;
}

export interface Extras {
  wide: number;
  noBall: number;
  bye: number;
  legBye: number;
  penalty: number;
}

export interface Innings {
  inningsNumber: number;
  battingTeamId: string;
  bowlingTeamId: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  legalBalls: number;
  extras: Extras;
  battingScores: Record<string, BattingScore>;
  bowlingFigures: Record<string, BowlingFigure>;
  currentBatsmen: [string, string];
  strikerIndex: 0 | 1;
  currentBowler: string;
  lastBowler: string;
  nextBatsmanIndex: number;
  battingOrder: string[];
  ballByBall: Ball[];
  partnerships: Partnership[];
  currentPartnership: Partnership | null;
  fallOfWickets: FallOfWicket[];
  overSummaries: OverSummary[];
  currentOverBalls: Ball[];
  isCompleted: boolean;
  targetRuns: number;
  freeHitNext: boolean;
}

export interface Toss {
  winnerId: string;
  decision: TossDecision;
}

export interface Match {
  id: string;
  status: MatchStatus;
  format: MatchFormat;
  maxOvers: number;
  teams: [Team, Team];
  toss: Toss | null;
  innings: Innings[];
  currentInningsIndex: number;
  venue: string;
  date: string;
  createdAt: number;
  updatedAt: number;
  result?: string;
  isSuperOver: boolean;
  dls?: {
    target: number;
    overs: number;
  };
}
