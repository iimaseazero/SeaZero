'use client';

import { useSimStore } from '@/store/useSimStore';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, ComposedChart, Line,
  BarChart, Bar, Cell
} from 'recharts';
import { Zap, Flame, Globe, Calculator, Scale } from 'lucide-react';

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

function formatM(val: number): string {
  if (Math.abs(val) >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

// Carbon price benchmarks
const BENCHMARKS = [
  { label: 'EU ETS Price', value: 100, color: '#3B82F6' },
  { label: 'Social Cost (EPA)', value: 190, color: '#8B5CF6' },
  { label: 'IMO Levy (Proposed)', value: 150, color: '#06B6D4' },
];


// Declared at module scope: components created during render are new types on
// every pass, so React remounts them instead of updating them.

function CumulativeTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; stroke?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  // Each series is drawn twice — an Area for the gradient fill and a Line for
  // the stroke — so the payload contains two entries per series. Collapse them
  // by name, preferring the entry that carries a stroke colour. Without this
  // the tooltip lists every series twice and React sees duplicate keys.
  const series = new Map<string, { name: string; value: number; stroke?: string }>();
  for (const entry of payload) {
    const name = entry.name ?? '';
    const existing = series.get(name);
    if (!existing || (!existing.stroke && entry.stroke)) {
      series.set(name, { name, value: entry.value ?? 0, stroke: entry.stroke });
    }
  }

  return (
    <div className="rounded-xl px-4 py-3 text-xs" style={{
      background: 'rgba(14, 26, 43, 0.92)',
      border: '1px solid var(--card-border)',
      fontFamily: 'var(--font-mono)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    }}>
      <p className="mb-1.5 font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{label}</p>
      {[...series.values()].map((entry) => (
        <p key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.stroke }}>{entry.name}</span>
          <span style={{ color: 'var(--text-primary)' }}>{entry.value.toLocaleString()} t CO₂</span>
        </p>
      ))}
    </div>
  );
}

function IncrementalTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: { payload: { category: string; value: number } }[];
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{
      background: 'rgba(14, 26, 43, 0.95)',
      border: '1px solid var(--card-border)',
      fontFamily: 'var(--font-mono)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p className="font-semibold text-xs mb-0.5" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
        {d.category}
      </p>
      <p style={{ color: d.value > 0 ? 'var(--red)' : 'var(--green)' }}>
        {d.value > 0 ? `+$${d.value.toFixed(1)}M more for EV` : `$${Math.abs(d.value).toFixed(1)}M saved by EV`}
      </p>
    </div>
  );
}

export default function EnvironmentalCard() {
  const { emissions, economics, playback, simResult } = useSimStore();
  const voyageWord = simResult.voyageMode === 'roundtrip' ? 'roundtrip' : 'voyage';

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

  // ── Carbon abatement cost data ──
  const incrementalCost = economics.npvGap; // EV TCO - ICE TCO
  const co2Avoided = emissions.co2Abated10yr;
  // null when there is no meaningful abatement to divide by — rendered as "n/a"
  // rather than a spurious $0/ton.
  const costPerTon = economics.costPerTonCO2Abated;
  const hasAbatement = costPerTon !== null;
  const absCostPerTon = hasAbatement ? Math.abs(costPerTon) : 0;

  // Incremental cost breakdown for the mini bar chart
  const incrementalBreakdown = economics.npvComponents
    .map((c) => ({ category: c.category, value: c.delta / 1_000_000, color: c.color }))
    .filter((d) => Math.abs(d.value) > 0.01);

  // Determine color for the abatement cost relative to benchmarks
  const costPerTonColor = !hasAbatement
    ? 'var(--text-muted)'
    : costPerTon < 0 ? 'var(--green)' : costPerTon < 200 ? 'var(--amber)' : 'var(--red)';
  const evSaves = hasAbatement && costPerTon < 0;

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
          Environmental — CO₂ Emissions & Abatement Cost
        </h3>
      </div>

      {/* ═══ Diverging CO2 curves ═══ */}
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
            <Tooltip content={<CumulativeTooltip />} />
            <Area type="monotone" dataKey="ICE" fill="url(#iceAreaGrad)" stroke="none" isAnimationActive={isAnimating} animationDuration={400} />
            <Area type="monotone" dataKey="EV" fill="url(#evAreaGrad)" stroke="none" isAnimationActive={isAnimating} animationDuration={400} />
            <Line type="monotone" dataKey="ICE" stroke="var(--red)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--red)', strokeWidth: 0 }} isAnimationActive={isAnimating} animationDuration={400} />
            <Line type="monotone" dataKey="EV" stroke="var(--cyan)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--cyan)', strokeWidth: 0 }} isAnimationActive={isAnimating} animationDuration={400} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stat tiles — scale during playback */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatTile
          icon={<Zap size={16} />}
          label={`CO₂ / ${voyageWord} (EV)`}
          value={evPerVoyage.toFixed(1)}
          unit="t"
          color="var(--cyan)"
        />
        <StatTile
          icon={<Flame size={16} />}
          label={`CO₂ / ${voyageWord} (ICE)`}
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

      {/* ═══ CARBON ABATEMENT COST BREAKDOWN ═══ */}
      <div className="pt-5" style={{ borderTop: '1px solid var(--card-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
            Cost to Abate Carbon
          </span>
        </div>

        {/* Plain-language interpretation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl px-5 py-4 mb-4"
          style={{
            background: evSaves
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.06) 100%)',
            border: `1px solid ${evSaves ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{
              background: evSaves ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            }}>
              <Scale size={18} style={{ color: costPerTonColor }} />
            </div>
            <div>
              <p className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: costPerTonColor }}>
                {!hasAbatement
                  ? 'No measurable abatement to price'
                  : evSaves
                    ? `EV saves money while cutting ${(co2Avoided / 1000).toFixed(1)}kt CO₂`
                    : `Each ton of CO₂ avoided costs $${Math.round(absCostPerTon)}`
                }
              </p>
              <p className="text-[11px] mt-0.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
                {!hasAbatement
                  ? 'The two options emit almost the same amount at these settings'
                  : evSaves
                    ? 'Negative abatement cost — EV is both cheaper and cleaner'
                    : 'Marginal abatement cost over 10-year horizon'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Formula display */}
        <div className="rounded-xl px-4 py-3 mb-4" style={{
          background: 'var(--glass-strong)',
          border: '1px solid var(--card-border)',
        }}>
          <p className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Formula
          </p>
          <div className="flex items-center gap-2 flex-wrap" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Cost per ton =</span>
            <span className="px-2 py-1 rounded-md" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--text-primary)' }}>
              {formatM(incrementalCost)}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>÷</span>
            <span className="px-2 py-1 rounded-md" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--text-primary)' }}>
              {co2Avoided.toLocaleString(undefined, { maximumFractionDigits: 0 })} t CO₂
            </span>
            <span style={{ color: 'var(--text-muted)' }}>=</span>
            <span className="px-2 py-1 rounded-md font-bold" style={{
              background: evSaves ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)',
              color: costPerTonColor,
            }}>
              {hasAbatement ? `$${Math.round(costPerTon)} / ton` : 'n/a'}
            </span>
          </div>
          <div className="flex gap-6 mt-2 text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            <span>Incremental cost: EV TCO ({formatM(economics.evTotalTCO)}) − ICE TCO ({formatM(economics.iceTotalTCO)})</span>
          </div>
          <div className="flex gap-6 mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            <span>CO₂ avoided: {emissions.co2AbatedPerVoyage.toFixed(1)} t/{voyageWord} × {economics.voyagesPerYear} {voyageWord}s/yr × 10 years</span>
          </div>
        </div>

        {/* Incremental cost breakdown — horizontal bar chart */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            What makes up the incremental cost
          </p>
          <div className="w-full min-w-0 overflow-hidden" style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height={130} minWidth={0}>
              <BarChart
                data={incrementalBreakdown}
                layout="vertical"
                margin={{ top: 2, right: 20, left: 10, bottom: 2 }}
                barCategoryGap="16%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v > 0 ? '+' : ''}$${v}M`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<IncrementalTooltip />} />
                <Bar dataKey="value" radius={[3, 3, 3, 3]} barSize={12}>
                  {incrementalBreakdown.map((entry, index) => (
                    <Cell
                      key={`inc-${index}`}
                      fill={entry.value > 0
                        ? 'rgba(239, 68, 68, 0.65)'
                        : 'rgba(16, 185, 129, 0.65)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Benchmark comparisons */}
        <div className="rounded-xl px-4 py-3" style={{
          background: 'var(--glass-strong)',
          border: '1px solid var(--card-border)',
        }}>
          <p className="text-[10px] uppercase tracking-wider mb-3 font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            How does this compare?
          </p>
          <div className="space-y-2">
            {BENCHMARKS.map((b) => {
              const ratio = hasAbatement ? absCostPerTon / b.value : 0;
              const barWidth = Math.min(100, (ratio > 1 ? 100 : ratio * 100));
              return (
                <div key={b.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
                      {b.label}: ${b.value}/ton
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: evSaves ? 'var(--green)' : (absCostPerTon <= b.value ? 'var(--green)' : 'var(--red)') }}>
                      {!hasAbatement ? 'n/a' : evSaves ? 'EV saves $' : `${ratio.toFixed(1)}×`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: evSaves ? '0%' : `${barWidth}%`,
                        background: `linear-gradient(90deg, ${b.color}, ${evSaves || absCostPerTon <= b.value ? 'var(--green)' : 'var(--red)'})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            {!hasAbatement
              ? 'Abatement cost is undefined when the two options emit the same amount.'
              : evSaves
                ? 'No abatement cost — the EV option is cheaper while eliminating emissions.'
                : absCostPerTon < 200
                  ? 'Abatement cost is comparable to existing carbon pricing mechanisms.'
                  : 'Abatement cost exceeds most current carbon prices, but may align with future climate policy.'
            }
          </p>
        </div>
      </div>
    </motion.div>
  );
}
