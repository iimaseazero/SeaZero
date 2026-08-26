'use client';

import { useSimStore } from '@/store/useSimStore';
import { motion } from 'framer-motion';
import { Ship, Ruler, Timer, Waypoints } from 'lucide-react';

const GRID_COLORS = {
  strong: { bg: 'rgba(52, 211, 153, 0.12)', color: 'var(--green)', label: 'Strong' },
  medium: { bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--amber)', label: 'Medium' },
  weak: { bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--red)', label: 'Weak' },
};

export default function PortTable() {
  const { activePorts, activeLegs } = useSimStore();

  const totalDistance = activeLegs.reduce((s, l) => s + l.distanceKm, 0);
  const avgDwell = activePorts.reduce((s, p) => s + p.portStayMinutes, 0) / activePorts.length;
  const gridBreakdown = {
    strong: activePorts.filter((p) => p.gridTier === 'strong').length,
    medium: activePorts.filter((p) => p.gridTier === 'medium').length,
    weak: activePorts.filter((p) => p.gridTier === 'weak').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {[
          { label: 'Total Ports', value: activePorts.length, Icon: Ship },
          { label: 'Total Distance', value: `${Math.round(totalDistance).toLocaleString()} km`, Icon: Ruler },
          { label: 'Avg Dwell', value: `${Math.round(avgDwell)} min`, Icon: Timer },
          { label: 'Legs', value: activeLegs.length, Icon: Waypoints },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl"
            style={{ background: 'var(--glass-strong)', border: '1px solid var(--card-border)' }}
          >
            <div className="mb-1 sm:mb-2 text-cyan-400 opacity-80">
              <stat.Icon size={20} />
            </div>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-medium text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              {stat.label}
            </span>
            <span className="text-base sm:text-lg font-bold whitespace-nowrap mt-auto pt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Grid tier breakdown */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['strong', 'medium', 'weak'] as const).map((tier) => (
          <div
            key={tier}
            className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-lg"
            style={{ background: GRID_COLORS[tier].bg, border: `1px solid ${GRID_COLORS[tier].color}22` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GRID_COLORS[tier].color }} />
            <span className="text-[11px] sm:text-xs font-semibold" style={{ color: GRID_COLORS[tier].color, fontFamily: 'var(--font-display)' }}>
              {GRID_COLORS[tier].label}: {gridBreakdown[tier]}
            </span>
          </div>
        ))}
      </div>

      {/* Port table */}
      <div
        className="rounded-xl overflow-x-auto"
        style={{ border: '1px solid var(--card-border)', background: 'var(--glass)' }}
      >
        <div className="min-w-[420px]">
          {/* Header and rows share one scroll container: with the header outside
              it, the rows lose the scrollbar's width and the columns drift. */}
          <div className="max-h-[400px] overflow-y-auto">
            <div
              className="grid px-3 py-2.5 sticky top-0 z-10"
              style={{
                gridTemplateColumns: '22px minmax(100px, 1fr) 56px 56px 60px 40px',
                gap: '8px',
                background: 'var(--glass-strong)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {['#', 'Port Name', 'Lat', 'Lng', 'Grid', 'Dwell'].map((h) => (
                <span key={h} className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  {h}
                </span>
              ))}
            </div>
            {activePorts.map((port, i) => {
              const tierStyle = GRID_COLORS[port.gridTier];
              return (
                <div
                  key={port.id}
                  className="grid px-3 py-2 items-center transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                  style={{
                    gridTemplateColumns: '22px minmax(100px, 1fr) 56px 56px 60px 40px',
                    gap: '8px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {i}
                  </span>
                  <span className="text-sm font-medium truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {port.name}
                  </span>
                  <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {port.lat.toFixed(3)}
                  </span>
                  <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {port.lng.toFixed(3)}
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-md text-center"
                    style={{ background: tierStyle.bg, color: tierStyle.color, fontFamily: 'var(--font-display)' }}
                  >
                    {tierStyle.label}
                  </span>
                  <span className="text-xs text-center" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {port.portStayMinutes}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
