export function calcStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return parseFloat(((runs / balls) * 100).toFixed(2));
}

export function calcEconomy(runs: number, overs: number, balls: number): number {
  const totalBalls = overs * 6 + balls;
  if (totalBalls === 0) return 0;
  return parseFloat(((runs / totalBalls) * 6).toFixed(2));
}

export function calcRunRate(runs: number, overs: number, balls: number): number {
  const totalBalls = overs * 6 + balls;
  if (totalBalls === 0) return 0;
  return parseFloat(((runs / totalBalls) * 6).toFixed(2));
}

export function calcRequiredRunRate(target: number, currentRuns: number, ballsRemaining: number): number {
  if (ballsRemaining <= 0) return 0;
  const needed = target - currentRuns;
  if (needed <= 0) return 0;
  return parseFloat(((needed / ballsRemaining) * 6).toFixed(2));
}

export function calcProjectedScore(runs: number, overs: number, balls: number, maxOvers: number): number {
  const totalBalls = overs * 6 + balls;
  const maxBalls = maxOvers * 6;
  if (totalBalls === 0) return 0;
  return Math.round((runs / totalBalls) * maxBalls);
}

export function oversDisplay(overs: number, balls: number): string {
  return `${overs}.${balls}`;
}

export function ballsToOvers(balls: number): string {
  const o = Math.floor(balls / 6);
  const b = balls % 6;
  return `${o}.${b}`;
}

export function calcPartnershipRunRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return parseFloat(((runs / balls) * 6).toFixed(2));
}

export function ballCode(ball: { runs: number; extraType?: string; isWicket: boolean; isFreeHit: boolean; extraRuns: number }): string {
  if (ball.isWicket) return 'W';
  if (ball.extraType === 'wide') return `Wd${ball.extraRuns > 1 ? `+${ball.extraRuns - 1}` : ''}`;
  if (ball.extraType === 'noball') return `Nb${ball.runs > 0 ? `+${ball.runs}` : ''}`;
  if (ball.extraType === 'bye') return `B${ball.extraRuns}`;
  if (ball.extraType === 'legbye') return `Lb${ball.extraRuns}`;
  if (ball.extraType === 'penalty') return `P${ball.extraRuns}`;
  if (ball.runs === 0) return '•';
  return String(ball.runs);
}

export function ballColor(code: string): string {
  if (code === 'W') return 'bg-red-600 text-white';
  if (code === '6') return 'bg-purple-600 text-white';
  if (code === '4') return 'bg-blue-500 text-white';
  if (code.startsWith('Wd') || code.startsWith('Nb')) return 'bg-yellow-600 text-black';
  if (code.startsWith('B') || code.startsWith('Lb')) return 'bg-gray-500 text-white';
  if (code === '•') return 'bg-gray-700 text-gray-300';
  return 'bg-gray-600 text-white';
}

export function buildDismissal(
  wicketType: string,
  bowlerId: string,
  fielderId: string | undefined,
  playerName: (id: string) => string
): string {
  switch (wicketType) {
    case 'Bowled': return `b ${playerName(bowlerId)}`;
    case 'Caught': return fielderId ? `c ${playerName(fielderId)} b ${playerName(bowlerId)}` : `c & b ${playerName(bowlerId)}`;
    case 'LBW': return `lbw b ${playerName(bowlerId)}`;
    case 'Run Out': return fielderId ? `run out (${playerName(fielderId)})` : 'run out';
    case 'Stumped': return fielderId ? `st ${playerName(fielderId)} b ${playerName(bowlerId)}` : `st b ${playerName(bowlerId)}`;
    case 'Hit Wicket': return `hit wkt b ${playerName(bowlerId)}`;
    case 'Obstructing Field': return 'obstructing field';
    case 'Handled Ball': return 'handled ball';
    case 'Timed Out': return 'timed out';
    case 'Retired Hurt': return 'retired hurt';
    case 'Retired': return 'retired';
    default: return wicketType;
  }
}
