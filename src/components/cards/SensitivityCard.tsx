'use client';

import { useMemo, useDeferredValue } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LineChart, Line,
} from 'recharts';
import { Activity, Gauge } from 'lucide-react';
import { useSimStore } from '@/store/useSimStore';
import { computeTornado, sweepSpeed, TornadoFactor, SpeedPoint } from '@/engine/sensitivity';
import { REF_SPEED_KNOTS } from '@/engine/constants';
import {
  SERIES, GRID_STROKE, axisTick, axisLine,
  TooltipShell, TooltipRow, ChartLegend, SectionLabel, TableView,
  formatMoney, formatMoneySigned,
} from '@/components/charts/chartTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Tooltips — module scope, so React does not remount them every render
// ─────────────────────────────────────────────────────────────────────────────

function TornadoTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: { payload: TornadoFactor }[];
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <TooltipShell title={d.label} subtitle={d.source}>
      <TooltipRow label={`At ${d.lowLabel}`} value={formatMoneySigned(d.lowNpv)} swatch={SERIES.ev} />
      <TooltipRow label={`At ${d.highLabel}`} value={formatMoneySigned(d.highNpv)} swatch={SERIES.warm} />
      <TooltipRow label="Total swing" value={formatMoney(d.swing)} />
      <TooltipRow
        label="Bar spans"
        value={`${formatMoneySigned(Math.min(d.lowDelta, d.highDelta))} … ${formatMoneySigned(Math.max(d.lowDelta, d.highDelta))}`}
      />
    </TooltipShell>
  );
}

function SpeedTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: { payload: SpeedPoint }[];
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <TooltipShell
      title={`${d.speedKnots.toFixed(1)} knots`}
      subtitle={d.feasible ? 'Voyage completes' : 'Voyage does not complete at this speed'}
    >
      <TooltipRow label="Energy" value={`${d.energyIndex.toFixed(0)} (${d.totalEnergyMWh.toFixed(0)} MWh)`} swatch={SERIES.demand} />
      <TooltipRow label="EV CO₂/yr" value={`${d.evCO2Index.toFixed(0)} (${d.evCO2PerYear.toFixed(0)} t)`} swatch={SERIES.ev} />
      <TooltipRow label="EV 10yr TCO" value={`${d.evTcoIndex.toFixed(0)} (${formatMoney(d.evTotalTCO)})`} swatch={SERIES.accent} />
      <TooltipRow label="Worst SoC margin" value={`${d.worstMarginPercent.toFixed(1)}%`} />
      <TooltipRow
        label="Vs timetable"
        value={`${d.scheduleDeviationHours >= 0 ? '+' : ''}${d.scheduleDeviationHours.toFixed(1)} h`}
      />
    </TooltipShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SensitivityCard() {
  const { config, activePorts, activeLegs } = useSimStore();

  // Both sweeps are cheap (roughly 20 and 13 pipeline passes), but they still
  // do not need to block a slider drag — deferring keeps the config panel at
  // full frame rate while these catch up.
  const deferredConfig = useDeferredValue(config);

  const tornado = useMemo(
    () => computeTornado(deferredConfig, activePorts, activeLegs),
    [deferredConfig, activePorts, activeLegs],
  );

  const speed = useMemo(
    () => sweepSpeed(deferredConfig, activePorts, activeLegs),
    [deferredConfig, activePorts, activeLegs],
  );

  const isStale = deferredConfig !== config;

  // ── Tornado: one diverging bar per factor, widest swing at the top ──
  //
  // Recharts anchors bars at zero, so a naive two-bar split would draw a range
  // like [+7M, +33M] as if it started at zero. That case is reachable: the
  // probes are fixed but the BASELINE is wherever the user's sliders sit, so
  // pushing e.g. the discount rate to 15% (above the 14% probe) puts both ends
  // of the bar on the same side of zero.
  //
  // Each side is therefore drawn as a stack of a transparent pad and a visible
  // segment, which gives a true floating bar while keeping the diverging
  // colour split at zero.
  const tornadoData = tornado.factors.map((f) => {
    const lo = Math.min(f.lowDelta, f.highDelta) / 1_000_000;
    const hi = Math.max(f.lowDelta, f.highDelta) / 1_000_000;
    const negPad = Math.min(hi, 0);              // 0 → hi, invisible
    const negBar = Math.min(lo, 0) - negPad;     // hi → lo, cool
    const posPad = Math.max(lo, 0);              // 0 → lo, invisible
    const posBar = Math.max(hi, 0) - posPad;     // lo → hi, warm
    return { ...f, lo, hi, negPad, negBar, posPad, posBar };
  });

  const topFactor = tornado.factors[0];

  // ── Speed: everything indexed to 13.2 kn so three measures share one axis ──
  const speedFeasibleFrom = speed.find((p) => p.feasible)?.speedKnots;
  const speedFeasibleTo = [...speed].reverse().find((p) => p.feasible)?.speedKnots;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-4 sm:p-6"
      style={{ opacity: isStale ? 0.72 : 1, transition: 'opacity 160ms ease' }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--chart-accent)' }} />
        <h3
          className="text-xs sm:text-sm font-semibold uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          Sensitivity — What Would Change The Answer
        </h3>
      </div>

      {/* ═══ Tornado ═══ */}
      <SectionLabel icon={<Activity size={14} />}>
        NPV gap swing by assumption
      </SectionLabel>

      <p
        className="text-[11px] leading-relaxed mb-3"
        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
      >
        Each bar moves one assumption between the bounds the case itself gives, holding everything
        else fixed. Baseline gap is <strong>{formatMoneySigned(tornado.baselineNpvGap)}</strong>;
        bars to the left make the EV look better, to the right worse.
        {topFactor && (
          <> <strong>{topFactor.label}</strong> alone swings it by {formatMoney(topFactor.swing)} — more
          than any other single input.</>
        )}
      </p>

      <div className="w-full min-w-0 overflow-hidden" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height={300} minWidth={0}>
          <BarChart
            data={tornadoData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 18 }}
            barCategoryGap="22%"
          >
            <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
            <XAxis
              type="number"
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}M`}
              label={{
                value: 'Change in NPV gap vs baseline ($M)',
                position: 'insideBottom',
                offset: -10,
                fill: 'var(--text-muted)',
                fontSize: 10,
                fontFamily: 'var(--font-display)',
              }}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ ...axisTick, fontFamily: 'var(--font-display)', fill: 'var(--text-secondary)' }}
              axisLine={axisLine}
              tickLine={false}
              width={118}
            />
            <Tooltip content={<TornadoTooltip />} cursor={{ fill: 'var(--glass)' }} />
            <ReferenceLine x={0} stroke="var(--chart-neutral)" strokeWidth={1.5} />
            <Bar dataKey="negPad" stackId="neg" barSize={13} fill="none" isAnimationActive={false} />
            <Bar dataKey="negBar" stackId="neg" barSize={13} fill={SERIES.ev} radius={[3, 0, 0, 3]} isAnimationActive={false} />
            <Bar dataKey="posPad" stackId="pos" barSize={13} fill="none" isAnimationActive={false} />
            <Bar dataKey="posBar" stackId="pos" barSize={13} fill={SERIES.warm} radius={[0, 3, 3, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ChartLegend
        items={[
          { label: 'Moves the gap in the EV’s favour', color: SERIES.ev },
          { label: 'Moves the gap against the EV', color: SERIES.warm },
        ]}
      />

      <TableView
        caption="NPV gap sensitivity by assumption"
        columns={['Assumption', 'Low probe', 'NPV gap', 'High probe', 'NPV gap', 'Swing']}
        rows={tornado.factors.map((f) => [
          f.label,
          f.lowLabel,
          formatMoneySigned(f.lowNpv),
          f.highLabel,
          formatMoneySigned(f.highNpv),
          formatMoney(f.swing),
        ])}
      />

      {/* ═══ Speed sweep ═══ */}
      <div className="pt-5 mt-5" style={{ borderTop: '1px solid var(--card-border)' }}>
        <SectionLabel icon={<Gauge size={14} />}>
          Speed trade-off — indexed to the {REF_SPEED_KNOTS} kn benchmark
        </SectionLabel>

        <p
          className="text-[11px] leading-relaxed mb-3"
          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
        >
          Exhibit 9 read against your configuration, run as a battery vessel. All three measures are
          indexed to 100 at {REF_SPEED_KNOTS} kn so they share one scale — putting MWh, tonnes and
          dollars on separate axes would invent a relationship that is not in the data. Energy,
          emissions and cost move together; the question is how much schedule you are buying.
          {speedFeasibleFrom !== undefined && speedFeasibleTo !== undefined ? (
            <> The voyage completes between <strong>{speedFeasibleFrom} and {speedFeasibleTo} kn</strong>.</>
          ) : (
            <> No speed in this range completes the voyage on the current network.</>
          )}
        </p>

        <div className="w-full min-w-0 overflow-hidden" style={{ height: 230 }}>
          <ResponsiveContainer width="100%" height={230} minWidth={0}>
            <LineChart data={speed} margin={{ top: 6, right: 18, left: -6, bottom: 18 }}>
              <CartesianGrid stroke={GRID_STROKE} />
              <XAxis
                dataKey="speedKnots"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={axisTick}
                axisLine={axisLine}
                tickLine={false}
                tickFormatter={(v: number) => `${v}`}
                label={{
                  value: 'Average sailing speed (knots)',
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
                tickFormatter={(v: number) => `${v}`}
                width={44}
              />
              <Tooltip content={<SpeedTooltip />} />
              <ReferenceLine
                y={100}
                stroke="var(--chart-neutral)"
                strokeWidth={1}
              />
              <ReferenceLine
                x={REF_SPEED_KNOTS}
                stroke="var(--chart-neutral)"
                strokeWidth={1}
                label={{
                  value: `${REF_SPEED_KNOTS} kn`,
                  position: 'top',
                  fill: 'var(--text-muted)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <Line
                type="monotone" dataKey="energyIndex" name="Energy"
                stroke={SERIES.demand} strokeWidth={2} dot={false} isAnimationActive={false}
              />
              <Line
                type="monotone" dataKey="evCO2Index" name="EV CO₂"
                stroke={SERIES.ev} strokeWidth={2} dot={false} isAnimationActive={false}
              />
              <Line
                type="monotone" dataKey="evTcoIndex" name="EV 10yr TCO"
                stroke={SERIES.accent} strokeWidth={2} dot={false} isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <ChartLegend
          items={[
            { label: 'Energy delivered', color: SERIES.demand },
            { label: 'EV CO₂ per year', color: SERIES.ev },
            { label: 'EV 10-year TCO', color: SERIES.accent },
          ]}
        />

        <TableView
          caption="Speed sweep, indexed to the 13.2 knot benchmark"
          columns={['Speed (kn)', 'Energy idx', 'CO₂ idx', 'TCO idx', 'Worst margin', 'Completes']}
          rows={speed.map((p) => [
            p.speedKnots.toFixed(1),
            p.energyIndex.toFixed(0),
            p.evCO2Index.toFixed(0),
            p.evTcoIndex.toFixed(0),
            `${p.worstMarginPercent.toFixed(1)}%`,
            p.feasible ? 'yes' : 'no',
          ])}
        />
      </div>
    </motion.div>
  );
}
