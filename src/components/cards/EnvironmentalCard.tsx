'use client';

import { useSimStore } from '@/store/useSimStore';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, ComposedChart, Line
} from 'recharts';
import { Zap, Flame, Globe } from 'lucide-react';

function StatTile({ label, value, unit, color, icon }: { label: string; value: string | number; unit?: string; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-3.5 rounded-xl" style={{
      background: 'var(--glass-strong)',
      border: '1px solid var(--card-border)',
    }}>
      <span className="text-[11px] uppercase tracking-wider font-medium mb-1.5 flex items-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
        {icon && <span className="mr-1.5 flex items-center justify-center text-green-400 opacity-80">{icon}</span>}{label}
      </span>
      <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: color || 'var(--text-primary)', lineHeight: 1.1 }}>
        {value}
        {unit && <span className="text-sm ml-1 font-normal" style={{ color: 'var(--text-secondary)' }}>{unit}</span>}
      </span>
    </div>
  );
}

export default function EnvironmentalCard() {
  const { emissions, playback } = useSimStore();

  // During playback, progressively reveal years
  const isAnimating = playback.isPlaying || (playback.hasPlayedOnce && playback.graphProgress < 1);
  const gp = isAnimating ? (playback.graphProgress ?? 0) : 1;

  // Map graphProgress (0–1) to how many years to show (0–10)
  const totalYears = emissions.evCumulativeCO2.length; // 11 (year 0 through 10)
  const visibleYears = isAnimating
    ? Math.max(1, Math.min(totalYears, Math.floor(gp * (totalYears - 1)) + 1 + 1))
    : totalYears;

  const chartData = emissions.evCumulativeCO2.slice(0, visibleYears).map((ev, i) => ({
    year: `Yr ${i}`,
    EV: Math.round(ev),
    ICE: Math.round(emissions.iceCumulativeCO2[i]),
  }));

  // Scale stat values during animation
  const evPerVoyage = isAnimating ? emissions.evCO2PerVoyageTons * gp : emissions.evCO2PerVoyageTons;
  const icePerVoyage = isAnimating ? emissions.iceCO2PerVoyageTons * gp : emissions.iceCO2PerVoyageTons;
  const abated10yr = isAnimating ? emissions.co2Abated10yr * gp : emissions.co2Abated10yr;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl px-4 py-3 text-xs" style={{
          background: 'rgba(14, 26, 43, 0.92)',
          border: '1px solid var(--card-border)',
          fontFamily: 'var(--font-mono)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <p className="mb-1.5 font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="flex justify-between gap-4">
              <span style={{ color: p.stroke }}>{p.name}</span>
              <span style={{ color: 'var(--text-primary)' }}>{p.value.toLocaleString()} t CO₂</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--green)' }} />
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
          Environmental — CO₂ Emissions
        </h3>
      </div>

      {/* Diverging CO2 curves — taller */}
      <div className="w-full mb-5 min-w-0 overflow-hidden" style={{ height: 208 }}>
        <ResponsiveContainer width="100%" height={208} minWidth={0}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id="iceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--red)" stopOpacity={0.12}/>
                <stop offset="100%" stopColor="var(--red)" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="evAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.12}/>
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              unit=" t"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="ICE" fill="url(#iceAreaGrad)" stroke="none" isAnimationActive={isAnimating} animationDuration={400} />
            <Area type="monotone" dataKey="EV" fill="url(#evAreaGrad)" stroke="none" isAnimationActive={isAnimating} animationDuration={400} />
            <Line type="monotone" dataKey="ICE" stroke="var(--red)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--red)', strokeWidth: 0 }} isAnimationActive={isAnimating} animationDuration={400} />
            <Line type="monotone" dataKey="EV" stroke="var(--cyan)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--cyan)', strokeWidth: 0 }} isAnimationActive={isAnimating} animationDuration={400} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stat tiles — scale during playback */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<Zap size={16} />}
          label="CO₂ / Voyage (EV)"
          value={evPerVoyage.toFixed(1)}
          unit="t"
          color="var(--cyan)"
        />
        <StatTile
          icon={<Flame size={16} />}
          label="CO₂ / Voyage (ICE)"
          value={icePerVoyage.toFixed(0)}
          unit="t"
          color="var(--red)"
        />
        <StatTile
          icon={<Globe size={16} />}
          label="10yr CO₂ Abated"
          value={(abated10yr / 1000).toFixed(1)}
          unit="kt"
          color="var(--green)"
        />
      </div>
    </motion.div>
  );
}
