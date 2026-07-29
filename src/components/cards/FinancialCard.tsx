'use client';

import { useSimStore } from '@/store/useSimStore';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, Leaf } from 'lucide-react';

function MonoReadout({ label, value, unit, color, icon }: { label: string; value: string; unit?: string; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-4 rounded-xl" style={{
      background: 'var(--glass-strong)',
      border: '1px solid var(--card-border)',
    }}>
      <span className="text-[11px] uppercase tracking-wider mb-2 font-medium flex items-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
        {icon && <span className="mr-1.5 flex items-center justify-center text-amber-500 opacity-80">{icon}</span>}{label}
      </span>
      <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: color || 'var(--text-primary)', lineHeight: 1.1 }}>
        {value}
        {unit && <span className="text-sm ml-1 font-normal" style={{ color: 'var(--text-secondary)' }}>{unit}</span>}
      </span>
    </div>
  );
}

function formatM(val: number): string {
  if (Math.abs(val) >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
  return `$${(val / 1_000).toFixed(0)}K`;
}

export default function FinancialCard() {
  const { economics, playback } = useSimStore();

  // During playback, scale operational costs by graph progress
  const isAnimating = playback.isPlaying || (playback.hasPlayedOnce && playback.graphProgress < 1);
  const gp = isAnimating ? (playback.graphProgress ?? 0) : 1;

  // Capital costs appear immediately; operational costs (energy, carbon) scale with voyage progress
  const chartData = [
    {
      name: 'EV',
      Vessel: economics.evVesselCost / 1_000_000,
      Battery: economics.evBatteryCost / 1_000_000,
      Efficiency: economics.evEfficiencyCost / 1_000_000,
      'Charging Infra': economics.evChargingInfraCost / 1_000_000,
      'Energy (10yr)': (economics.evEnergyCost10yr / 1_000_000) * gp,
      'Carbon Fines': (economics.evCarbonCost10yr / 1_000_000) * gp,
    },
    {
      name: 'ICE',
      Vessel: economics.iceVesselCost / 1_000_000,
      Battery: 0,
      Efficiency: 0,
      'Charging Infra': 0,
      'Energy (10yr)': (economics.iceFuelCost10yr / 1_000_000) * gp,
      'Carbon Fines': (economics.iceCarbonFines10yr / 1_000_000) * gp,
    },
  ];

  const SEGMENTS = [
    { key: 'Vessel',         color: '#4A90CC', label: 'Vessel' },
    { key: 'Battery',        color: '#38D9C8', label: 'Battery' },
    { key: 'Efficiency',     color: '#8B5CF6', label: 'Efficiency' },
    { key: 'Charging Infra', color: '#F59E0B', label: 'Charging' },
    { key: 'Energy (10yr)',  color: '#FB923C', label: 'Energy' },
    { key: 'Carbon Fines',   color: '#EF4444', label: 'Carbon' },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
      return (
        <div className="rounded-xl px-4 py-3 text-xs" style={{
          background: 'rgba(14, 26, 43, 0.92)',
          border: '1px solid var(--card-border)',
          fontFamily: 'var(--font-mono)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <p className="mb-2 font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {label} Total: ${total.toFixed(0)}M
          </p>
          {payload.filter((p: any) => p.value > 0).map((p: any) => (
            <p key={p.name} className="flex justify-between gap-4">
              <span style={{ color: p.fill }}>{p.name}</span>
              <span style={{ color: 'var(--text-primary)' }}>${p.value.toFixed(1)}M</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomLegend = ({ payload }: any) => {
    if (!payload) return null;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
        {payload.filter((p: any) => {
          // Only show legend items that have non-zero values somewhere
          return chartData.some((d: any) => d[p.dataKey] > 0);
        }).map((entry: any) => {
          const segment = SEGMENTS.find(s => s.key === entry.dataKey);
          return (
            <span key={entry.dataKey} className="flex items-center gap-1.5 text-[11px]" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
              {segment?.label || entry.dataKey}
            </span>
          );
        })}
      </div>
    );
  };

  // Scale NPV gap and cost/ton by progress during animation
  const scaledNpvGap = isAnimating
    ? (economics.evVesselCost + economics.evBatteryCost + economics.evEfficiencyCost + economics.evChargingInfraCost + economics.evEnergyCost10yr * gp)
      - (economics.iceVesselCost + economics.iceFuelCost10yr * gp + economics.iceCarbonFines10yr * gp)
    : economics.npvGap;

  const npvColor = scaledNpvGap < 0 ? 'var(--green)' : 'var(--red)';
  const costPerTon = isAnimating ? (gp > 0.1 ? scaledNpvGap / (economics.costPerTonCO2Abated !== 0 ? (economics.npvGap / economics.costPerTonCO2Abated) * gp : 1) : 0) : economics.costPerTonCO2Abated;
  const costPerTonColor = costPerTon < 0 ? 'var(--green)' : costPerTon < 100 ? 'var(--amber)' : 'var(--red)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--amber)' }} />
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
          Financial — 10-Year TCO Comparison
        </h3>
      </div>

      {/* Stacked bar chart — taller with segment labels */}
      <div className="w-full mb-2 min-w-0 overflow-hidden" style={{ height: 224 }}>
        <ResponsiveContainer width="100%" height={224} minWidth={0}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: -5, bottom: 5 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 13, fill: 'var(--text-secondary)', fontWeight: 600, fontFamily: 'var(--font-display)' }}
              axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
              tickLine={false}
              tickFormatter={(v: number) => `$${v}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {SEGMENTS.map((seg, i) => (
              <Bar
                key={seg.key}
                dataKey={seg.key}
                stackId="a"
                fill={seg.color}
                radius={i === SEGMENTS.length - 1 ? [4, 4, 0, 0] : undefined}
                isAnimationActive={isAnimating}
                animationDuration={600}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key readouts — enlarged */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <MonoReadout
          icon={<DollarSign size={20} />}
          label="NPV Gap (EV − ICE)"
          value={formatM(scaledNpvGap)}
          color={npvColor}
        />
        <MonoReadout
          icon={<Leaf size={20} />}
          label="Cost / ton CO₂ Abated"
          value={!isAnimating && economics.costPerTonCO2Abated !== 0 ? `$${Math.round(economics.costPerTonCO2Abated)}` : isAnimating && gp > 0.1 ? `$${Math.round(costPerTon)}` : 'N/A'}
          color={costPerTonColor}
        />
      </div>
    </motion.div>
  );
}
