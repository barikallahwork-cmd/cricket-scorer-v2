import { Match, Innings, Team, Player } from '@/store/types';

export function getTeam(match: Match, teamId: string): Team {
  return match.teams.find(t => t.id === teamId) || match.teams[0];
}

export function getPlayer(match: Match, playerId: string): Player | undefined {
  for (const team of match.teams) {
    const p = team.players.find(p => p.id === playerId);
    if (p) return p;
  }
  return undefined;
}

export function getPlayerName(match: Match, playerId: string): string {
  return getPlayer(match, playerId)?.name ?? 'Unknown';
}

export function getInnings(match: Match): Innings | null {
  if (match.innings.length === 0) return null;
  return match.innings[match.currentInningsIndex] ?? null;
}

export function getStriker(innings: Innings): string {
  return innings.currentBatsmen[innings.strikerIndex];
}

export function getNonStriker(innings: Innings): string {
  return innings.currentBatsmen[innings.strikerIndex === 0 ? 1 : 0];
}

export function formatOvers(overs: number, balls: number): string {
  return `${overs}.${balls}`;
}

export function formatMatchResult(match: Match): string {
  if (match.result) return match.result;
  if (match.status !== 'finished') return '';

  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  if (!inn1 || !inn2) return '';

  const team1 = getTeam(match, inn1.battingTeamId);
  const team2 = getTeam(match, inn2.battingTeamId);

  if (inn2.runs > inn1.runs) {
    const wicketsLeft = 10 - inn2.wickets;
    return `${team2.shortName} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
  } else if (inn1.runs > inn2.runs) {
    const margin = inn1.runs - inn2.runs;
    return `${team1.shortName} won by ${margin} run${margin !== 1 ? 's' : ''}`;
  }
  return 'Match Tied';
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function getMatchTitle(match: Match): string {
  const t1 = match.teams[0]?.shortName ?? 'Team A';
  const t2 = match.teams[1]?.shortName ?? 'Team B';
  return `${t1} vs ${t2}`;
}

export function generateCommentary(params: {
  runs: number;
  extraType?: string;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: string;
  batsmanName: string;
  bowlerName: string;
  fielderName?: string;
  isFreeHit: boolean;
  isDRS: boolean;
  overNumber: number;
  ballInOver: number;
}): string {
  const { runs, extraType, isWicket, wicketType, batsmanName, bowlerName, fielderName, isFreeHit, overNumber, ballInOver } = params;
  const overBall = `${overNumber}.${ballInOver + 1}`;

  if (isWicket) {
    switch (wicketType) {
      case 'Bowled': return `${overBall} - OUT! ${batsmanName} is BOWLED by ${bowlerName}! The stumps are shattered!`;
      case 'Caught': return fielderName
        ? `${overBall} - CAUGHT! ${batsmanName} c ${fielderName} b ${bowlerName}! Superb catch!`
        : `${overBall} - CAUGHT AND BOWLED! What a return catch by ${bowlerName}!`;
      case 'LBW': return `${overBall} - OUT LBW! ${batsmanName} trapped in front by ${bowlerName}! Plumb!`;
      case 'Run Out': return fielderName
        ? `${overBall} - RUN OUT! ${batsmanName} is run out by ${fielderName}! Brilliant fielding!`
        : `${overBall} - RUN OUT! ${batsmanName} is short of the crease!`;
      case 'Stumped': return fielderName
        ? `${overBall} - STUMPED! ${batsmanName} is stumped by ${fielderName} off ${bowlerName}! Way out of the crease!`
        : `${overBall} - STUMPED! ${batsmanName} is out!`;
      case 'Hit Wicket': return `${overBall} - HIT WICKET! ${batsmanName} dislodges the bails himself! Unlucky dismissal!`;
      case 'Retired Hurt': return `${batsmanName} retires hurt.`;
      default: return `${overBall} - OUT! ${batsmanName} is dismissed!`;
    }
  }

  if (extraType === 'wide') return `${overBall} - WIDE ball by ${bowlerName}. 1 extra.`;
  if (extraType === 'noball') {
    const msg = runs > 0 ? ` ${batsmanName} hits for ${runs}!` : '';
    return `${overBall} - NO BALL!${msg} Free hit coming up!`;
  }
  if (extraType === 'bye') return `${overBall} - Bye! ${params.extraRuns} run${params.extraRuns !== 1 ? 's' : ''} to the team.`;
  if (extraType === 'legbye') return `${overBall} - Leg bye! ${params.extraRuns} run${params.extraRuns !== 1 ? 's' : ''} off the pad.`;

  const freeHitNote = isFreeHit ? ' [FREE HIT]' : '';

  if (runs === 0) return `${overBall}${freeHitNote} - Dot ball! Good delivery from ${bowlerName}, ${batsmanName} defends.`;
  if (runs === 4) return `${overBall}${freeHitNote} - FOUR! ${batsmanName} finds the boundary!`;
  if (runs === 6) return `${overBall}${freeHitNote} - SIX! ${batsmanName} sends it over the ropes! Massive hit!`;
  return `${overBall}${freeHitNote} - ${runs} run${runs !== 1 ? 's' : ''}. ${batsmanName} and ${bowlerName} in a battle.`;
}
