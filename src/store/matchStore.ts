'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Match, Team, Innings, Ball, BattingScore, BowlingFigure,
  Partnership, FallOfWicket, OverSummary, Extras, Toss,
  MatchFormat, MatchStatus, WicketType, ExtraType,
} from './types';
import { generateId, generateCommentary, getPlayerName } from '@/utils/formatting';
import { buildDismissal, ballCode } from '@/utils/calculations';

export interface ScoreBallParams {
  runs: number;
  extraType?: ExtraType;
  extraRuns?: number;
  isWicket?: boolean;
  wicketType?: WicketType;
  batsmanOut?: string;
  fielder?: string;
  isDRS?: boolean;
  penaltyTeam?: 'batting' | 'bowling';
}

interface MatchState {
  matches: Record<string, Match>;
  activeMatchId: string | null;
  commentary: string[];
  broadcastVersion: number;
}

interface MatchActions {
  createMatch(config: {
    format: MatchFormat;
    maxOvers: number;
    venue: string;
    date: string;
    team1: Team;
    team2: Team;
  }): string;
  setActiveMatch(id: string): void;
  deleteMatch(id: string): void;

  setToss(winnerId: string, decision: 'bat' | 'bowl'): void;
  startInnings(striker: string, nonStriker: string, bowler: string): void;
  scoreBall(params: ScoreBallParams): void;
  selectNewBatsman(playerId: string): void;
  selectNewBowler(playerId: string): void;
  endMatch(result?: string): void;
  undoLastBall(): void;
  updateMatchStatus(status: MatchStatus): void;
}

type Store = MatchState & MatchActions;

function createEmptyExtras(): Extras {
  return { wide: 0, noBall: 0, bye: 0, legBye: 0, penalty: 0 };
}

function createInnings(inningsNumber: number, battingTeamId: string, bowlingTeamId: string, targetRuns = 0): Innings {
  return {
    inningsNumber,
    battingTeamId,
    bowlingTeamId,
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    legalBalls: 0,
    extras: createEmptyExtras(),
    battingScores: {},
    bowlingFigures: {},
    currentBatsmen: ['', ''],
    strikerIndex: 0,
    currentBowler: '',
    lastBowler: '',
    nextBatsmanIndex: 2,
    battingOrder: [],
    ballByBall: [],
    partnerships: [],
    currentPartnership: null,
    fallOfWickets: [],
    overSummaries: [],
    currentOverBalls: [],
    isCompleted: false,
    targetRuns,
    freeHitNext: false,
  };
}

function createBattingScore(playerId: string, inAt: number): BattingScore {
  return { playerId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isRetired: false, inAt };
}

function createBowlingFigure(playerId: string): BowlingFigure {
  return { playerId, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 };
}

function computeResult(teams: [import('./types').Team, import('./types').Team], currentInningsIndex: number, finalInnings: Innings, firstInnings?: Innings): string {
  if (currentInningsIndex === 1) {
    const targetChased = finalInnings.targetRuns > 0 && finalInnings.runs >= finalInnings.targetRuns;
    if (targetChased) {
      const battingTeam = teams.find(t => t.id === finalInnings.battingTeamId)!;
      const wicketsLeft = 10 - finalInnings.wickets;
      return `${battingTeam.name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
    }
    const bowlingTeam = teams.find(t => t.id === finalInnings.bowlingTeamId)!;
    const margin = (firstInnings?.runs ?? 0) - finalInnings.runs;
    if (margin <= 0) return 'Match Tied';
    return `${bowlingTeam.name} won by ${margin} run${margin !== 1 ? 's' : ''}`;
  }
  return 'Match Complete';
}

let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel('cricket-scorer-v1');
    } catch { return null; }
  }
  return broadcastChannel;
}

function broadcastState(state: MatchState) {
  const ch = getBroadcastChannel();
  if (ch) {
    try {
      ch.postMessage({ type: 'STATE_UPDATE', payload: state, ts: Date.now() });
    } catch {}
  }
}

export const useMatchStore = create<Store>()(
  persist(
    (set, get) => ({
      matches: {},
      activeMatchId: null,
      commentary: [],
      broadcastVersion: 0,

      createMatch({ format, maxOvers, venue, date, team1, team2 }) {
        const id = generateId();
        const matchCode = 'CRK' + Math.floor(10000 + Math.random() * 90000).toString();
        const scorerCode = 'SCR' + Math.floor(1000 + Math.random() * 9000).toString();
        const adminCode = 'ADM' + Math.floor(1000 + Math.random() * 9000).toString();
        const match: Match = {
          id,
          status: 'toss',
          format,
          maxOvers,
          teams: [team1, team2],
          toss: null,
          innings: [],
          currentInningsIndex: 0,
          venue,
          date,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          result: undefined,
          isSuperOver: false,
          matchCode,
          scorerCode,
          adminCode,
        };
        set(s => ({
          matches: { ...s.matches, [id]: match },
          activeMatchId: id,
        }));
        broadcastState(get());
        return id;
      },

      setActiveMatch(id) {
        set({ activeMatchId: id });
        broadcastState(get());
      },

      deleteMatch(id) {
        set(s => {
          const { [id]: _, ...rest } = s.matches;
          return {
            matches: rest,
            activeMatchId: s.activeMatchId === id ? null : s.activeMatchId,
          };
        });
      },

      setToss(winnerId, decision) {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return;
        const match = matches[activeMatchId];

        const toss: Toss = { winnerId, decision };
        const battingFirst = decision === 'bat' ? winnerId : match.teams.find(t => t.id !== winnerId)!.id;
        const bowlingFirst = match.teams.find(t => t.id !== battingFirst)!.id;

        const firstInnings = createInnings(1, battingFirst, bowlingFirst);
        set(s => ({
          matches: {
            ...s.matches,
            [activeMatchId]: {
              ...match,
              toss,
              innings: [firstInnings],
              currentInningsIndex: 0,
              status: 'innings_setup',
              updatedAt: Date.now(),
            },
          },
        }));
        broadcastState(get());
      },

      startInnings(striker, nonStriker, bowler) {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return;
        const match = matches[activeMatchId];
        const inningsIdx = match.currentInningsIndex;
        const innings = { ...match.innings[inningsIdx] };

        innings.currentBatsmen = [striker, nonStriker];
        innings.strikerIndex = 0;
        innings.currentBowler = bowler;
        innings.battingOrder = [striker, nonStriker];
        innings.nextBatsmanIndex = 2;

        innings.battingScores = {
          [striker]: createBattingScore(striker, 1),
          [nonStriker]: createBattingScore(nonStriker, 2),
        };
        innings.bowlingFigures = {
          [bowler]: createBowlingFigure(bowler),
        };
        innings.currentPartnership = {
          batsman1Id: striker,
          batsman2Id: nonStriker,
          runs: 0,
          balls: 0,
          startWicket: 0,
          isActive: true,
        };

        const updatedInnings = [...match.innings];
        updatedInnings[inningsIdx] = innings;

        set(s => ({
          matches: {
            ...s.matches,
            [activeMatchId]: {
              ...match,
              innings: updatedInnings,
              status: 'live',
              updatedAt: Date.now(),
            },
          },
        }));
        broadcastState(get());
      },

      scoreBall(params) {
        const { activeMatchId, matches, commentary } = get();
        if (!activeMatchId) return;
        const match = matches[activeMatchId];
        if (!match || match.status !== 'live') return;

        const inningsIdx = match.currentInningsIndex;
        const innings = JSON.parse(JSON.stringify(match.innings[inningsIdx])) as Innings;

        const {
          runs,
          extraType,
          extraRuns: rawExtraRuns = 0,
          isWicket = false,
          wicketType,
          batsmanOut,
          fielder,
          isDRS = false,
        } = params;

        const isWide = extraType === 'wide';
        const isNoBall = extraType === 'noball';
        const isBye = extraType === 'bye';
        const isLegBye = extraType === 'legbye';
        const isPenalty = extraType === 'penalty';

        const extraRuns = rawExtraRuns > 0 ? rawExtraRuns : (isWide || isNoBall) ? 1 : 0;
        const countsBall = !isWide && !isNoBall;
        const runsToBatsman = (isBye || isLegBye || isWide) ? 0 : (isPenalty ? 0 : runs);
        const extraRunsTotal = isWide ? extraRuns + runs : isNoBall ? extraRuns + runs : isBye || isLegBye ? runs : isPenalty ? extraRuns : 0;
        const totalRuns = runsToBatsman + extraRunsTotal;

        const striker = innings.currentBatsmen[innings.strikerIndex];
        const nonStriker = innings.currentBatsmen[innings.strikerIndex === 0 ? 1 : 0];

        const playerName = (id: string) => getPlayerName(match, id);

        const commentary_text = generateCommentary({
          runs,
          extraType,
          extraRuns: extraRunsTotal,
          isWicket,
          wicketType,
          batsmanName: playerName(striker),
          bowlerName: playerName(innings.currentBowler),
          fielderName: fielder ? playerName(fielder) : undefined,
          isFreeHit: innings.freeHitNext,
          isDRS,
          overNumber: innings.overs,
          ballInOver: innings.balls,
        });

        const ball: Ball = {
          id: generateId(),
          overNumber: innings.overs,
          ballInOver: innings.balls,
          legalBallNumber: innings.legalBalls,
          runs: runsToBatsman,
          extraType,
          extraRuns: extraRunsTotal,
          totalRuns,
          isWicket,
          wicketType,
          batsmanOut,
          fielder,
          bowlerId: innings.currentBowler,
          strikerId: striker,
          nonStrikerId: nonStriker,
          isNoBall,
          isWide,
          isFreeHit: innings.freeHitNext,
          isDRS,
          isBoundary: runsToBatsman === 4,
          isSix: runsToBatsman === 6,
          commentary: commentary_text,
          timestamp: Date.now(),
          inningsScore: innings.runs + totalRuns,
        };

        innings.ballByBall.push(ball);
        innings.currentOverBalls.push(ball);

        innings.runs += totalRuns;
        if (isWide) innings.extras.wide += extraRunsTotal;
        else if (isNoBall) { innings.extras.noBall += extraRuns; }
        else if (isBye) innings.extras.bye += runs;
        else if (isLegBye) innings.extras.legBye += runs;
        else if (isPenalty) innings.extras.penalty += extraRuns;

        if (!innings.battingScores[striker]) {
          innings.battingScores[striker] = createBattingScore(striker, innings.nextBatsmanIndex++);
        }
        if (countsBall && !isWide) {
          innings.battingScores[striker].balls++;
        }
        if (runsToBatsman > 0) {
          innings.battingScores[striker].runs += runsToBatsman;
          if (runsToBatsman === 4) innings.battingScores[striker].fours++;
          if (runsToBatsman === 6) innings.battingScores[striker].sixes++;
        }

        if (!innings.bowlingFigures[innings.currentBowler]) {
          innings.bowlingFigures[innings.currentBowler] = createBowlingFigure(innings.currentBowler);
        }
        const bf = innings.bowlingFigures[innings.currentBowler];
        if (isWide) { bf.wides++; bf.runs += extraRunsTotal; }
        else if (isNoBall) { bf.noBalls++; bf.runs += extraRuns + runs; }
        else if (isBye || isLegBye) { bf.runs += 0; if (countsBall) bf.balls++; }
        else { bf.runs += runs; if (countsBall) bf.balls++; }

        if (innings.currentPartnership) {
          innings.currentPartnership.runs += totalRuns;
          if (countsBall) innings.currentPartnership.balls++;
        }

        const actuallyOut = isWicket && (!innings.freeHitNext || wicketType === 'Run Out');
        if (actuallyOut && batsmanOut) {
          innings.wickets++;
          if (!innings.battingScores[batsmanOut]) {
            innings.battingScores[batsmanOut] = createBattingScore(batsmanOut, innings.nextBatsmanIndex++);
          }
          innings.battingScores[batsmanOut].isOut = true;
          innings.battingScores[batsmanOut].bowlerId = innings.currentBowler;
          innings.battingScores[batsmanOut].fielderId = fielder;
          innings.battingScores[batsmanOut].dismissal = buildDismissal(
            wicketType || 'Bowled',
            innings.currentBowler,
            fielder,
            playerName
          );

          if (!['wide', 'noball'].includes(extraType || '') && wicketType !== 'Run Out') {
            bf.wickets++;
          }

          innings.fallOfWickets.push({
            wicket: innings.wickets,
            playerId: batsmanOut,
            runs: innings.runs,
            oversDisplay: `${innings.overs}.${innings.balls}`,
          } as FallOfWicket);

          if (innings.currentPartnership) {
            innings.partnerships.push({ ...innings.currentPartnership, isActive: false });
            innings.currentPartnership = null;
          }

          const outIdx = innings.currentBatsmen.indexOf(batsmanOut);
          if (outIdx >= 0) {
            (innings.currentBatsmen as string[])[outIdx] = '';
          }
        }

        if (countsBall) {
          innings.legalBalls++;
          innings.balls++;

          if (innings.balls === 6) {
            const overRuns = innings.currentOverBalls.reduce((s, b) => s + b.totalRuns, 0);
            const isMaiden = overRuns === 0 && !innings.currentOverBalls.some(b => b.isWicket);
            const overSummary: OverSummary = {
              overNumber: innings.overs,
              runs: overRuns,
              wickets: innings.currentOverBalls.filter(b => b.isWicket).length,
              bowlerId: innings.currentBowler,
              balls: innings.currentOverBalls.map(b => ballCode(b)),
              maidenOver: isMaiden,
            };
            innings.overSummaries.push(overSummary);

            if (isMaiden) bf.maidens++;
            bf.overs++;
            bf.balls = 0;

            innings.overs++;
            innings.balls = 0;
            innings.currentOverBalls = [];
            innings.lastBowler = innings.currentBowler;

            if (!actuallyOut) {
              innings.strikerIndex = innings.strikerIndex === 0 ? 1 : 0;
            }

            const overTargetChased = match.currentInningsIndex === 1 && innings.targetRuns > 0 && innings.runs >= innings.targetRuns;
            if (overTargetChased) {
              innings.isCompleted = true;
              const result = computeResult(match.teams, match.currentInningsIndex, innings, match.innings[0]);
              set(s => ({
                matches: {
                  ...s.matches,
                  [activeMatchId]: {
                    ...match,
                    innings: match.innings.map((inn, i) => i === inningsIdx ? innings : inn),
                    status: 'finished',
                    result,
                    updatedAt: Date.now(),
                  },
                },
                commentary: [commentary_text, ...commentary.slice(0, 49)],
                broadcastVersion: s.broadcastVersion + 1,
              }));
              broadcastState(get());
              return;
            }

            const newStatus: MatchStatus = actuallyOut ? 'awaiting_batsman' : 'awaiting_bowler';
            set(s => ({
              matches: {
                ...s.matches,
                [activeMatchId]: {
                  ...match,
                  innings: match.innings.map((inn, i) => i === inningsIdx ? innings : inn),
                  status: newStatus,
                  updatedAt: Date.now(),
                },
              },
              commentary: [commentary_text, ...commentary.slice(0, 49)],
              broadcastVersion: s.broadcastVersion + 1,
            }));
            broadcastState(get());
            return;
          }
        }

        const oddTotalRuns = totalRuns % 2 !== 0;
        if (oddTotalRuns && !actuallyOut) {
          innings.strikerIndex = innings.strikerIndex === 0 ? 1 : 0;
        }

        if (actuallyOut && innings.currentPartnership === null) {
          const remaining = innings.currentBatsmen.filter(Boolean);
          const allOut = innings.wickets >= 10;

          innings.currentPartnership = remaining.length >= 2 ? {
            batsman1Id: remaining[0],
            batsman2Id: remaining[1],
            runs: 0,
            balls: 0,
            startWicket: innings.wickets,
            isActive: true,
          } : null;

          if (allOut) {
            innings.isCompleted = true;
            innings.freeHitNext = false;
          }
        }

        innings.freeHitNext = isNoBall;

        const maxBalls = match.maxOvers * 6;
        const targetChased = match.currentInningsIndex === 1 && innings.targetRuns > 0 && innings.runs >= innings.targetRuns;
        const inningsOver = innings.legalBalls >= maxBalls || innings.wickets >= 10 || targetChased;

        if (inningsOver) {
          innings.isCompleted = true;
          const isLastInnings = match.currentInningsIndex >= 1;

          if (isLastInnings) {
            const result = computeResult(match.teams, match.currentInningsIndex, innings, match.innings[0]);
            const updatedInnings = match.innings.map((inn, i) => i === inningsIdx ? innings : inn);
            set(s => ({
              matches: {
                ...s.matches,
                [activeMatchId]: {
                  ...match,
                  innings: updatedInnings,
                  status: 'finished',
                  result,
                  updatedAt: Date.now(),
                },
              },
              commentary: [commentary_text, ...commentary.slice(0, 49)],
              broadcastVersion: s.broadcastVersion + 1,
            }));
          } else {
            const target = innings.runs + 1;
            const battingTeam2 = innings.bowlingTeamId;
            const bowlingTeam2 = innings.battingTeamId;
            const secondInnings = createInnings(2, battingTeam2, bowlingTeam2, target);
            const updatedInnings = [...match.innings.map((inn, i) => i === inningsIdx ? innings : inn), secondInnings];
            set(s => ({
              matches: {
                ...s.matches,
                [activeMatchId]: {
                  ...match,
                  innings: updatedInnings,
                  currentInningsIndex: 1,
                  status: 'innings_break',
                  updatedAt: Date.now(),
                },
              },
              commentary: [commentary_text, ...commentary.slice(0, 49)],
              broadcastVersion: s.broadcastVersion + 1,
            }));
          }
          broadcastState(get());
          return;
        }

        const newStatus: MatchStatus = actuallyOut ? 'awaiting_batsman' : 'live';
        const updatedInnings = match.innings.map((inn, i) => i === inningsIdx ? innings : inn);

        set(s => ({
          matches: {
            ...s.matches,
            [activeMatchId]: {
              ...match,
              innings: updatedInnings,
              status: newStatus,
              updatedAt: Date.now(),
            },
          },
          commentary: [commentary_text, ...commentary.slice(0, 49)],
          broadcastVersion: s.broadcastVersion + 1,
        }));
        broadcastState(get());
      },

      selectNewBatsman(playerId) {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return;
        const match = matches[activeMatchId];
        const inningsIdx = match.currentInningsIndex;
        const innings = JSON.parse(JSON.stringify(match.innings[inningsIdx])) as Innings;

        const emptyIdx = innings.currentBatsmen.findIndex(b => !b);
        if (emptyIdx === -1) return;

        (innings.currentBatsmen as string[])[emptyIdx] = playerId;
        if (!innings.battingScores[playerId]) {
          innings.battingScores[playerId] = createBattingScore(playerId, innings.nextBatsmanIndex);
          innings.nextBatsmanIndex++;
        }
        if (!innings.battingOrder.includes(playerId)) {
          innings.battingOrder.push(playerId);
        }

        innings.currentPartnership = {
          batsman1Id: innings.currentBatsmen[0],
          batsman2Id: innings.currentBatsmen[1],
          runs: 0,
          balls: 0,
          startWicket: innings.wickets,
          isActive: true,
        };

        const updatedInnings = match.innings.map((inn, i) => i === inningsIdx ? innings : inn);
        set(s => ({
          matches: {
            ...s.matches,
            [activeMatchId]: {
              ...match,
              innings: updatedInnings,
              status: match.status === 'awaiting_batsman' ? 'live' : match.status,
              updatedAt: Date.now(),
            },
          },
        }));
        broadcastState(get());
      },

      selectNewBowler(playerId) {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return;
        const match = matches[activeMatchId];
        const inningsIdx = match.currentInningsIndex;
        const innings = JSON.parse(JSON.stringify(match.innings[inningsIdx])) as Innings;

        innings.currentBowler = playerId;
        if (!innings.bowlingFigures[playerId]) {
          innings.bowlingFigures[playerId] = createBowlingFigure(playerId);
        }

        const updatedInnings = match.innings.map((inn, i) => i === inningsIdx ? innings : inn);
        set(s => ({
          matches: {
            ...s.matches,
            [activeMatchId]: {
              ...match,
              innings: updatedInnings,
              status: 'live',
              updatedAt: Date.now(),
            },
          },
        }));
        broadcastState(get());
      },

      endMatch(result) {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return;
        const match = matches[activeMatchId];
        set(s => ({
          matches: {
            ...s.matches,
            [activeMatchId]: {
              ...match,
              status: 'finished',
              result: result ?? match.result,
              updatedAt: Date.now(),
            },
          },
        }));
        broadcastState(get());
      },

      undoLastBall() {
        const { activeMatchId, matches, commentary } = get();
        if (!activeMatchId) return;
        const match = matches[activeMatchId];
        const inningsIdx = match.currentInningsIndex;
        const innings = JSON.parse(JSON.stringify(match.innings[inningsIdx])) as Innings;
        if (innings.ballByBall.length === 0) return;

        const lastBall = innings.ballByBall.pop()!;
        innings.runs -= lastBall.totalRuns;

        if (lastBall.extraType === 'wide') innings.extras.wide -= lastBall.extraRuns;
        else if (lastBall.extraType === 'noball') innings.extras.noBall -= 1;
        else if (lastBall.extraType === 'bye') innings.extras.bye -= lastBall.extraRuns;
        else if (lastBall.extraType === 'legbye') innings.extras.legBye -= lastBall.extraRuns;

        if (!lastBall.isWide && !lastBall.isNoBall) {
          if (innings.balls === 0 && innings.overs > 0) {
            innings.overs--;
            innings.balls = 5;
            if (innings.overSummaries.length > 0) innings.overSummaries.pop();
          } else if (innings.balls > 0) {
            innings.balls--;
          }
          innings.legalBalls--;
        }

        if (innings.battingScores[lastBall.strikerId]) {
          innings.battingScores[lastBall.strikerId].runs -= lastBall.runs;
          if (!lastBall.isWide) innings.battingScores[lastBall.strikerId].balls--;
          if (lastBall.isBoundary) innings.battingScores[lastBall.strikerId].fours--;
          if (lastBall.isSix) innings.battingScores[lastBall.strikerId].sixes--;
        }

        if (innings.bowlingFigures[lastBall.bowlerId]) {
          const bf = innings.bowlingFigures[lastBall.bowlerId];
          if (!lastBall.isWide && !lastBall.isNoBall) bf.balls--;
          bf.runs -= lastBall.totalRuns - (lastBall.extraType === 'bye' || lastBall.extraType === 'legbye' ? lastBall.extraRuns : 0);
          if (lastBall.isWide) bf.wides--;
          if (lastBall.isNoBall) bf.noBalls--;
        }

        if (lastBall.isWicket && lastBall.batsmanOut) {
          innings.wickets--;
          if (innings.battingScores[lastBall.batsmanOut]) {
            innings.battingScores[lastBall.batsmanOut].isOut = false;
            innings.battingScores[lastBall.batsmanOut].dismissal = undefined;
          }
          if (innings.fallOfWickets.length > 0) innings.fallOfWickets.pop();
          const outIdx = innings.currentBatsmen.indexOf('');
          if (outIdx >= 0) {
            (innings.currentBatsmen as string[])[outIdx] = lastBall.batsmanOut;
          }
        }

        innings.freeHitNext = false;
        innings.currentOverBalls = innings.ballByBall.filter(
          b => b.overNumber === innings.overs
        );

        const updatedInnings = match.innings.map((inn, i) => i === inningsIdx ? innings : inn);
        set(s => ({
          matches: {
            ...s.matches,
            [activeMatchId]: {
              ...match,
              innings: updatedInnings,
              status: 'live',
              updatedAt: Date.now(),
            },
          },
          commentary: commentary.slice(1),
          broadcastVersion: s.broadcastVersion + 1,
        }));
        broadcastState(get());
      },

      updateMatchStatus(status) {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return;
        set(s => ({
          matches: {
            ...s.matches,
            [activeMatchId]: { ...matches[activeMatchId], status, updatedAt: Date.now() },
          },
        }));
        broadcastState(get());
      },
    }),
    {
      name: 'cricket-scorer-v2',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
        return localStorage;
      }),
    }
  )
);

export default useMatchStore;
