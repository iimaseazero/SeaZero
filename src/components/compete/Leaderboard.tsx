'use client';

import { motion, AnimatePresence } from 'framer-motion';
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

  if (submissions.length === 0) {
    return (
      <div
        className="text-center py-16 rounded-xl"
        style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
      >
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
          Updates live as teams submit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <AnimatePresence>
        {submissions.map((sub, rank) => {
          const b = asBreakdown(sub.breakdown);
          const isTop = rank === 0;
          const sails = b ? b.baseFeasible : sub.simResult.feasible;
          return (
            <motion.div
              key={sub.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
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
                </span>
              </div>

              {/* Team */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sub.teamColor }}
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
                }}
              >
                <Download size={13} />
                Report
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Pareto frontier */}
      <div className="pt-5 mt-2" style={{ borderTop: '1px solid var(--card-border)' }}>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}
        >
          Cost vs Robustness
        </p>
        <ParetoChart submissions={submissions} />
      </div>

      {/* Scoring guide */}
      <div className="px-4 py-3 rounded-xl mt-4" style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}>
        <p
          className="text-[10px] uppercase tracking-wider font-semibold mb-2"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
        >
          Bid Score
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
          Cost uses your worst price scenario. Climate counts what your ship emits, not what a
          diesel would have.
        </p>
      </div>
    </div>
  );
}
