'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ExternalLink, MonitorPlay,
  BarChart2, AlignLeft, Play, Trophy, Download, QrCode, Copy, Check, X as XIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { exportScorecardPDF } from '@/utils/exportScorecard';
import useMatchStore from '@/store/matchStore';
import { Match } from '@/store/types';
import { getMatchTitle, getTeam, getInnings } from '@/utils/formatting';
import { calcRunRate, calcRequiredRunRate } from '@/utils/calculations';
import MatchSetup from './MatchSetup';
import TossSetup from './TossSetup';
import InningsSetup from './InningsSetup';
import BallControls from './BallControls';
import ScoreCard from './ScoreCard';
import NewBatsmanModal from './NewBatsmanModal';
import NewBowlerModal from './NewBowlerModal';

type Tab = 'score' | 'scorecard' | 'commentary';

export default function ScorerPanel() {
  const router = useRouter();
  const { matches, activeMatchId, endMatch, updateMatchStatus } = useMatchStore();
  const [tab, setTab] = useState<Tab>('score');
  const commentary = useMatchStore(s => s.commentary);

  const match = activeMatchId ? matches[activeMatchId] : null;

  if (!match || match.status === 'setup') {
    return (
      <div className="min-h-screen bg-[#070d1a] p-4">
        <Header />
        <div className="max-w-5xl mx-auto pt-6">
          <MatchSetup onComplete={() => {}} />
        </div>
      </div>
    );
  }

  if (match.status === 'toss') {
    return (
      <div className="min-h-screen bg-[#070d1a] p-4">
        <Header match={match} />
        <div className="max-w-5xl mx-auto pt-6">
          <TossSetup match={match} />
        </div>
      </div>
    );
  }

  if (match.status === 'innings_setup' || match.status === 'innings_break') {
    const isSecond = match.currentInningsIndex === 1;
    if (match.status === 'innings_break') {
      const firstInn = match.innings[0];
      const secondInn = match.innings[1];
      return (
        <div className="min-h-screen bg-[#070d1a] p-4">
          <Header match={match} />
          <div className="max-w-5xl mx-auto pt-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
              <div className="score-card mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Innings Break</h2>
                <p className="text-slate-400 mb-4">
                  {getTeam(match, firstInn.battingTeamId).shortName} scored {firstInn.runs}/{firstInn.wickets}
                </p>
                <div className="bg-orange-600/20 border border-orange-600/40 rounded-xl p-4 mb-4">
                  <div className="text-orange-300 text-sm">Target</div>
                  <div className="text-4xl font-bold text-white">{firstInn.runs + 1}</div>
                  <div className="text-slate-400 text-sm">{getTeam(match, secondInn.battingTeamId).shortName} need {firstInn.runs + 1} in {match.maxOvers} overs</div>
                </div>
                <button
                  onClick={() => updateMatchStatus('innings_setup')}
                  className="btn-primary px-8 py-3 flex items-center gap-2 mx-auto"
                >
                  <Play className="w-5 h-5" /> Start 2nd Innings
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#070d1a] p-4">
        <Header match={match} />
        <div className="max-w-5xl mx-auto pt-6">
          <InningsSetup match={match} isSecondInnings={isSecond} />
        </div>
      </div>
    );
  }

  if (match.status === 'finished') {
    const result = match.result ?? 'Match Finished';
    return (
      <div className="min-h-screen bg-[#070d1a] p-4">
        <Header match={match} />
        <div className="max-w-5xl mx-auto pt-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Match Complete</h2>
            <p className="text-green-400 font-semibold text-lg">{result}</p>
          </div>
          <ScoreCard match={match} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => exportScorecardPDF(match)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 btn-primary py-3"
            >
              Back to Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  const innings = getInnings(match);
  if (!innings) return null;

  return (
    <div className="min-h-screen bg-[#070d1a] flex flex-col">
      <Header match={match} />

      {/* Modals */}
      {match.status === 'awaiting_batsman' && innings.wickets < 10 && (
        <NewBatsmanModal match={match} innings={innings} />
      )}
      {match.status === 'awaiting_bowler' && (
        <NewBowlerModal match={match} innings={innings} />
      )}

      {/* Score Header */}
      <div className="bg-[#0f1928] border-b border-[#1e3a5f]">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <ScoreHeader match={match} innings={innings} />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#0a1422] border-b border-[#1e3a5f] sticky top-14 z-10">
        <div className="max-w-5xl mx-auto px-4 flex">
          {([
            { key: 'score', label: 'Score', icon: Activity },
            { key: 'scorecard', label: 'Scorecard', icon: BarChart2 },
            { key: 'commentary', label: 'Commentary', icon: AlignLeft },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <AnimatePresence mode="wait">
            {tab === 'score' && (
              <motion.div key="score" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BallControls match={match} innings={innings} />
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/display`, '_blank', 'noopener,width=1280,height=720')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors border border-slate-700"
                  >
                    <MonitorPlay className="w-4 h-4 text-blue-400" />
                    Open Display Screen
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('End this match?')) {
                        endMatch();
                        router.push('/');
                      }
                    }}
                    className="flex items-center gap-2 py-2.5 px-4 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm font-medium transition-colors border border-red-800/40"
                  >
                    <Trophy className="w-4 h-4" />
                    End Match
                  </button>
                </div>
              </motion.div>
            )}
            {tab === 'scorecard' && (
              <motion.div key="scorecard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => exportScorecardPDF(match)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
                <ScoreCard match={match} />
              </motion.div>
            )}
            {tab === 'commentary' && (
              <motion.div key="commentary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-2">
                  {commentary.length === 0 && <p className="text-slate-500 text-center py-8">No commentary yet</p>}
                  {commentary.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="score-card text-sm text-slate-300 leading-relaxed"
                    >
                      {c}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Header({ match }: { match?: Match }) {
  const router = useRouter();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const base = typeof window !== 'undefined' ? window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH ?? '') : '';
  const shareUrl = match?.matchCode ? `${base}/watch?code=${match.matchCode}` : '';

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <header className="bg-[#0f1928] border-b border-[#1e3a5f] sticky top-0 z-50 h-14">
      <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ←
          </button>
          <div className="w-7 h-7 rounded bg-green-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">
            {match ? getMatchTitle(match) : 'New Match'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {match && (
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
              LIVE
            </span>
          )}
          {match?.matchCode && (
            <>
              <span className="hidden sm:inline-flex text-xs font-mono bg-green-900/50 border border-green-700/50 text-green-400 px-2 py-0.5 rounded-full">
                {match.matchCode}
              </span>
              <button
                onClick={() => setShowQR(true)}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-green-400 transition-colors"
                title="Share match / QR code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </>
          )}

          {/* QR / Share modal */}
          <AnimatePresence>
            {showQR && match?.matchCode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowQR(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-[#0f1928] border border-[#1e3a5f] rounded-2xl p-6 w-full max-w-sm"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Share Match</h2>
                    <button onClick={() => setShowQR(false)} className="text-slate-400 hover:text-white"><XIcon className="w-5 h-5" /></button>
                  </div>

                  <div className="bg-white rounded-xl p-4 flex justify-center mb-4">
                    <QRCodeSVG value={shareUrl} size={180} />
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Viewer Code</span>
                      <span className="text-green-400 font-mono font-bold">{match.matchCode}</span>
                    </div>
                    <div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Scorer Code</span>
                      <span className="text-blue-400 font-mono font-bold">{match.scorerCode}</span>
                    </div>
                    <div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Admin Code</span>
                      <span className="text-amber-400 font-mono font-bold">{match.adminCode}</span>
                    </div>
                  </div>

                  <button
                    onClick={copyLink}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Viewer Link'}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/display`, '_blank', 'noopener')}
            className="hidden sm:flex p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Open display screen"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function ScoreHeader({ match, innings }: { match: any; innings: any }) {
  const battingTeam = getTeam(match, innings.battingTeamId);
  const isSecond = match.currentInningsIndex === 1;
  const firstInn = match.innings[0];
  const runRate = calcRunRate(innings.runs, innings.overs, innings.balls);
  const rrr = isSecond && innings.targetRuns
    ? calcRequiredRunRate(innings.targetRuns, innings.runs, (match.maxOvers * 6) - innings.legalBalls)
    : null;
  const needed = isSecond && innings.targetRuns ? innings.targetRuns - innings.runs : null;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0">
          <div className="text-xs text-slate-400">{battingTeam.shortName}</div>
          <motion.div
            key={`${innings.runs}-${innings.wickets}`}
            className="text-2xl sm:text-3xl font-black text-white leading-none"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.2 }}
          >
            {innings.runs}/{innings.wickets}
          </motion.div>
          <div className="text-xs text-slate-400">{innings.overs}.{innings.balls} ov</div>
        </div>
        {isSecond && firstInn && (
          <div className="text-xs sm:text-sm text-slate-400 shrink-0">
            vs <span className="text-white font-semibold">{firstInn.runs}/{firstInn.wickets}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm shrink-0">
        {isSecond && needed !== null && (
          <div className="text-center">
            <div className="text-slate-400 text-xs">Need</div>
            <div className="font-bold text-orange-400 text-xs sm:text-sm">{needed}<span className="hidden sm:inline"> off {(match.maxOvers * 6) - innings.legalBalls}b</span></div>
          </div>
        )}
        <div className="text-center">
          <div className="text-slate-400 text-xs">RR</div>
          <div className="font-bold text-white">{runRate.toFixed(2)}</div>
        </div>
        {rrr !== null && (
          <div className="text-center">
            <div className="text-slate-400 text-xs">RRR</div>
            <div className={`font-bold ${rrr > 12 ? 'text-red-400' : rrr > runRate ? 'text-yellow-400' : 'text-green-400'}`}>
              {rrr.toFixed(2)}
            </div>
          </div>
        )}
        {match.innings[1] === undefined && (
          <div className="text-center hidden sm:block">
            <div className="text-slate-400 text-xs">Proj</div>
            <div className="font-bold text-blue-400">
              {innings.legalBalls > 0
                ? Math.round((innings.runs / innings.legalBalls) * (match.maxOvers * 6))
                : '--'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
