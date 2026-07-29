'use client';

import { useSimStore } from '@/store/useSimStore';
import { motion } from 'framer-motion';

export default function VerdictBanner() {
  const { simResult, config } = useSimStore();
  const feasible = simResult.feasible;
  const isIce = config.vesselType === 'ice';
  const voyageWord = simResult.voyageMode === 'roundtrip' ? 'roundtrip' : 'one-way voyage';

  const accent = feasible ? 'var(--cyan)' : 'var(--red)';
  const label = feasible
    ? isIce ? 'ICE Bid Deliverable' : 'Voyage Feasible'
    : isIce ? 'ICE Bid Fails' : 'Voyage Infeasible';

  const detail = feasible
    ? isIce
      ? `Holds the Exhibit 2 timetable · ${simResult.totalFuelTonnes.toFixed(1)} t MGO per ${voyageWord} · ${simResult.portCallCount} port calls`
      : `All legs clear the ${config.reservePercent}% reserve · Worst margin ${simResult.worstMarginPercent.toFixed(1)}% · ${simResult.scheduleDeviationHours >= 0 ? '+' : ''}${simResult.scheduleDeviationHours.toFixed(1)} h vs timetable`
    : simResult.infeasibleReason;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      key={`${feasible}-${isIce}`}
      className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 rounded-xl"
      style={{
        background: feasible ? 'var(--cyan-glow)' : 'var(--red-dim)',
        border: `1px solid ${feasible ? 'rgba(56, 217, 200, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
      }}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: accent }}
        />
        <span
          className="text-xs sm:text-sm font-semibold tracking-wide uppercase flex-shrink-0"
          style={{ fontFamily: 'var(--font-display)', color: accent }}
        >
          {label}
        </span>
      </div>

      <span className="hidden sm:block w-px self-stretch flex-shrink-0" style={{ background: feasible ? 'rgba(56,217,200,0.2)' : 'rgba(239,68,68,0.2)' }} />

      <span
        className="text-[11px] sm:text-xs flex-1 leading-relaxed"
        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
      >
        {detail}
      </span>
    </motion.div>
  );
}

