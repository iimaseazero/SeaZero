'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Submission, getLeaderboard } from '@/store/persistence';

function formatM(val: number): string {
  if (Math.abs(val) >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
  return `$${(val / 1_000).toFixed(0)}K`;
}

export default function Leaderboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Reload leaderboard periodically
  useEffect(() => {
    const load = () => setSubmissions(getLeaderboard());
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  if (submissions.length === 0) {
    return (
      <div
        className="text-center py-16 rounded-xl"
        style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
      >
        <div className="flex justify-center mb-4 text-cyan-500 opacity-80">
          <Trophy size={48} />
        </div>
        <p className="text-lg font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          No Submissions Yet
        </p>
        <p className="text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
          Teams can submit their optimized configurations from this page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div
        className="grid items-center px-5 py-2.5 rounded-xl"
        style={{
          gridTemplateColumns: '40px 1fr 100px 100px 100px 100px 90px',
          background: 'var(--glass-strong)',
          border: '1px solid var(--border)',
        }}
      >
        {['Rank', 'Team', 'Score', 'Feasible', 'NPV Gap', 'CO₂ (10yr)', 'Dead Zones'].map((h) => (
          <span key={h} className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Submission rows */}
      <AnimatePresence>
        {submissions.map((sub, rank) => {
          const isTop = rank === 0;
          const isFeasible = sub.simResult.feasible;
          return (
            <motion.div
              key={sub.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rank * 0.05 }}
              className="grid items-center px-5 py-3.5 rounded-xl transition-all"
              style={{
                gridTemplateColumns: '40px 1fr 100px 100px 100px 100px 90px',
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
                </span>
              </div>

              {/* Team */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: sub.teamColor,
                    boxShadow: `0 0 8px ${sub.teamColor}44`,
                  }}
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
            </motion.div>
          );
        })}
      </AnimatePresence>

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
      </div>
    </div>
  );
}
