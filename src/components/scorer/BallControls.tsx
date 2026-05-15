'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, AlertTriangle, Zap } from 'lucide-react';
import { Match, Innings } from '@/store/types';
import { getPlayerName, getStriker, getNonStriker } from '@/utils/formatting';
import { calcStrikeRate, calcEconomy, calcRequiredRunRate, calcRunRate, oversDisplay, ballCode, ballColor } from '@/utils/calculations';
import useMatchStore, { ScoreBallParams } from '@/store/matchStore';
import WicketModal from './WicketModal';

interface Props {
  match: Match;
  innings: Innings;
}

const RUN_BUTTONS = [0, 1, 2, 3, 4, 5, 6];

export default function BallControls({ match, innings }: Props) {
  const { scoreBall, undoLastBall } = useMatchStore();
  const [pendingRuns, setPendingRuns] = useState<number | null>(null);
  const [showWicket, setShowWicket] = useState(false);
  const [pendingExtraType, setPendingExtraType] = useState<string | null>(null);
  const [extraRunMode, setExtraRunMode] = useState(false);

  const strikerName = getPlayerName(match, getStriker(innings));
  const nonStrikerName = getPlayerName(match, getNonStriker(innings));
  const bowlerName = getPlayerName(match, innings.currentBowler);

  const strikerScore = innings.battingScores[getStriker(innings)];
  const nonStrikerScore = innings.battingScores[getNonStriker(innings)];
  const bowlerFigures = innings.bowlingFigures[innings.currentBowler];

  const isSecond = match.currentInningsIndex === 1;
  const runRate = calcRunRate(innings.runs, innings.overs, innings.balls);
  const rrr = isSecond && innings.targetRuns
    ? calcRequiredRunRate(innings.targetRuns, innings.runs, (match.maxOvers * 6) - innings.legalBalls)
    : null;

  function handleRun(runs: number) {
    if (pendingExtraType) {
      if (pendingExtraType === 'wicket') {
        setPendingRuns(runs);
        setShowWicket(true);
        setPendingExtraType(null);
      } else {
        scoreBall({ runs, extraType: pendingExtraType as any, extraRuns: 1 });
        setPendingExtraType(null);
      }
    } else {
      scoreBall({ runs });
    }
    setExtraRunMode(false);
  }

  function handleWicketBtn() {
    setShowWicket(true);
    setPendingRuns(0);
  }

  function handleExtraRuns(type: string) {
    setPendingExtraType(type);
    setExtraRunMode(true);
  }

  function handleWicketConfirm(params: ScoreBallParams) {
    scoreBall({ ...params, runs: params.runs ?? pendingRuns ?? 0 });
    setShowWicket(false);
    setPendingRuns(null);
    setPendingExtraType(null);
  }

  function cancelExtra() {
    setPendingExtraType(null);
    setExtraRunMode(false);
  }

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key >= '0' && e.key <= '6') handleRun(parseInt(e.key));
    if (e.key === 'w' || e.key === 'W') handleWicketBtn();
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undoLastBall(); }
  }, [innings]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const overBalls = innings.currentOverBalls;
  const lastBalls = innings.ballByBall.slice(-10);

  return (
    <div className="space-y-4">
      {/* Free Hit Banner */}
      <AnimatePresence>
        {innings.freeHitNext && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-3 flex items-center gap-2"
          >
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-300 font-bold">FREE HIT — Batsman cannot be bowled/caught out</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extra mode indicator */}
      <AnimatePresence>
        {extraRunMode && pendingExtraType && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-yellow-700/30 border border-yellow-600/40 rounded-xl p-3 flex items-center justify-between"
          >
            <span className="text-yellow-300 font-semibold capitalize">
              {pendingExtraType === 'noball' ? 'No Ball' : pendingExtraType} — Select runs off bat
            </span>
            <button onClick={cancelExtra} className="text-slate-400 hover:text-white text-sm">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Players Info */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Batsmen */}
        <div className="score-card">
          <div className="space-y-2">
            {[
              { id: getStriker(innings), score: strikerScore, isStriker: true },
              { id: getNonStriker(innings), score: nonStrikerScore, isStriker: false },
            ].map(({ id, score, isStriker }) => (
              <div key={id} className={`p-2 rounded-lg ${isStriker ? 'bg-green-900/30 border border-green-700/40' : 'bg-slate-800/40'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[90px] sm:max-w-[120px]">
                    {isStriker && <span className="text-green-400 mr-1">*</span>}
                    {getPlayerName(match, id)}
                  </span>
                  <span className="font-mono text-white font-bold">
                    {score?.runs ?? 0}({score?.balls ?? 0})
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                  <span>{score?.fours ?? 0}×4</span>
                  <span>{score?.sixes ?? 0}×6</span>
                  <span>SR: {calcStrikeRate(score?.runs ?? 0, score?.balls ?? 0).toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bowler + Rates */}
        <div className="score-card space-y-2">
          <div className="p-2 rounded-lg bg-blue-900/30 border border-blue-700/40">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white truncate max-w-[120px]">{bowlerName}</span>
              <span className="font-mono text-white font-bold text-sm">
                {bowlerFigures ? `${bowlerFigures.overs}.${bowlerFigures.balls}` : '0.0'}
              </span>
            </div>
            <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
              <span>{bowlerFigures?.wickets ?? 0}W</span>
              <span>{bowlerFigures?.runs ?? 0}R</span>
              <span>Eco: {calcEconomy(bowlerFigures?.runs ?? 0, bowlerFigures?.overs ?? 0, bowlerFigures?.balls ?? 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-slate-400">RR</div>
              <div className="text-white font-bold">{runRate.toFixed(2)}</div>
            </div>
            {rrr !== null ? (
              <div className={`rounded-lg p-2 text-center ${rrr > runRate + 2 ? 'bg-red-900/30' : rrr > runRate ? 'bg-yellow-900/30' : 'bg-green-900/30'}`}>
                <div className="text-slate-400">RRR</div>
                <div className="font-bold text-white">{rrr.toFixed(2)}</div>
              </div>
            ) : (
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-slate-400">Over</div>
                <div className="text-white font-bold">{oversDisplay(innings.overs, innings.balls)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Over Balls */}
      <div className="score-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">This Over</span>
          <span className="text-xs text-slate-500">Over {innings.overs + 1}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap min-h-[2rem]">
          {overBalls.map((b, i) => {
            const code = ballCode(b);
            const colorClass = ballColor(code);
            return (
              <span key={i} className={`ball-chip text-xs ${colorClass}`}>{code}</span>
            );
          })}
          {overBalls.length === 0 && <span className="text-slate-600 text-sm">No balls bowled yet</span>}
        </div>
      </div>

      {/* Run Buttons */}
      <div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {RUN_BUTTONS.map(r => (
            <motion.button
              key={r}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleRun(r)}
              className={`btn-run h-12 sm:h-16 text-xl sm:text-2xl font-bold flex items-center justify-center
                ${r === 4 ? 'bg-blue-700 hover:bg-blue-600' :
                  r === 6 ? 'bg-purple-700 hover:bg-purple-600' :
                  r === 0 ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' :
                  'bg-slate-700 hover:bg-slate-600'}`}
            >
              {r === 0 ? '•' : r}
            </motion.button>
          ))}
        </div>
        <div className="hidden sm:block text-center text-xs text-slate-600 mt-1">Keyboard: 0-6 = runs, W = wicket, Ctrl+Z = undo</div>
      </div>

      {/* Wicket Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleWicketBtn}
        className="w-full btn-wicket h-14 flex items-center justify-center gap-2 text-xl"
      >
        <AlertTriangle className="w-5 h-5" />
        WICKET
      </motion.button>

      {/* Extras Row */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {[
          { label: 'Wide', type: 'wide', short: 'Wd' },
          { label: 'No Ball', type: 'noball', short: 'Nb' },
          { label: 'Bye', type: 'bye', short: 'B' },
          { label: 'Leg Bye', type: 'legbye', short: 'Lb' },
        ].map(e => (
          <motion.button
            key={e.type}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExtraRuns(e.type)}
            className={`btn-extra py-2.5 sm:py-3 flex flex-col items-center gap-0.5 ${
              pendingExtraType === e.type ? 'ring-2 ring-yellow-400' : ''
            }`}
          >
            <span className="font-bold text-sm sm:text-base">{e.short}</span>
            <span className="text-xs opacity-75 hidden sm:block">{e.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Undo */}
      <button
        onClick={undoLastBall}
        disabled={innings.ballByBall.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Undo2 className="w-4 h-4" />
        Undo Last Ball
      </button>

      {showWicket && (
        <WicketModal
          match={match}
          innings={innings}
          runs={pendingRuns ?? 0}
          extraType={pendingExtraType ?? undefined}
          onConfirm={handleWicketConfirm}
          onClose={() => { setShowWicket(false); setPendingRuns(null); }}
        />
      )}
    </div>
  );
}
