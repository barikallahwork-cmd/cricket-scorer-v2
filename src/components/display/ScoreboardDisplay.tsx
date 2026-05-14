'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useMatchStore from '@/store/matchStore';
import { useBroadcastReceiver } from '@/hooks/useBroadcastSync';
import { getTeam, getPlayerName, getInnings, getStriker, getNonStriker } from '@/utils/formatting';
import { calcStrikeRate, calcEconomy, calcRunRate, calcRequiredRunRate, ballCode, ballColor, oversDisplay } from '@/utils/calculations';
import { Match, Innings } from '@/store/types';
import { Activity, Maximize2, Minimize2, Tv } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span className="text-red-400 font-bold text-xs uppercase tracking-widest">Live</span>
    </span>
  );
}

function ScoreDisplay({ match, innings }: { match: Match; innings: Innings }) {
  const battingTeam = getTeam(match, innings.battingTeamId);
  const bowlingTeam = getTeam(match, innings.bowlingTeamId);
  const isSecond = match.currentInningsIndex === 1;
  const firstInn = match.innings[0];
  const needed = isSecond && innings.targetRuns ? innings.targetRuns - innings.runs : null;
  const ballsLeft = match.maxOvers * 6 - innings.legalBalls;
  const runRate = calcRunRate(innings.runs, innings.overs, innings.balls);
  const rrr = isSecond && innings.targetRuns
    ? calcRequiredRunRate(innings.targetRuns, innings.runs, ballsLeft)
    : null;

  return (
    <div>
      {/* Main Score */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="text-slate-400 text-base font-medium uppercase tracking-wider mb-1">{battingTeam.name}</div>
          <motion.div
            key={`${innings.runs}-${innings.wickets}`}
            initial={{ scale: 1.15, color: '#22c55e' }}
            animate={{ scale: 1, color: '#ffffff' }}
            transition={{ duration: 0.3 }}
            className="text-7xl sm:text-8xl font-black leading-none text-white tabular-nums"
          >
            {innings.runs}/{innings.wickets}
          </motion.div>
          <div className="text-2xl text-slate-300 font-mono mt-1">
            {oversDisplay(innings.overs, innings.balls)} ov
            <span className="text-slate-500 text-lg ml-2">({match.maxOvers} max)</span>
          </div>
        </div>

        {isSecond && firstInn && (
          <div className="text-right">
            <div className="text-slate-400 text-sm">vs</div>
            <div className="text-4xl font-bold text-slate-300">{firstInn.runs}/{firstInn.wickets}</div>
            <div className="text-slate-500 text-sm">{getTeam(match, firstInn.battingTeamId).shortName}</div>
          </div>
        )}
      </div>

      {/* Target / Match Info */}
      {isSecond && needed !== null && needed > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500/15 border border-orange-500/30 rounded-xl px-4 py-2.5 mb-3"
        >
          <span className="text-orange-300 font-bold text-lg">
            {getTeam(match, innings.battingTeamId).shortName} need <span className="text-2xl">{needed}</span> runs from <span className="text-2xl">{ballsLeft}</span> balls
          </span>
        </motion.div>
      )}
      {isSecond && needed !== null && needed <= 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/15 border border-green-500/30 rounded-xl px-4 py-2.5 mb-3"
        >
          <span className="text-green-300 font-bold text-xl">
            {getTeam(match, innings.battingTeamId).shortName} WON!
          </span>
        </motion.div>
      )}

      {/* Rates */}
      <div className="flex gap-4 text-sm">
        <div className="bg-slate-800/60 rounded-lg px-3 py-1.5">
          <span className="text-slate-400">CRR </span>
          <span className="font-bold text-white text-base">{runRate.toFixed(2)}</span>
        </div>
        {rrr !== null && (
          <div className={`rounded-lg px-3 py-1.5 ${rrr > 12 ? 'bg-red-900/40' : rrr > runRate ? 'bg-yellow-900/40' : 'bg-green-900/40'}`}>
            <span className="text-slate-400">RRR </span>
            <span className={`font-bold text-base ${rrr > 12 ? 'text-red-400' : rrr > runRate ? 'text-yellow-400' : 'text-green-400'}`}>
              {rrr.toFixed(2)}
            </span>
          </div>
        )}
        {innings.currentPartnership && (
          <div className="bg-slate-800/60 rounded-lg px-3 py-1.5">
            <span className="text-slate-400">Partnership </span>
            <span className="font-bold text-white text-base">
              {innings.currentPartnership.runs}({innings.currentPartnership.balls})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function BatsmenPanel({ match, innings }: { match: Match; innings: Innings }) {
  const strikerId = getStriker(innings);
  const nonStrikerId = getNonStriker(innings);

  return (
    <div className="space-y-2">
      {[
        { id: strikerId, isStriker: true },
        { id: nonStrikerId, isStriker: false },
      ].filter(b => b.id).map(({ id, isStriker }) => {
        const score = innings.battingScores[id];
        const sr = calcStrikeRate(score?.runs ?? 0, score?.balls ?? 0);
        return (
          <motion.div
            key={id}
            layout
            className={`rounded-xl px-4 py-3 ${isStriker ? 'bg-green-900/30 border border-green-700/40' : 'bg-slate-800/40'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isStriker && <span className="text-green-400 font-bold text-lg">*</span>}
                <span className="font-bold text-white text-lg">{getPlayerName(match, id)}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white tabular-nums">{score?.runs ?? 0}</span>
                <span className="text-slate-400 text-sm ml-1">({score?.balls ?? 0})</span>
              </div>
            </div>
            <div className="flex gap-4 mt-1 text-sm text-slate-400">
              <span><span className="text-blue-400 font-semibold">{score?.fours ?? 0}</span> ×4</span>
              <span><span className="text-purple-400 font-semibold">{score?.sixes ?? 0}</span> ×6</span>
              <span>SR: <span className="text-white">{sr.toFixed(1)}</span></span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function BowlerPanel({ match, innings }: { match: Match; innings: Innings }) {
  const bf = innings.bowlingFigures[innings.currentBowler];
  if (!bf) return null;
  const eco = calcEconomy(bf.runs, bf.overs, bf.balls);

  return (
    <div className="bg-blue-900/25 border border-blue-700/30 rounded-xl px-4 py-3">
      <div className="text-xs text-blue-400 uppercase tracking-wide mb-1">Bowling</div>
      <div className="flex items-center justify-between">
        <span className="font-bold text-white text-lg">{getPlayerName(match, innings.currentBowler)}</span>
        <span className="font-mono text-white font-bold">{bf.overs}.{bf.balls}-{bf.maidens}-{bf.runs}-{bf.wickets}</span>
      </div>
      <div className="text-sm text-slate-400 mt-1">Eco: <span className="text-white">{eco.toFixed(2)}</span></div>
    </div>
  );
}

function RecentBallsPanel({ innings }: { innings: Innings }) {
  const recent = innings.ballByBall.slice(-12).reverse();
  const currentOver = innings.currentOverBalls;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">This Over</div>
        <div className="flex gap-1.5 flex-wrap">
          {currentOver.map((b, i) => {
            const code = ballCode(b);
            const cls = ballColor(code);
            return (
              <motion.span
                key={b.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`ball-chip ${cls}`}
              >
                {code}
              </motion.span>
            );
          })}
          {currentOver.length === 0 && <span className="text-slate-600 text-sm">—</span>}
        </div>
      </div>

      {innings.overSummaries.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">Last Over</div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {innings.overSummaries[innings.overSummaries.length - 1].balls.map((b, i) => {
                const cls = ballColor(b);
                return <span key={i} className={`ball-chip text-xs ${cls}`}>{b}</span>;
              })}
            </div>
            <span className="text-slate-400 text-sm">
              {innings.overSummaries[innings.overSummaries.length - 1].runs}R
              {innings.overSummaries[innings.overSummaries.length - 1].wickets > 0 &&
                ` ${innings.overSummaries[innings.overSummaries.length - 1].wickets}W`}
              {innings.overSummaries[innings.overSummaries.length - 1].maidenOver && ' M'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function FallOfWicketsPanel({ match, innings }: { match: Match; innings: Innings }) {
  if (innings.fallOfWickets.length === 0) return null;
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">Fall of Wickets</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
        {innings.fallOfWickets.map(f => (
          <span key={f.wicket}>
            <span className="text-white">{f.wicket}-{f.runs}</span> ({getPlayerName(match, f.playerId)}, {f.oversDisplay})
          </span>
        ))}
      </div>
    </div>
  );
}

function CommentaryTicker({ commentary }: { commentary: string[] }) {
  if (commentary.length === 0) return null;
  return (
    <div className="bg-slate-900 border-t border-slate-800 py-2 px-4 overflow-hidden">
      <div className="flex items-center gap-3">
        <span className="text-green-400 font-bold text-xs shrink-0">LIVE</span>
        <div className="overflow-hidden flex-1">
          <motion.div
            key={commentary[0]}
            initial={{ x: '100%' }}
            animate={{ x: '-100%' }}
            transition={{ duration: 20, ease: 'linear' }}
            className="text-slate-300 text-sm whitespace-nowrap"
          >
            {commentary[0]}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ScoreboardDisplay() {
  useBroadcastReceiver();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { matches, activeMatchId, commentary } = useMatchStore();
  const match = activeMatchId ? matches[activeMatchId] : null;

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (!match) {
    return (
      <div className="min-h-screen bg-[#070d1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#0f1928] border-2 border-[#1e3a5f] flex items-center justify-center mx-auto mb-4">
            <Tv className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-400 mb-2">Display Screen</h2>
          <p className="text-slate-600">Waiting for match data from scorer panel...</p>
          <p className="text-slate-700 text-sm mt-2">Open the scorer panel and start a match</p>
        </div>
      </div>
    );
  }

  const innings = getInnings(match);
  const battingTeam = innings ? getTeam(match, innings.battingTeamId) : null;

  if (match.status === 'finished') {
    return (
      <div className="min-h-screen bg-[#070d1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-black text-white mb-2">Match Complete</h2>
          <p className="text-green-400 font-bold text-xl">{match.result || 'Match Finished'}</p>
          <div className="mt-6 space-y-3">
            {match.innings.map((inn, i) => (
              <div key={i} className="bg-[#0f1928] rounded-xl px-6 py-3 inline-block">
                <span className="text-slate-400">{getTeam(match, inn.battingTeamId).shortName} </span>
                <span className="text-2xl font-bold text-white">{inn.runs}/{inn.wickets}</span>
                <span className="text-slate-400"> ({inn.overs}.{inn.balls})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!innings || !battingTeam) {
    return (
      <div className="min-h-screen bg-[#070d1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-slate-400 text-lg">Match setup in progress...</p>
          <p className="text-slate-600 text-sm mt-1">{getTeam(match, match.teams[0].id).shortName} vs {getTeam(match, match.teams[1].id).shortName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070d1a] flex flex-col" style={{ fontFamily: 'Inter, system-ui' }}>
      {/* Top Bar */}
      <div className="bg-[#0f1928] border-b border-[#1e3a5f] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-green-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">
            {match.teams[0].shortName} vs {match.teams[1].shortName}
          </span>
          <span className="text-slate-500 text-sm">{match.format} • {match.maxOvers} ov</span>
          {match.venue && <span className="text-slate-600 text-sm">@ {match.venue}</span>}
        </div>
        <div className="flex items-center gap-3">
          <LiveDot />
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Main Score */}
        <div className="lg:col-span-2 space-y-4">
          <div className="score-card">
            <ScoreDisplay match={match} innings={innings} />
          </div>

          {/* Batsmen */}
          <div className="score-card">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">At the Crease</div>
            <BatsmenPanel match={match} innings={innings} />
          </div>

          {/* Recent balls */}
          <div className="score-card">
            <RecentBallsPanel innings={innings} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Bowler */}
          <div className="score-card">
            <BowlerPanel match={match} innings={innings} />
          </div>

          {/* Extras */}
          <div className="score-card">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Extras</div>
            <div className="grid grid-cols-4 gap-1 text-center text-xs">
              {[
                { label: 'Wd', val: innings.extras.wide },
                { label: 'Nb', val: innings.extras.noBall },
                { label: 'B', val: innings.extras.bye },
                { label: 'Lb', val: innings.extras.legBye },
              ].map(e => (
                <div key={e.label} className="bg-slate-800 rounded p-1.5">
                  <div className="text-slate-400">{e.label}</div>
                  <div className="font-bold text-white">{e.val}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-400 text-center">
              Total: <span className="text-white font-semibold">
                {innings.extras.wide + innings.extras.noBall + innings.extras.bye + innings.extras.legBye + innings.extras.penalty}
              </span>
            </div>
          </div>

          {/* Partnership */}
          {innings.currentPartnership && (
            <div className="score-card">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Current Partnership</div>
              <div className="text-2xl font-bold text-white">
                {innings.currentPartnership.runs}
                <span className="text-base text-slate-400 ml-1">({innings.currentPartnership.balls}b)</span>
              </div>
            </div>
          )}

          {/* Fall of wickets */}
          <div className="score-card">
            <FallOfWicketsPanel match={match} innings={innings} />
            {innings.fallOfWickets.length === 0 && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fall of Wickets</div>
                <p className="text-slate-600 text-sm">No wickets fallen</p>
              </div>
            )}
          </div>

          {/* Over summary */}
          {innings.overSummaries.length > 0 && (
            <div className="score-card">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Over by Over</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {innings.overSummaries.slice().reverse().map(ov => (
                  <div key={ov.overNumber} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 w-8">Ov {ov.overNumber + 1}</span>
                    <div className="flex gap-0.5">
                      {ov.balls.map((b, i) => {
                        const cls = ballColor(b);
                        return <span key={i} className={`ball-chip text-[10px] w-5 h-5 ${cls}`}>{b}</span>;
                      })}
                    </div>
                    <span className="text-slate-400 text-xs w-12 text-right">
                      {ov.runs}R {ov.wickets > 0 ? `${ov.wickets}W` : ''}{ov.maidenOver ? 'M' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Commentary Ticker */}
      <CommentaryTicker commentary={commentary} />

      {/* Match Code + QR Bar */}
      {match.matchCode && (
        <div className="bg-[#0a1220] border-t border-[#1e3a5f] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded p-1">
              <QRCodeSVG
                value={typeof window !== 'undefined' ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/watch?code=${match.matchCode}` : match.matchCode}
                size={36}
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Scan to watch live</p>
              <p className="text-green-400 font-mono font-bold text-sm">{match.matchCode}</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>CricScore Pro</p>
            {match.venue && <p className="text-slate-500">{match.venue}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
