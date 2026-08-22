'use client';

import { useSimStore } from '@/store/useSimStore';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
<<<<<<< HEAD
  ResponsiveContainer, Legend, Cell, ReferenceLine, ComposedChart, Line,
  ReferenceDot, Area
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ArrowRight, Milestone } from 'lucide-react';
import {
  SERIES, GRID_STROKE, axisTick, axisLine,
  TooltipShell, TooltipRow, ChartLegend, TableView,
} from '@/components/charts/chartTheme';
=======
  ResponsiveContainer, Legend, Cell, ReferenceLine, ComposedChart, Line
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ArrowRight } from 'lucide-react';
>>>>>>> origin/master

function formatM(val: number): string {
  if (Math.abs(val) >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

function formatMSigned(val: number): string {
  const sign = val > 0 ? '+' : '';
  if (Math.abs(val) >= 1_000_000_000) return `${sign}$${(val / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(val) >= 1_000_000) return `${sign}$${(val / 1_000_000).toFixed(0)}M`;
  if (Math.abs(val) >= 1_000) return `${sign}$${(val / 1_000).toFixed(0)}K`;
  return `${sign}$${val.toFixed(0)}`;
}


// ── Tooltips and legend ──
// Declared at module scope. A component defined inside render is a new type on
// every pass, so React unmounts and remounts it, discarding any state.

interface CashFlowDatum {
  year: string;
  EV: number;
  ICE: number;
  evDiscounted: number;
  iceDiscounted: number;
  evVessel: number;
  evBattery: number;
  evEfficiency: number;
  evChargingInfra: number;
  evEnergy: number;
  evCarbon: number;
  iceVessel: number;
  iceEfficiency: number;
  iceFuel: number;
  iceCarbon: number;
}

interface WaterfallDatum {
  category: string;
  value: number;
  evCost: number;
  iceCost: number;
}

<<<<<<< HEAD
interface PaybackDatum {
  year: number;
  yearLabel: string;
  cumulativeDelta: number;   // $M, discounted, EV − ICE
  evCumulative: number;      // $M
  iceCumulative: number;     // $M
}

/**
 * Cumulative payback tooltip.
 *
 * The annual chart above shows the per-year delta; this one shows it summed,
 * which is the only view in which "when does the EV pay back?" has an answer.
 */
function PaybackTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: { payload: PaybackDatum }[];
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  const ahead = d.cumulativeDelta < 0;
  return (
    <TooltipShell
      title={d.year === 0 ? 'Year 0 — investment' : `Year ${d.year}`}
      subtitle={ahead ? 'EV is ahead on cumulative discounted cost' : 'EV is still behind'}
    >
      <TooltipRow label="EV cumulative" value={`$${d.evCumulative.toFixed(1)}M`} swatch={SERIES.ev} />
      <TooltipRow label="ICE cumulative" value={`$${d.iceCumulative.toFixed(1)}M`} swatch={SERIES.ice} />
      <TooltipRow
        label="Position"
        value={`${d.cumulativeDelta > 0 ? '+' : ''}$${d.cumulativeDelta.toFixed(1)}M`}
      />
    </TooltipShell>
  );
}

=======
>>>>>>> origin/master
function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-3">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span>{value}</span>
    </p>
  );
}

function CashFlowTooltip({
  active, payload, label, discountRate,
}: {
  active?: boolean;
  payload?: { payload: CashFlowDatum }[];
  label?: string;
  discountRate: number;
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;

  return (
    <div className="rounded-xl px-4 py-3 text-xs max-w-[280px]" style={{
      background: 'rgba(14, 26, 43, 0.95)',
      border: '1px solid var(--card-border)',
      fontFamily: 'var(--font-mono)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p className="mb-2 font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
        {label}
      </p>

      <div className="mb-2">
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--cyan)' }}>EV Costs</p>
        {d.evVessel > 0 && <Row label="Hull" value={`$${d.evVessel.toFixed(0)}M`} />}
        {d.evBattery > 0 && <Row label="Battery" value={`$${d.evBattery.toFixed(0)}M`} />}
        {d.evEfficiency > 0 && <Row label="Efficiency" value={`$${d.evEfficiency.toFixed(0)}M`} />}
        {d.evChargingInfra > 0 && <Row label="Charging" value={`$${d.evChargingInfra.toFixed(0)}M`} />}
        {d.evEnergy > 0 && <Row label="Energy" value={`$${d.evEnergy.toFixed(1)}M`} />}
        {d.evCarbon > 0 && <Row label="Carbon" value={`$${d.evCarbon.toFixed(1)}M`} />}
        <p className="flex justify-between gap-3 mt-1 pt-1" style={{ borderTop: '1px solid rgba(148,163,184,0.1)' }}>
          <span style={{ color: 'var(--cyan)' }}>Total</span><span style={{ color: 'var(--cyan)' }}>${d.EV.toFixed(1)}M</span>
        </p>
      </div>

      <div className="mb-2">
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--red)' }}>ICE Costs</p>
        {d.iceVessel > 0 && <Row label="Hull + propulsion" value={`$${d.iceVessel.toFixed(0)}M`} />}
        {d.iceEfficiency > 0 && <Row label="Efficiency" value={`$${d.iceEfficiency.toFixed(0)}M`} />}
        {d.iceFuel > 0 && <Row label="Fuel" value={`$${d.iceFuel.toFixed(1)}M`} />}
        {d.iceCarbon > 0 && <Row label="Carbon" value={`$${d.iceCarbon.toFixed(1)}M`} />}
        <p className="flex justify-between gap-3 mt-1 pt-1" style={{ borderTop: '1px solid rgba(148,163,184,0.1)' }}>
          <span style={{ color: 'var(--red)' }}>Total</span><span style={{ color: 'var(--red)' }}>${d.ICE.toFixed(1)}M</span>
        </p>
      </div>

      <div className="pt-1.5 mt-1.5" style={{ borderTop: '1px solid rgba(148,163,184,0.12)' }}>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Discounted ({(discountRate * 100).toFixed(0)}%): EV ${d.evDiscounted.toFixed(1)}M · ICE ${d.iceDiscounted.toFixed(1)}M
        </p>
      </div>
    </div>
  );
}

function WaterfallTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: { payload: WaterfallDatum }[];
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;

  const isNet = d.category === 'Net NPV Gap';
  return (
    <div className="rounded-xl px-4 py-3 text-xs" style={{
      background: 'rgba(14, 26, 43, 0.95)',
      border: '1px solid var(--card-border)',
      fontFamily: 'var(--font-mono)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p className="mb-1.5 font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
        {d.category}
      </p>
      {!isNet && (
        <>
          <p className="flex justify-between gap-4"><span style={{ color: 'var(--cyan)' }}>EV cost</span><span>${d.evCost.toFixed(1)}M</span></p>
          <p className="flex justify-between gap-4"><span style={{ color: 'var(--red)' }}>ICE cost</span><span>${d.iceCost.toFixed(1)}M</span></p>
          <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(148,163,184,0.1)' }}>
            <p className="flex justify-between gap-4">
              <span style={{ color: 'var(--text-secondary)' }}>Difference</span>
              <span style={{ color: d.value > 0 ? 'var(--red)' : 'var(--green)' }}>
                {d.value > 0 ? `EV pays $${Math.abs(d.value).toFixed(1)}M more` : `EV saves $${Math.abs(d.value).toFixed(1)}M`}
              </span>
            </p>
          </div>
        </>
      )}
      {isNet && (
        <p style={{ color: d.value > 0 ? 'var(--red)' : 'var(--green)' }}>
          {d.value > 0 ? `EV costs $${Math.abs(d.value).toFixed(1)}M more overall` : `EV saves $${Math.abs(d.value).toFixed(1)}M overall`}
        </p>
      )}
    </div>
  );
}

function CashFlowLegend() {
  const items = [
    { key: 'EV', color: '#06B6D4', label: 'EV total' },
    { key: 'ICE', color: '#EF4444', label: 'ICE total' },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
      {items.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5 text-[11px]" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default function FinancialCard() {
  const { economics, playback, config, simResult } = useSimStore();
  const voyageWord = simResult.voyageMode === 'roundtrip' ? 'roundtrips' : 'one-way voyages';

  // During playback, scale operational costs by graph progress
  const isAnimating = playback.isPlaying || (playback.hasPlayedOnce && playback.graphProgress < 1);
  const gp = isAnimating ? (playback.graphProgress ?? 0) : 1;

  // Scale NPV gap during animation
  const scaledNpvGap = isAnimating
    ? (economics.evVesselCost + economics.evBatteryCost + economics.evEfficiencyCost
       + economics.evChargingInfraCost
       + (economics.evEnergyCost10yr + economics.evCarbonCost10yr) * gp)
      - (economics.iceVesselCost + economics.icePropulsionCost + economics.iceEfficiencyCost
         + (economics.iceFuelCost10yr + economics.iceCarbonFines10yr) * gp)
    : economics.npvGap;

  const evSaves = scaledNpvGap < 0;
  const absGap = Math.abs(scaledNpvGap);

  // ── Section 1: Cash flow chart data ──
  const visibleYears = isAnimating
    ? Math.max(1, Math.min(11, Math.floor(gp * 10) + 1 + 1))
    : 11;

  const cashFlowData = economics.annualCashFlows.slice(0, visibleYears).map((cf) => ({
    year: cf.year === 0 ? 'Yr 0\n(Capex)' : `Yr ${cf.year}`,
    EV: cf.evTotal / 1_000_000,
    ICE: cf.iceTotal / 1_000_000,
    evDiscounted: cf.evTotalDiscounted / 1_000_000,
    iceDiscounted: cf.iceTotalDiscounted / 1_000_000,
    delta: cf.delta / 1_000_000,
    deltaDiscounted: cf.deltaDiscounted / 1_000_000,
    // breakdown for tooltip
    evVessel: cf.evVessel / 1_000_000,
    evBattery: cf.evBattery / 1_000_000,
    evEfficiency: cf.evEfficiency / 1_000_000,
    evChargingInfra: cf.evChargingInfra / 1_000_000,
    evEnergy: cf.evEnergy / 1_000_000,
    evCarbon: cf.evCarbon / 1_000_000,
    iceVessel: cf.iceVessel / 1_000_000,
    iceEfficiency: cf.iceEfficiency / 1_000_000,
    iceFuel: cf.iceFuel / 1_000_000,
    iceCarbon: cf.iceCarbon / 1_000_000,
  }));

  // ── Section 2: NPV waterfall data ──
  const waterfallData = economics.npvComponents
    .filter((c) => {
      // During animation, scale operational components
      if (isAnimating) {
        if (c.category.includes('10yr')) return gp > 0.05;
      }
      // Filter out zero-delta components
      return Math.abs(c.delta) > 1000;
    })
    .map((c) => {
      const delta = c.category.includes('10yr') && isAnimating ? c.delta * gp : c.delta;
      return {
        category: c.category,
        value: delta / 1_000_000,
        evCost: c.evCost / 1_000_000,
        iceCost: c.iceCost / 1_000_000,
        color: c.color,
        isPositive: delta > 0, // positive = EV costs more
      };
    });

  // Net bar: taken from the economics result directly. Summing the bars above
  // would disagree with the headline whenever a small component is filtered out.
  const netDelta = scaledNpvGap / 1_000_000;
  waterfallData.push({
    category: 'Net NPV Gap',
    value: netDelta,
    evCost: economics.evTotalTCO / 1_000_000,
    iceCost: economics.iceTotalTCO / 1_000_000,
    color: netDelta > 0 ? '#EF4444' : '#10B981',
    isPositive: netDelta > 0,
  });

<<<<<<< HEAD
  // ── Section 4: cumulative payback ──
  // annualCashFlows already carries the discounted per-year totals; nothing in
  // the app summed them, so the crossover year — the number a CFO actually
  // asks for — was not visible anywhere.
  const paybackData: PaybackDatum[] = economics.annualCashFlows.reduce<PaybackDatum[]>(
    (acc, cf) => {
      const prev = acc[acc.length - 1];
      const evCumulative = (prev?.evCumulative ?? 0) + cf.evTotalDiscounted / 1_000_000;
      const iceCumulative = (prev?.iceCumulative ?? 0) + cf.iceTotalDiscounted / 1_000_000;
      acc.push({
        year: cf.year,
        yearLabel: cf.year === 0 ? 'Y0' : `Y${cf.year}`,
        cumulativeDelta: evCumulative - iceCumulative,
        evCumulative,
        iceCumulative,
      });
      return acc;
    },
    [],
  );

  // Linear interpolation between the two years that straddle zero.
  const crossoverYear = (() => {
    for (let i = 1; i < paybackData.length; i++) {
      const prev = paybackData[i - 1].cumulativeDelta;
      const curr = paybackData[i].cumulativeDelta;
      if (prev > 0 && curr <= 0) {
        const span = prev - curr;
        return paybackData[i - 1].year + (span === 0 ? 0 : prev / span);
      }
    }
    return null;
  })();

  const paybackVisible = isAnimating
    ? paybackData.slice(0, Math.max(1, Math.min(11, Math.floor(gp * 10) + 2)))
    : paybackData;

=======
>>>>>>> origin/master
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-4 sm:p-6"
    >
      {/* Card header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--amber)' }} />
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
          Financial — 10-Year TCO Comparison
        </h3>
      </div>

      {/* ═══ SECTION 1: Plain-language NPV summary banner ═══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 mb-5"
        style={{
          background: evSaves
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.06) 100%)',
          border: `1px solid ${evSaves ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{
            background: evSaves ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          }}>
            {evSaves
              ? <TrendingDown size={18} style={{ color: 'var(--green)' }} />
              : <TrendingUp size={18} style={{ color: 'var(--red)' }} />
            }
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: evSaves ? 'var(--green)' : 'var(--red)' }}>
              EV is {formatM(absGap)} {evSaves ? 'cheaper' : 'more expensive'} than ICE over 10 years
            </p>
            <p className="text-[11px] sm:text-xs mt-0.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
              Discounted at {(config.discountRate * 100).toFixed(0)}% · {economics.voyagesPerYear} {voyageWord}/year · NPV gap: {formatMSigned(scaledNpvGap)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ SECTION 2: Annual Cash Flow Chart ═══ */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
            Annual Cash Flows — EV vs ICE
          </span>
        </div>

        <div className="w-full min-w-0 overflow-hidden" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height={220} minWidth={0}>
            <ComposedChart data={cashFlowData} margin={{ top: 8, right: 16, left: -5, bottom: 5 }} barCategoryGap="20%">
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
                tickFormatter={(v: number) => `$${v}M`}
              />
              <Tooltip content={<CashFlowTooltip discountRate={config.discountRate} />} />
              <Legend content={<CashFlowLegend />} />
              <Bar dataKey="evDiscounted" name="EV" fill="#06B6D4" radius={[3, 3, 0, 0]} barSize={18}
                isAnimationActive={isAnimating} animationDuration={600} fillOpacity={0.85} />
              <Bar dataKey="iceDiscounted" name="ICE" fill="#EF4444" radius={[3, 3, 0, 0]} barSize={18}
                isAnimationActive={isAnimating} animationDuration={600} fillOpacity={0.85} />
              <Line
                type="monotone" dataKey="deltaDiscounted" stroke="var(--amber)" strokeWidth={2}
                dot={{ r: 2.5, fill: 'var(--amber)', strokeWidth: 0 }}
                strokeDasharray="4 3"
                isAnimationActive={isAnimating} animationDuration={600}
                name="Delta (discounted)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] mt-1 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
          Discounted to present value · Year 0 = upfront investment · Years 1–10 = annual operating costs · Dashed line = delta (EV − ICE)
        </p>
      </div>

<<<<<<< HEAD
      {/* ═══ SECTION 3: Cumulative payback — where the two bids cross ═══ */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Milestone size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
            Cumulative Position — When Does the EV Pay Back?
          </span>
        </div>

        <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
          Running total of discounted spend, EV minus ICE. It starts deep in the red because the
          battery and the shore network are paid on day one, then climbs as cheaper energy accrues.
          {crossoverYear !== null ? (
            <> The two bids cross in <strong>year {crossoverYear.toFixed(1)}</strong> — inside the
              10-year horizon.</>
          ) : paybackData[paybackData.length - 1]?.cumulativeDelta <= 0 ? (
            <> The EV is ahead from the start at these assumptions.</>
          ) : (
            <> They never cross inside 10 years: the EV is still{' '}
              <strong>${paybackData[paybackData.length - 1]?.cumulativeDelta.toFixed(0)}M</strong>{' '}
              behind at year 10.</>
          )}
        </p>

        <div className="w-full min-w-0 overflow-hidden" style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height={210} minWidth={0}>
            <ComposedChart data={paybackVisible} margin={{ top: 10, right: 18, left: -4, bottom: 18 }}>
              <defs>
                <linearGradient id="paybackFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-warm)" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="var(--chart-warm)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_STROKE} />
              <XAxis
                dataKey="yearLabel"
                tick={axisTick}
                axisLine={axisLine}
                tickLine={false}
                label={{
                  value: 'Years from investment decision',
                  position: 'insideBottom',
                  offset: -10,
                  fill: 'var(--text-muted)',
                  fontSize: 10,
                  fontFamily: 'var(--font-display)',
                }}
              />
              <YAxis
                tick={axisTick}
                axisLine={axisLine}
                tickLine={false}
                width={52}
                tickFormatter={(v: number) => `${v > 0 ? '+' : ''}$${v.toFixed(0)}M`}
              />
              <Tooltip content={<PaybackTooltip />} />
              <ReferenceLine
                y={0}
                stroke="var(--chart-neutral)"
                strokeWidth={1.5}
                label={{
                  value: 'break-even',
                  position: 'insideBottomRight',
                  fill: 'var(--text-muted)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulativeDelta"
                fill="url(#paybackFill)"
                stroke="none"
                isAnimationActive={isAnimating}
                animationDuration={500}
              />
              <Line
                type="monotone"
                dataKey="cumulativeDelta"
                stroke={SERIES.warm}
                strokeWidth={2}
                dot={{ r: 3, fill: SERIES.warm, strokeWidth: 0 }}
                isAnimationActive={isAnimating}
                animationDuration={500}
              />
              {crossoverYear !== null && (
                <ReferenceDot
                  x={`Y${Math.round(crossoverYear)}`}
                  y={0}
                  r={5}
                  fill={SERIES.good}
                  stroke="var(--card-bg)"
                  strokeWidth={2}
                  label={{
                    value: `pays back yr ${crossoverYear.toFixed(1)}`,
                    position: 'top',
                    fill: 'var(--text-secondary)',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <ChartLegend
          items={[{ label: 'Cumulative discounted spend, EV − ICE', color: SERIES.warm }]}
        />

        <TableView
          caption="Cumulative discounted cost position by year"
          columns={['Year', 'EV cumulative', 'ICE cumulative', 'EV − ICE']}
          rows={paybackData.map((d) => [
            d.year === 0 ? 'Y0 (capex)' : `Y${d.year}`,
            `$${d.evCumulative.toFixed(1)}M`,
            `$${d.iceCumulative.toFixed(1)}M`,
            `${d.cumulativeDelta > 0 ? '+' : ''}$${d.cumulativeDelta.toFixed(1)}M`,
          ])}
        />
      </div>

      {/* ═══ SECTION 4: NPV Waterfall — Component Breakdown ═══ */}
=======
      {/* ═══ SECTION 3: NPV Waterfall — Component Breakdown ═══ */}
>>>>>>> origin/master
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
            NPV Breakdown — What Drives the Gap
          </span>
        </div>

        <div className="w-full min-w-0 overflow-hidden" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height={200} minWidth={0}>
            <BarChart
              data={waterfallData}
              layout="vertical"
              margin={{ top: 4, right: 15, left: 0, bottom: 4 }}
              barCategoryGap="18%"
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
                tick={{ fontSize: 9, fill: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
                axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
                tickLine={false}
                width={85}
              />
              <Tooltip content={<WaterfallTooltip />} />
              <ReferenceLine x={0} stroke="rgba(148,163,184,0.15)" />
              <Bar dataKey="value" radius={[3, 3, 3, 3]} barSize={16}
                isAnimationActive={isAnimating} animationDuration={600}>
                {waterfallData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.category === 'Net NPV Gap'
                      ? (entry.value > 0 ? '#EF4444' : '#10B981')
                      : (entry.value > 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)')
                    }
                    stroke={entry.category === 'Net NPV Gap'
                      ? (entry.value > 0 ? '#EF4444' : '#10B981')
                      : 'transparent'
                    }
                    strokeWidth={entry.category === 'Net NPV Gap' ? 1.5 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Waterfall legend */}
        <div className="flex justify-center gap-6 mt-2">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.7)' }} />
            EV costs more
          </span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(16, 185, 129, 0.7)' }} />
            EV saves money
          </span>
        </div>
      </div>
    </motion.div>
  );
}
