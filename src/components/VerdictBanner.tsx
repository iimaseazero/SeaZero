'use client';

import { useSimStore } from '@/store/useSimStore';
import { motion } from 'framer-motion';

export default function VerdictBanner() {
  const { simResult, config } = useSimStore();

  if (config.vesselType === 'ice') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex items-center gap-3 px-5 py-3 rounded-xl"
        style={{
          background: 'var(--steel-surface)',
          border: '1px solid rgba(74, 144, 204, 0.15)',
        }}
      >
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--steel)' }} />
        <span className="text-sm font-semibold tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--steel)' }}>
          ICE Benchmark Mode
        </span>
        <span className="text-xs ml-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
          Conventional diesel vessel — comparison baseline
        </span>
      </motion.div>
    );
  }

  const feasible = simResult.feasible;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      key={feasible ? 'feasible' : 'infeasible'}
      className="w-full flex items-center gap-3 px-5 py-3 rounded-xl"
      style={{
        background: feasible ? 'var(--cyan-glow)' : 'var(--red-dim)',
        border: `1px solid ${feasible ? 'rgba(56, 217, 200, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: feasible ? 'var(--cyan)' : 'var(--red)' }}
      />
      <span
        className="text-sm font-semibold tracking-wide uppercase"
        style={{
          fontFamily: 'var(--font-display)',
          color: feasible ? 'var(--cyan)' : 'var(--red)',
        }}
      >
        {feasible ? 'Voyage Feasible' : 'Voyage Infeasible'}
      </span>
      <span className="w-px h-4 flex-shrink-0" style={{ background: feasible ? 'rgba(56,217,200,0.2)' : 'rgba(239,68,68,0.2)' }} />
      <span
        className="text-xs flex-1"
        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
      >
        {feasible
          ? `All legs clear ${config.reservePercent}% reserve · Worst margin: ${simResult.worstMarginPercent.toFixed(1)}%`
          : simResult.infeasibleReason}
      </span>
    </motion.div>
  );
}
