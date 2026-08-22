'use client';

import { motion, AnimatePresence } from 'framer-motion';
<<<<<<< HEAD
import { Trophy, Download, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useLeaderboard } from '@/store/useCollections';
import { downloadTeamReport } from '@/utils/generateTeamReport';
import { ScoreBreakdown } from '@/engine/scoring';
import ParetoChart from '@/components/compete/ParetoChart';
import { formatMoney } from '@/components/charts/chartTheme';

/**
 * Submissions stored before the score rewrite carry the old four-field
 * breakdown. Rather than migrate D1 rows, the board reads defensively and
 * shows an em dash for anything the old shape cannot supply.
 */
function asBreakdown(b: unknown): ScoreBreakdown | null {
  return b && typeof b === 'object' && 'reliability' in b && 'worstCaseTCO' in b
    ? (b as ScoreBreakdown)
    : null;
}

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--chart-good)';
  if (score >= 45) return 'var(--chart-demand)';
  return 'var(--chart-warm)';
}

export default function Leaderboard() {
  const { submissions, lastUpdated } = useLeaderboard();
=======
import { Trophy, Download } from 'lucide-react';
import { useLeaderboard } from '@/store/useCollections';
import { downloadTeamReport } from '@/utils/generateTeamReport';

function formatM(val: number): string {
  if (Math.abs(val) >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
  return `$${(val / 1_000).toFixed(0)}K`;
}

export default function Leaderboard() {
  // Fetches submissions from D1 on mount
  const { submissions } = useLeaderboard();
>>>>>>> origin/master

  if (submissions.length === 0) {
    return (
      <div
        className="text-center py-16 rounded-xl"
        style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
      >
<<<<<<< HEAD
        <div className="flex justify-center mb-4" style={{ color: 'var(--chart-ev)' }}>
          <Trophy size={48} />
        </div>
        <p
          className="text-lg font-semibold mb-1"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          No bids yet
        </p>
        <p className="text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
          The board updates live as teams submit — no reload needed.
=======
        <div className="flex justify-center mb-4 text-cyan-500 opacity-80">
          <Trophy size={48} />
        </div>
        <p className="text-lg font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          No Submissions Yet
        </p>
        <p className="text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
          Teams can submit their optimized configurations from this page
>>>>>>> origin/master
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
<<<<<<< HEAD
      {/* Live indicator */}
      <div className="flex items-center justify-end gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--chart-good)', animation: 'shimmer 1.8s ease-in-out infinite' }}
        />
        <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          live{lastUpdated ? ` · updated ${new Date(lastUpdated).toLocaleTimeString()}` : ''}
        </span>
      </div>

      {/* Header row */}
      <div
        className="leaderboard-row hidden md:grid items-center px-5 py-2.5 rounded-xl"
        style={{ background: 'var(--glass-strong)', border: '1px solid var(--border)' }}
      >
        {['Rank', 'Team', 'Score', 'Stresses', 'Worst TCO', 'CO₂ cut', 'Sails', 'Report'].map((h) => (
          <span
            key={h}
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
          >
=======
      {/* Header row */}
      <div
        className="grid items-center px-5 py-2.5 rounded-xl"
        style={{
          gridTemplateColumns: '40px 1fr 90px 80px 90px 90px 70px 110px',
          background: 'var(--glass-strong)',
          border: '1px solid var(--border)',
        }}
      >
        {['Rank', 'Team', 'Score', 'Feasible', 'NPV Gap', 'CO₂ (10yr)', 'Dead Zones', 'Report'].map((h) => (
          <span key={h} className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
>>>>>>> origin/master
            {h}
          </span>
        ))}
      </div>

<<<<<<< HEAD
      {/* Rows */}
      <AnimatePresence>
        {submissions.map((sub, rank) => {
          const b = asBreakdown(sub.breakdown);
          const isTop = rank === 0;
          const sails = b ? b.baseFeasible : sub.simResult.feasible;
=======
      {/* Submission rows */}
      <AnimatePresence>
        {submissions.map((sub, rank) => {
          const isTop = rank === 0;
          const isFeasible = sub.simResult.feasible;
>>>>>>> origin/master
          return (
            <motion.div
              key={sub.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
<<<<<<< HEAD
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="leaderboard-row grid grid-cols-2 items-center gap-y-2 px-5 py-3.5 rounded-xl transition-all"
              style={{
                background: isTop ? 'rgba(8,145,178,0.05)' : 'var(--glass-strong)',
                border: `1px solid ${isTop ? 'rgba(8,145,178,0.20)' : 'var(--card-border)'}`,
              }}
            >

              {/* Rank */}
              <div className="flex items-center md:justify-center">
                <span
                  className="text-lg font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color:
                      rank === 0 ? '#D4A017'
                        : rank === 1 ? '#9CA3AF'
                          : rank === 2 ? '#B87333'
                            : 'var(--text-muted)',
                  }}
                >
                  {rank + 1}
=======
              transition={{ delay: rank * 0.05 }}
              className="grid items-center px-5 py-3.5 rounded-xl transition-all"
              style={{
                gridTemplateColumns: '40px 1fr 90px 80px 90px 90px 70px 110px',
                background: isTop ? 'rgba(56, 217, 200, 0.04)' : 'var(--glass-strong)',
                border: `1px solid ${isTop ? 'rgba(56, 217, 200, 0.15)' : 'var(--card-border)'}`,
                boxShadow: isTop ? '0 0 20px rgba(56, 217, 200, 0.05)' : 'none',
              }}
            >
              {/* Rank */}
              <div className="flex items-center justify-center">
                <span
                  className="text-lg font-bold"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: rank === 0 ? '#FFD700' : rank === 1 ? '#C0C0C0' : rank === 2 ? '#CD7F32' : 'var(--text-muted)',
                  }}
                >
                  {rank === 0 ? '1' : rank === 1 ? '2' : rank === 2 ? '3' : `${rank + 1}`}
>>>>>>> origin/master
                </span>
              </div>

              {/* Team */}
<<<<<<< HEAD
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sub.teamColor }}
=======
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: sub.teamColor,
                    boxShadow: `0 0 8px ${sub.teamColor}44`,
                  }}
>>>>>>> origin/master
                />
                <span
                  className="text-sm font-semibold truncate"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                >
                  {sub.teamName}
                </span>
              </div>

              {/* Score */}
              <span
                className="text-lg font-bold"
<<<<<<< HEAD
                style={{ fontFamily: 'var(--font-display)', color: scoreColor(sub.score) }}
              >
                {sub.score.toFixed(0)}
                <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}> /100</span>
              </span>

              {/* Stresses survived */}
              <span
                className="text-xs font-bold"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
              >
                {b ? `${b.operationalPassed}/${b.operationalTotal}` : '—'}
              </span>

              {/* Worst-case TCO */}
              <span
                className="text-xs font-bold"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
              >
                {b ? formatMoney(b.worstCaseTCO) : '—'}
              </span>

              {/* CO2 reduction vs do-nothing */}
              <span
                className="text-xs font-bold"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--chart-ev)' }}
              >
                {b ? `${b.co2ReductionPercent.toFixed(0)}%` : '—'}
              </span>

              {/* Base case sails */}
              <span
                className="flex items-center gap-1 text-xs font-semibold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: sails ? 'var(--chart-good)' : 'var(--chart-warm)',
                }}
              >
                {sails ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                {sails ? 'Yes' : 'No'}
              </span>

              {/* Report */}
              <button
                onClick={() => downloadTeamReport(sub)}
                title="Download team report"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all justify-self-start"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--chart-ev)',
                  background: 'rgba(8,145,178,0.10)',
                  border: '1px solid rgba(8,145,178,0.20)',
=======
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: sub.score < 0 ? 'var(--green)' : sub.score < 50 ? 'var(--amber)' : 'var(--red)',
                }}
              >
                {sub.score.toFixed(1)}
              </span>

              {/* Feasible */}
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: isFeasible ? 'var(--green)' : 'var(--red)',
                    boxShadow: `0 0 6px ${isFeasible ? 'rgba(52,211,153,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: isFeasible ? 'var(--green)' : 'var(--red)',
                  }}
                >
                  {isFeasible ? 'Yes' : 'No'}
                </span>
              </div>

              {/* NPV Gap */}
              <span
                className="text-xs font-bold"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: sub.economics.npvGap < 0 ? 'var(--green)' : 'var(--red)',
                }}
              >
                {formatM(sub.economics.npvGap)}
              </span>

              {/* CO2 10yr abated */}
              <span
                className="text-xs font-bold"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}
              >
                {(sub.emissions.co2Abated10yr / 1000).toFixed(1)}kt
              </span>

              {/* Dead zones */}
              <span
                className="text-xs font-bold text-center"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: sub.simResult.deadZoneCount > 0 ? 'var(--red)' : 'var(--green)',
                }}
              >
                {sub.simResult.deadZoneCount}
              </span>

              {/* Download Report Button */}
              <button
                onClick={() => downloadTeamReport(sub)}
                title="Download Team Report"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--cyan)',
                  background: 'var(--cyan-dim)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
>>>>>>> origin/master
                }}
              >
                <Download size={13} />
                Report
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

<<<<<<< HEAD
      {/* Pareto frontier */}
      <div className="pt-5 mt-2" style={{ borderTop: '1px solid var(--card-border)' }}>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}
        >
          The frontier — cost against robustness
        </p>
        <ParetoChart submissions={submissions} />
      </div>

      {/* Scoring guide */}
      <div className="px-4 py-3 rounded-xl mt-4" style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}>
        <p
          className="text-[10px] uppercase tracking-wider font-semibold mb-2"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
        >
          Bid score — 100 points, higher wins
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {[
            { label: 'Reliability', max: 35, desc: 'survives the stress panel', color: 'var(--chart-ev)' },
            { label: 'Cost', max: 35, desc: 'worst-case 10yr TCO', color: 'var(--chart-accent)' },
            { label: 'Climate', max: 20, desc: 'absolute CO₂ cut', color: 'var(--chart-good)' },
            { label: 'Service', max: 10, desc: 'holds the timetable', color: 'var(--chart-demand)' },
          ].map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-1.5 text-[11px]"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
            >
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
              <strong style={{ color: 'var(--text-primary)' }}>{item.label} /{item.max}</strong>
              <span style={{ color: 'var(--text-muted)' }}>{item.desc}</span>
            </span>
          ))}
        </div>
        <p
          className="text-[10px] mt-2.5 leading-relaxed"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
        >
          Cost is scored at your worst price scenario, not your best. Climate counts what your ship
          actually emits, not what a diesel would have — so sailing faster can never earn points.
        </p>
=======
      {/* Scoring guide */}
      <div
        className="px-4 py-3 rounded-xl mt-4"
        style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
      >
        <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
          Scoring Formula (lower = better)
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Feasibility', desc: '-100 if feasible', color: 'var(--green)' },
            { label: 'Dead Zones', desc: '+50 each', color: 'var(--red)' },
            { label: 'NPV Gap', desc: '$1M = 1pt', color: 'var(--amber)' },
            { label: 'CO₂ Abated', desc: '1kt = -1pt', color: 'var(--cyan)' },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <strong style={{ color: item.color }}>{item.label}</strong>: {item.desc}
            </span>
          ))}
        </div>
>>>>>>> origin/master
      </div>
    </div>
  );
}
