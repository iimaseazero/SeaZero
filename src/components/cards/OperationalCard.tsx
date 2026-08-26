'use client';

import { useSimStore } from '@/store/useSimStore';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Area, ComposedChart, Bar, Cell
} from 'recharts';
import { TrendingDown, AlertTriangle, Clock, Plug, Fuel, Scale, BatteryCharging } from 'lucide-react';
import {
  SERIES, GRID_STROKE, axisTick, axisLine,
  TooltipShell, TooltipRow, ChartLegend, SectionLabel, TableView,
} from '@/components/charts/chartTheme';

function StatTile({ label, value, unit, alert, icon }: { label: string; value: string | number; unit?: string; alert?: boolean; icon?: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-center px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl"
      style={{
        background: alert ? 'var(--red-dim)' : 'var(--glass-strong)',
        border: `1px solid ${alert ? 'rgba(239,68,68,0.15)' : 'var(--card-border)'}`,
      }}
    >
      <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-medium mb-1 flex items-center text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
        {icon && <span className="mr-1 flex items-center justify-center text-cyan-400 opacity-80">{icon}</span>}{label}
      </span>
      <span className={`text-lg sm:text-2xl font-bold ${alert ? 'text-[var(--red)]' : 'text-[var(--text-primary)]'}`} style={{ fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
        {value}
        {unit && <span className="text-xs sm:text-sm ml-0.5 sm:ml-1 font-normal" style={{ color: 'var(--text-secondary)' }}>{unit}</span>}
      </span>
    </div>
  );
}

interface TooltipDatum {
  port: string;
  soc: number;
}

/**
 * Declared at module scope: a component created inside render is a brand new
 * type on every pass, so React remounts it and it loses its state.
 */
function SocTooltip({
  active, payload, reserveFloor, batteryMWh,
}: {
  active?: boolean;
  payload?: { payload: TooltipDatum }[];
  reserveFloor: number;
  batteryMWh: number;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-xl px-4 py-3 text-xs" style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      fontFamily: 'var(--font-mono)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    }}>
      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{data.port}</p>
      <p style={{ color: data.soc < reserveFloor ? 'var(--red)' : 'var(--cyan)' }}>
        SoC: {data.soc.toFixed(1)} MWh ({((data.soc / batteryMWh) * 100).toFixed(0)}%)
      </p>
    </div>
  );
}

function FuelTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: { payload: { port: string; fuel: number; energy: number } }[];
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-xs" style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      fontFamily: 'var(--font-mono)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    }}>
      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{d.port}</p>
      <p style={{ color: 'var(--amber)' }}>Fuel burned: {d.fuel.toFixed(1)} t MGO</p>
      <p style={{ color: 'var(--text-secondary)' }}>Energy: {d.energy.toFixed(0)} MWh</p>
    </div>
  );
}

interface CallDatum {
  portShort: string;
  portFull: string;
  /** Plotted downward: energy the leg into this port consumed. */
  demand: number;
  /** Plotted upward: energy actually put back into the battery here. */
  charged: number;
  gridLoss: number;
  throttled: boolean;
  deliveredMW: number;
  ratedMW: number;
  chargingMinutes: number;
  ccSharePercent: number;
  net: number;
}

/**
 * Per-call energy tooltip.
 *
 * The state-of-charge trace above shows the RESULT of demand and charging
 * netting out; it cannot show which of the two is the problem at a given port.
 * This chart separates them, and surfaces the connector/grid/taper detail the
 * engine already computes per leg and previously discarded.
 */
function CallTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: { payload: CallDatum }[];
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <TooltipShell
      title={d.portFull}
      subtitle={
        d.throttled
          ? 'Local grid was the binding limit here, not the connector'
          : d.charged > 0
            ? undefined
            : 'No charger at this call'
      }
    >
      <TooltipRow label="Leg demand" value={`${d.demand.toFixed(1)} MWh`} swatch={SERIES.demand} />
      <TooltipRow label="Charged here" value={`${d.charged.toFixed(1)} MWh`} swatch={SERIES.ev} />
      <TooltipRow label="Net" value={`${d.net >= 0 ? '+' : ''}${d.net.toFixed(1)} MWh`} />
      {d.charged > 0 && (
        <>
          <TooltipRow label="Power delivered" value={`${d.deliveredMW.toFixed(1)} of ${d.ratedMW} MW`} />
          <TooltipRow label="Plugged in" value={`${d.chargingMinutes.toFixed(0)} min`} />
          <TooltipRow label="At full rate (CC)" value={`${d.ccSharePercent.toFixed(0)}%`} />
          <TooltipRow label="Lost to charging" value={`${d.gridLoss.toFixed(2)} MWh`} />
        </>
      )}
    </TooltipShell>
  );
}

export default function OperationalCard() {
  const { simResult, config, playback, activePorts } = useSimStore();
  const reserveFloor = config.batteryMWh * (config.reservePercent / 100);
  const isIce = config.vesselType === 'ice';
  const energyShort = simResult.energyBalanceMWh < 0;

  // Two points per call: arrival (before charging) and departure (after).
  //
  // Positions are keyed off `voyageIndex`, not `legIndex`. On a roundtrip the
  // southbound half reuses the same leg indices as the northbound half, so
  // keying by leg would give the chart duplicate keys and overlay the return
  // journey on top of the outbound one.
  const startName = simResult.legs[0]?.fromPortName ?? activePorts[0]?.name ?? 'Start';
  const fullChartData: { port: string; portShort: string; soc: number; index: number; belowReserve: boolean }[] = [
    {
      port: `${startName} (departure)`,
      portShort: startName.substring(0, 3).toUpperCase(),
      soc: config.batteryMWh as number,
      index: 0,
      belowReserve: false,
    },
  ];

  for (const leg of simResult.legs) {
    const socArr = Math.max(0, leg.socAfterSailingMWh);
    const socDep = Math.max(0, leg.socAfterPortMWh);
    const dirMark = leg.direction === 'north' ? '▲' : '▼';
    const dirWord = leg.direction === 'north' ? 'northbound' : 'southbound';
    const short = leg.toPortName.substring(0, 3).toUpperCase();

    fullChartData.push({
      port: `${leg.toPortName}, arrival (${dirWord})`,
      portShort: `${short}${dirMark}↓`,
      soc: socArr,
      index: leg.voyageIndex + 0.5,
      belowReserve: socArr < reserveFloor,
    });

    fullChartData.push({
      port: `${leg.toPortName}, departure (${dirWord})`,
      portShort: `${short}${dirMark}↑`,
      soc: socDep,
      index: leg.voyageIndex + 1,
      belowReserve: socDep < reserveFloor,
    });
  }

  // The ICE option has no battery, so a state-of-charge trace would be
  // meaningless. Chart cumulative fuel burn against the same voyage axis.
  const fuelChartData = [
    { port: `${startName} (Departure)`, portShort: startName.substring(0, 3).toUpperCase(), fuel: 0, energy: 0, index: 0 },
    ...simResult.legs.map((leg) => ({
      port: `${leg.toPortName} (${leg.direction === 'north' ? 'northbound' : 'southbound'})`,
      portShort: `${leg.toPortName.substring(0, 3).toUpperCase()}${leg.direction === 'north' ? '\u25b2' : '\u25bc'}`,
      fuel: leg.cumulativeFuelTonnes,
      energy: leg.cumulativeEnergyMWh,
      index: leg.voyageIndex + 1,
    })),
  ];

  // Per-call energy ledger: what the leg into this port cost, against what the
  // port could actually put back. Every field here was already computed in
  // simulate() and stored on the leg — none of it was rendered anywhere.
  const callData: CallDatum[] = simResult.legs.map((leg) => ({
    portShort: `${leg.toPortName.substring(0, 3).toUpperCase()}${leg.direction === 'north' ? '▲' : '▼'}`,
    portFull: `${leg.fromPortName} → ${leg.toPortName} (${leg.direction === 'north' ? 'northbound' : 'southbound'})`,
    demand: -leg.legEnergyMWh,
    charged: leg.chargeGainedMWh,
    gridLoss: Math.max(0, leg.chargeGainedRawMWh - leg.chargeGainedMWh),
    throttled: leg.isGridThrottled,
    deliveredMW: leg.effectiveChargePowerMW,
    ratedMW: config.chargePowerMW,
    chargingMinutes: leg.effectiveChargingMinutes,
    ccSharePercent: leg.ccCvPhaseSplit * 100,
    net: leg.chargeGainedMWh - leg.legEnergyMWh,
  }));

  const throttledCalls = callData.filter((c) => c.throttled).length;
  const deficitCalls = callData.filter((c) => c.net < 0).length;

  // Determine how many data points to show based on playback state
  const isAnimating = playback.isPlaying || (playback.hasPlayedOnce && playback.graphProgress < 1);
  const totalPoints = fullChartData.length;

  let visibleCount: number;
  if (isAnimating) {
    // During playback: show points proportional to graph progress
    const gp = playback.graphProgress ?? 0;
    // +1 because we always show at least the starting port
    visibleCount = Math.max(1, Math.min(totalPoints, Math.floor(gp * (totalPoints - 1)) + 1 + 1));
  } else if (playback.hasPlayedOnce && playback.graphProgress >= 1) {
    // Playback finished — show all
    visibleCount = totalPoints;
  } else {
    // Never played — show all data immediately (instant feedback mode)
    visibleCount = totalPoints;
  }

  const chartData = fullChartData.slice(0, visibleCount);

  // Compute the current-leg visible stats (during playback, show partial stats)
  const visibleLegs = simResult.legs.slice(0, Math.max(0, visibleCount - 1));
  const visibleWorstMargin = visibleLegs.length > 0
    ? Math.min(...visibleLegs.map(l => l.marginPercent))
    : 100;
  const visibleDeadZones = visibleLegs.filter(l => l.isDeadZone).length;
  const visibleSlip = visibleLegs.reduce((s, l) => s + l.scheduleSlipMinutes, 0);
  const visibleThrottled = visibleLegs.filter(l => l.isGridThrottled).length;

  // Use visible stats during animation, full stats otherwise
  const showingAnimatedStats = isAnimating;
  const worstMargin = showingAnimatedStats ? visibleWorstMargin : simResult.worstMarginPercent;
  const deadZones = showingAnimatedStats ? visibleDeadZones : simResult.deadZoneCount;
  const scheduleSlip = showingAnimatedStats ? visibleSlip : simResult.totalScheduleSlipMinutes;
  const gridThrottled = showingAnimatedStats ? visibleThrottled : simResult.gridThrottledPortCount;

  // Custom gradient-colored line via SVG defs
  const gradientId = 'socGradient';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-4 sm:p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--cyan)' }} />
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
          {isIce ? 'Fuel and schedule' : 'State of charge'}
        </h3>
        {isAnimating && (
          <span className="ml-auto text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase flex items-center gap-1.5" style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--cyan)',
            background: 'rgba(56, 217, 200, 0.08)',
            border: '1px solid rgba(56, 217, 200, 0.15)',
          }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--cyan)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            LIVE
          </span>
        )}
      </div>

      {isIce ? (
        <div className="w-full mb-5 min-w-0 overflow-hidden" style={{ height: 224 }}>
          <ResponsiveContainer width="100%" height={224} minWidth={0}>
            <ComposedChart data={fuelChartData.slice(0, visibleCount)} margin={{ top: 14, right: 16, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="fuelAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--amber)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis
                dataKey="portShort"
                tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                interval="preserveStartEnd"
                minTickGap={18}
                axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
                tickLine={false}
                width={52}
                unit=" t"
              />
              <Tooltip content={<FuelTooltip />} />
              <Area
                type="monotone"
                dataKey="fuel"
                fill="url(#fuelAreaGrad)"
                stroke="var(--amber)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={isAnimating}
                animationDuration={400}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* SoC chart — arrival and departure state of charge at every call */
        <div className="w-full mb-5 min-w-0 overflow-hidden" style={{ height: 224 }}>
        <ResponsiveContainer width="100%" height={224} minWidth={0}>
          <ComposedChart data={chartData} margin={{ top: 14, right: 16, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green)" stopOpacity={1}/>
                <stop offset="50%" stopColor="var(--cyan)" stopOpacity={1}/>
                <stop offset="85%" stopColor="var(--amber)" stopOpacity={1}/>
                <stop offset="100%" stopColor="var(--red)" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="socAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.12}/>
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis
              dataKey="portShort"
              tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              interval="preserveStartEnd"
              minTickGap={18}
              axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
              tickLine={false}
              domain={[0, (config.batteryMWh as number) + 5]}
              width={84}
              unit=" MWh"
            />
            <Tooltip content={<SocTooltip reserveFloor={reserveFloor} batteryMWh={config.batteryMWh} />} />
            <ReferenceLine
              y={reserveFloor}
              stroke="var(--red)"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              strokeOpacity={0.7}
              label={{ value: `Reserve ${config.reservePercent}%`, position: 'insideBottomRight', fill: 'var(--red)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            />
            <Area
              type="monotone"
              dataKey="soc"
              fill="url(#socAreaGrad)"
              stroke="none"
              isAnimationActive={isAnimating}
              animationDuration={400}
            />
            <Area
              type="monotone"
              dataKey="soc"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={3}
              isAnimationActive={isAnimating}
              animationDuration={400}
              dot={(props: unknown) => {
                const { cx, cy, payload } = props as {
                  cx: number; cy: number; payload: { soc: number; index: number };
                };
                const below = payload.soc < reserveFloor;
                const isLastPoint = isAnimating && payload.index === chartData[chartData.length - 1]?.index;
                return (
                  <g key={payload.index}>
                    {below && <circle cx={cx} cy={cy} r={7} fill="var(--red)" opacity={0.15} />}
                    {isLastPoint && (
                      <circle cx={cx} cy={cy} r={8} fill="var(--cyan)" opacity={0.15}>
                        <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.15;0.05;0.15" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={below ? 4.5 : isLastPoint ? 4 : 3}
                      fill={below ? 'var(--red)' : 'var(--cyan)'}
                      stroke={below ? 'var(--red)' : isLastPoint ? 'var(--cyan)' : 'none'}
                      strokeWidth={below ? 2 : isLastPoint ? 2 : 0}
                      opacity={below ? 1 : 0.8}
                    />
                  </g>
                );
              }}
              activeDot={{ r: 6, fill: 'var(--cyan)', stroke: 'var(--navy)', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      )}

      {/* Stat tiles — update progressively during playback */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {isIce ? (
          <>
            <StatTile icon={<Fuel size={16} />} label="MGO Burned" value={simResult.totalFuelTonnes.toFixed(1)} unit="t" />
            <StatTile icon={<Scale size={16} />} label="Energy" value={simResult.totalEnergyMWh.toFixed(0)} unit="MWh" />
            <StatTile
              icon={<Clock size={16} />}
              label="Vs Timetable"
              value={`${simResult.scheduleDeviationHours >= 0 ? '+' : ''}${simResult.scheduleDeviationHours.toFixed(1)}`}
              unit="h"
              alert={!simResult.onSchedule}
            />
            <StatTile icon={<TrendingDown size={16} />} label="Sailing" value={simResult.totalSailingHours.toFixed(0)} unit="h" />
          </>
        ) : (
          <>
            <StatTile
              icon={<TrendingDown size={16} />}
              label="Worst Margin"
              value={!Number.isFinite(worstMargin) || (worstMargin === 100 && isAnimating) ? '—' : worstMargin.toFixed(1)}
              unit="%"
              alert={worstMargin < 0}
            />
            <StatTile
              icon={<AlertTriangle size={16} />}
              label="Dead Zones"
              value={deadZones}
              alert={deadZones > 0}
            />
            <StatTile
              icon={<Clock size={16} />}
              label="Vs Timetable"
              value={`${simResult.scheduleDeviationHours >= 0 ? '+' : ''}${simResult.scheduleDeviationHours.toFixed(1)}`}
              unit="h"
              alert={!simResult.onSchedule}
            />
            <StatTile
              icon={<Plug size={16} />}
              label="Grid Throttled"
              value={gridThrottled}
              alert={gridThrottled > 3}
            />
          </>
        )}
      </div>

      {/* ═══ Per-call energy ledger — where the network actually fails ═══ */}
      {!isIce && (
        <div className="pt-5 mt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
          <SectionLabel icon={<BatteryCharging size={14} />}>
            Energy in vs out, per call
          </SectionLabel>

          <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
            Below the line: energy the leg consumed. Above: energy the port put back.
            {deficitCalls > 0 && (
              <> <strong>{deficitCalls}</strong> of {callData.length} calls end with less than they
                took.</>
            )}
            {throttledCalls > 0 && (
              <> <strong>{throttledCalls}</strong> limited by the local grid, not the connector.</>
            )}
          </p>

          <div className="w-full min-w-0 overflow-hidden" style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height={210} minWidth={0}>
              <ComposedChart data={callData} margin={{ top: 14, right: 16, left: 0, bottom: 5 }} barGap={0}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="portShort"
                  tick={axisTick}
                  axisLine={axisLine}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={18}
                />
                <YAxis
                  tick={axisTick}
                  axisLine={axisLine}
                  tickLine={false}
                  width={84}
                  tickFormatter={(v: number) => `${Math.abs(v).toFixed(0)}`}
                  unit=" MWh"
                />
                <Tooltip content={<CallTooltip />} cursor={{ fill: 'var(--glass)' }} />
                <ReferenceLine y={0} stroke="var(--chart-neutral)" strokeWidth={1.5} />
                <Bar dataKey="demand" radius={[0, 0, 2, 2]} fill={SERIES.demand} isAnimationActive={false} />
                <Bar dataKey="charged" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {callData.map((c, i) => (
                    // Grid-throttled calls take the warm pole — this is a status,
                    // not a third series, and it always ships with the count in
                    // the text above and a flag in the table view.
                    <Cell key={i} fill={c.throttled ? SERIES.warm : SERIES.ev} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <ChartLegend
            items={[
              { label: 'Energy consumed on the leg', color: SERIES.demand },
              { label: 'Energy charged at the port', color: SERIES.ev },
              { label: 'Charging limited by local grid', color: SERIES.warm },
            ]}
          />

          <TableView
            caption="Per port call: energy consumed on the inbound leg against energy recharged"
            columns={['Call', 'Leg demand', 'Charged', 'Net', 'Power', 'Plugged in', 'Grid limited']}
            rows={callData.map((c) => [
              c.portFull,
              `${Math.abs(c.demand).toFixed(1)} MWh`,
              `${c.charged.toFixed(1)} MWh`,
              `${c.net >= 0 ? '+' : ''}${c.net.toFixed(1)} MWh`,
              c.charged > 0 ? `${c.deliveredMW.toFixed(1)}/${c.ratedMW} MW` : '—',
              c.charged > 0 ? `${c.chargingMinutes.toFixed(0)} min` : '—',
              c.throttled ? 'yes' : 'no',
            ])}
          />
        </div>
      )}

      {/* Energy balance — the check no amount of charger reshuffling can pass */}
      {!isIce && (
        <div
          className="mt-3 rounded-xl px-4 py-3"
          style={{
            background: energyShort ? 'var(--red-dim)' : 'var(--glass-strong)',
            border: `1px solid ${energyShort ? 'rgba(239,68,68,0.15)' : 'var(--card-border)'}`,
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              Energy Balance
            </span>
            <span className="text-[11px] font-bold" style={{ fontFamily: 'var(--font-mono)', color: energyShort ? 'var(--red)' : 'var(--green)' }}>
              {energyShort ? '' : '+'}{simResult.energyBalanceMWh.toFixed(0)} MWh
            </span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
            <strong>{simResult.chargingWindowHours.toFixed(1)} h</strong> plugged in across{' '}
            {simResult.chargingPortCount} charger{simResult.chargingPortCount === 1 ? '' : 's'}. At{' '}
            {config.chargePowerMW} MW that is at most{' '}
            <strong>{simResult.chargingCapacityMWh.toFixed(0)} MWh</strong>, against{' '}
            <strong>{simResult.totalGridEnergyMWh.toFixed(0)} MWh</strong> of demand.
            {energyShort
              ? ' Charger placement cannot close this. The dwell times, the connector rating or the ship have to change.'
              : ' Enough in aggregate.'}
            {scheduleSlip > 1 && (
              <> Holding the reserve everywhere needs <strong>{Math.round(scheduleSlip)} extra minutes</strong> of dwell.</>
            )}
          </p>
        </div>
      )}
    </motion.div>
  );
}
