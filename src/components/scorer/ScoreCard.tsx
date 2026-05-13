'use client';

import { Match, Innings } from '@/store/types';
import { getTeam, getPlayerName } from '@/utils/formatting';
import { calcStrikeRate, calcEconomy, ballCode, ballColor } from '@/utils/calculations';

interface Props {
  match: Match;
}

function BattingTable({ innings, match }: { innings: Innings; match: Match }) {
  const team = getTeam(match, innings.battingTeamId);
  const scores = Object.values(innings.battingScores).sort((a, b) => a.inAt - b.inAt);
  const extras = innings.extras;
  const totalExtras = extras.wide + extras.noBall + extras.bye + extras.legBye + extras.penalty;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white text-sm uppercase tracking-wide">{team.name} Batting</h3>
        <span className="text-lg font-bold text-white">{innings.runs}/{innings.wickets} ({innings.overs}.{innings.balls})</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 font-medium">Batsman</th>
              <th className="text-center py-2 font-medium w-10">R</th>
              <th className="text-center py-2 font-medium w-10">B</th>
              <th className="text-center py-2 font-medium w-10">4s</th>
              <th className="text-center py-2 font-medium w-10">6s</th>
              <th className="text-right py-2 font-medium w-14">SR</th>
            </tr>
          </thead>
          <tbody>
            {scores.map(s => {
              const name = getPlayerName(match, s.playerId);
              const isIn = innings.currentBatsmen.includes(s.playerId);
              const isStriker = innings.currentBatsmen[innings.strikerIndex] === s.playerId;
              return (
                <tr key={s.playerId} className={`border-b border-slate-800/50 ${isIn ? 'bg-slate-800/20' : ''}`}>
                  <td className="py-2">
                    <div className="font-medium text-white">
                      {isStriker && <span className="text-green-400 mr-1">*</span>}
                      {isIn && !isStriker && <span className="text-slate-400 mr-1 text-xs">†</span>}
                      {name}
                    </div>
                    {s.dismissal && <div className="text-xs text-slate-500">{s.dismissal}</div>}
                    {!s.isOut && isIn && <div className="text-xs text-green-600">not out</div>}
                    {s.isRetired && <div className="text-xs text-yellow-600">retired</div>}
                  </td>
                  <td className="text-center font-bold text-white py-2">{s.runs}</td>
                  <td className="text-center text-slate-300 py-2">{s.balls}</td>
                  <td className="text-center text-blue-400 py-2">{s.fours}</td>
                  <td className="text-center text-purple-400 py-2">{s.sixes}</td>
                  <td className="text-right text-slate-300 py-2">{calcStrikeRate(s.runs, s.balls).toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-600">
              <td colSpan={6} className="py-2 text-sm text-slate-400">
                Extras: <span className="text-white">{totalExtras}</span>
                <span className="text-xs ml-2">(w {extras.wide}, nb {extras.noBall}, b {extras.bye}, lb {extras.legBye}{extras.penalty > 0 ? `, p ${extras.penalty}` : ''})</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Fall of Wickets */}
      {innings.fallOfWickets.length > 0 && (
        <div className="mt-3">
          <span className="text-xs text-slate-500 uppercase tracking-wide">Fall of Wickets: </span>
          <span className="text-xs text-slate-400">
            {innings.fallOfWickets.map(f => `${f.wicket}-${f.runs} (${getPlayerName(match, f.playerId)}, ${f.oversDisplay})`).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}

function BowlingTable({ innings, match }: { innings: Innings; match: Match }) {
  const team = getTeam(match, innings.bowlingTeamId);
  const figures = Object.values(innings.bowlingFigures).sort((a, b) => {
    const ao = a.overs * 6 + a.balls;
    const bo = b.overs * 6 + b.balls;
    return bo - ao;
  });

  return (
    <div className="mb-6">
      <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-3">{team.name} Bowling</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 font-medium">Bowler</th>
              <th className="text-center py-2 font-medium w-12">O</th>
              <th className="text-center py-2 font-medium w-10">M</th>
              <th className="text-center py-2 font-medium w-10">R</th>
              <th className="text-center py-2 font-medium w-10">W</th>
              <th className="text-right py-2 font-medium w-14">Eco</th>
            </tr>
          </thead>
          <tbody>
            {figures.map(f => {
              const isCurrent = f.playerId === innings.currentBowler;
              return (
                <tr key={f.playerId} className={`border-b border-slate-800/50 ${isCurrent ? 'bg-blue-900/20' : ''}`}>
                  <td className="py-2 font-medium text-white">
                    {isCurrent && <span className="text-blue-400 mr-1 text-xs">▶</span>}
                    {getPlayerName(match, f.playerId)}
                  </td>
                  <td className="text-center text-slate-300 py-2">{f.overs}.{f.balls}</td>
                  <td className="text-center text-slate-300 py-2">{f.maidens}</td>
                  <td className="text-center text-slate-300 py-2">{f.runs}</td>
                  <td className="text-center font-bold text-white py-2">{f.wickets}</td>
                  <td className="text-right text-slate-300 py-2">{calcEconomy(f.runs, f.overs, f.balls).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ScoreCard({ match }: Props) {
  return (
    <div className="space-y-0">
      {match.innings.map((inn, i) => (
        <div key={i} className="score-card mb-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">
            Innings {i + 1} {inn.isCompleted && '(Completed)'}
          </div>
          <BattingTable innings={inn} match={match} />
          <BowlingTable innings={inn} match={match} />

          {/* Over by over */}
          {inn.overSummaries.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Over Summary</div>
              <div className="overflow-x-auto">
                <div className="flex gap-2 pb-2">
                  {inn.overSummaries.map(ov => (
                    <div key={ov.overNumber} className={`shrink-0 bg-slate-800 rounded-lg p-2 min-w-[90px] ${ov.maidenOver ? 'border border-green-700/50' : ''}`}>
                      <div className="text-xs text-slate-500 mb-1">Ov {ov.overNumber + 1}</div>
                      <div className="flex gap-1 mb-1">
                        {ov.balls.map((b, i) => {
                          return (
                            <span key={i} className={`ball-chip text-[10px] w-6 h-6 ${ballColor(b)}`}>{b}</span>
                          );
                        })}
                      </div>
                      <div className="text-xs text-slate-400">{ov.runs}R {ov.wickets > 0 ? `${ov.wickets}W` : ''}{ov.maidenOver ? ' M' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
