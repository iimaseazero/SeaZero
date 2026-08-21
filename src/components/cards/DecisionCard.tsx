'use client';

import { useMemo, useDeferredValue, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot,
} from 'recharts';
import { Grid3x3, PlugZap } from 'lucide-react';
import { useSimStore } from '@/store/useSimStore';
import {
  computeFrontier, computeChargerBuildUp, FrontierCell, BuildUpStep,
} from '@/engine/sensitivity';
import {
  SERIES, GRID_STROKE, axisTick, axisLine,
  TooltipShell, TooltipRow, SectionLabel, TableView, formatMoney,
} from '@/components/charts/chartTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Diverging scale for the frontier
//
// The midpoint is not an arbitrary middle: margin = 0 IS the reserve floor,
// the line between a voyage that holds its reserve and one that does not. So
// the neutral band straddles zero and the two poles read as opposite states.
//
// Intensity is carried by alpha over the card surface rather than by picking
// lighter/darker hex steps, because the card surface flips between themes and
// a fixed light-to-dark ramp would inverte its reading in dark mode.
// ─────────────────────────────────────────────────────────────────────────────

const WARM = '234, 88, 12';    // orange-600, matches --chart-warm
const COOL = '8, 145, 178';    // cyan-600,  matches --chart-ev
const NEUTRAL = '113, 113, 122';

interface ScaleClass {
  label: string;
  test: (m: number) => boolean;
  fill: string;
}

const SCALE: ScaleClass[] = [
  { label: '< −15%', test: (m) => m < -15, fill: `rgba(${WARM}, 0.85)` },
  { label: '−15 to −5%', test: (m) => m < -5, fill: `rgba(${WARM}, 0.55)` },
  { label: '−5 to −2%', test: (m) => m < -2, fill: `rgba(${WARM}, 0.28)` },
  { label: '−2 to +2%', test: (m) => m <= 2, fill: `rgba(${NEUTRAL}, 0.38)` },
  { label: '+2 to +8%', test: (m) => m <= 8, fill: `rgba(${COOL}, 0.28)` },
  { label: '+8 to +20%', test: (m) => m <= 20, fill: `rgba(${COOL}, 0.55)` },
  { label: '> +20%', test: () => true, fill: `rgba(${COOL}, 0.85)` },
];

function fillFor(marginPercent: number): string {
  return (SCALE.find((c) => c.test(marginPercent)) ?? SCALE[SCALE.length - 1]).fill;
}

// ─────────────────────────────────────────────────────────────────────────────

function BuildUpTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: { payload: BuildUpStep }[];
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <TooltipShell
      title={`${d.chargerCount} charger${d.chargerCount === 1 ? '' : 's'}`}
      subtitle={d.addedPortName ? `Added: ${d.addedPortName}` : undefined}
    >
      <TooltipRow label="Worst SoC margin" value={`${d.worstMarginPercent.toFixed(1)}%`} swatch={SERIES.ev} />
      <TooltipRow label="Gained by this one" value={`${d.marginalGain >= 0 ? '+' : ''}${d.marginalGain.toFixed(1)} pts`} />
      <TooltipRow label="Dead zones" value={`${d.deadZoneCount}`} />
      <TooltipRow label="Shore capex" value={formatMoney(d.infraCapex)} />
      <TooltipRow label="Voyage completes" value={d.feasible ? 'yes' : 'no'} />
    </TooltipShell>
  );
}

export default function DecisionCard() {
  const { config, activePorts, activeLegs } = useSimStore();
  const [hovered, setHovered] = useState<FrontierCell | null>(null);

  const deferredConfig = useDeferredValue(config);
  const isStale = deferredConfig !== config;

  // ~72 pipeline passes, about 40 ms.
  const frontier = useMemo(
    () => computeFrontier(deferredConfig, activePorts, activeLegs),
    [deferredConfig, activePorts, activeLegs],
  );

  // ~600 pipeline passes, about 300 ms — the reason this whole card is deferred.
  const buildUp = useMemo(
    () => computeChargerBuildUp(deferredConfig, activePorts, activeLegs),
    [deferredConfig, activePorts, activeLegs],
  );

  const cellAt = (batteryMWh: number, chargePowerMW: number) =>
    frontier.cells.find((c) => c.batteryMWh === batteryMWh && c.chargePowerMW === chargePowerMW);

  const firstFeasible = buildUp.find((s) => s.feasible) ?? null;
  const currentChargers = config.portConfigs.filter((p) => p.hasCharger).length;

  // Only label the point that carries the story, never every point.
  const knee = useMemo(() => {
    if (buildUp.length < 3) return null;
    // The last step that still bought more than a point of margin.
    let last = buildUp[1] ?? null;
    for (const step of buildUp.slice(1)) {
      if (step.marginalGain > 1) last = step;
    }
    return last;
  }, [buildUp]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="glass-card p-4 sm:p-6"
      style={{ opacity: isStale ? 0.72 : 1, transition: 'opacity 160ms ease' }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--chart-ev)' }} />
        <h3
          className="text-xs sm:text-sm font-semibold uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          Decision Surface — Felin’s Two Questions
        </h3>
      </div>

      {/* ═══ 1. Feasibility frontier ═══ */}
      <SectionLabel icon={<Grid3x3 size={14} />}>
        Battery size vs connector rating
      </SectionLabel>

      <p
        className="text-[11px] leading-relaxed mb-3"
        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
      >
        Every cell is a full voyage simulation on your current charger network, always run as a
        battery vessel — this is the “if we went electric, what would it take?” question, so it stays
        answerable while you are looking at the conventional option. Colour is the worst
        state-of-charge margin the ship reaches; the neutral band is the reserve floor itself, so
        anything warm strands the vessel.
        {frontier.cheapestFeasible ? (
          <> The cheapest combination that completes the voyage is{' '}
            <strong>
              {frontier.cheapestFeasible.batteryMWh} MWh at {frontier.cheapestFeasible.chargePowerMW} MW
            </strong>{' '}
            ({formatMoney(frontier.cheapestFeasible.evTotalTCO)} 10-year TCO).
          </>
        ) : (
          <> No combination on this grid completes the voyage — the charger network itself has to change.</>
        )}
      </p>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="inline-block min-w-full">
          {/* Grid: one row per battery size, one column per connector rating */}
          <div className="flex">
            <div
              className="flex flex-col justify-center pr-2 text-[9px] uppercase tracking-wider"
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                height: frontier.batteryAxis.length * 30,
              }}
            >
              Battery (MWh)
            </div>

            <div>
              {[...frontier.batteryAxis].reverse().map((battery) => (
                <div key={battery} className="flex items-center" style={{ height: 30 }}>
                  <span
                    className="text-[10px] text-right pr-2 flex-shrink-0"
                    style={{
                      width: 32,
                      color: battery === frontier.currentBatteryMWh ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: battery === frontier.currentBatteryMWh ? 700 : 400,
                    }}
                  >
                    {battery}
                  </span>
                  {frontier.powerAxis.map((power) => {
                    const cell = cellAt(battery, power);
                    if (!cell) return null;
                    const isCurrent =
                      battery === frontier.currentBatteryMWh && power === frontier.currentChargePowerMW;
                    const isCheapest =
                      frontier.cheapestFeasible?.batteryMWh === battery &&
                      frontier.cheapestFeasible?.chargePowerMW === power;
                    return (
                      <button
                        key={power}
                        type="button"
                        onMouseEnter={() => setHovered(cell)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(cell)}
                        onBlur={() => setHovered(null)}
                        aria-label={`${battery} MWh at ${power} MW: worst margin ${cell.worstMarginPercent.toFixed(1)} percent, ${cell.feasible ? 'completes' : 'does not complete'}`}
                        className="relative flex-1 focus:outline-none"
                        style={{
                          height: 26,
                          minWidth: 30,
                          // 2px surface gap between fills, never a border
                          margin: 2,
                          background: fillFor(cell.worstMarginPercent),
                          borderRadius: 3,
                          boxShadow: isCurrent
                            ? '0 0 0 2px var(--card-bg), 0 0 0 3.5px var(--text-primary)'
                            : isCheapest
                              ? '0 0 0 2px var(--card-bg), 0 0 0 3.5px var(--chart-good)'
                              : undefined,
                          cursor: 'pointer',
                        }}
                      />
                    );
                  })}
                </div>
              ))}

              {/* x axis */}
              <div className="flex items-center" style={{ height: 18 }}>
                <span className="flex-shrink-0" style={{ width: 32 }} />
                {frontier.powerAxis.map((power) => (
                  <span
                    key={power}
                    className="flex-1 text-center text-[10px]"
                    style={{
                      minWidth: 30,
                      margin: '0 2px',
                      color: power === frontier.currentChargePowerMW ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: power === frontier.currentChargePowerMW ? 700 : 400,
                    }}
                  >
                    {power}
                  </span>
                ))}
              </div>
              <div
                className="text-center text-[9px] uppercase tracking-wider mt-1"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
              >
                Shore connector rating (MW)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Readout — the hover value in text, so colour is never the only channel */}
      <div
        className="mt-3 rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1"
        style={{ background: 'var(--glass-strong)', border: '1px solid var(--card-border)', minHeight: 46 }}
      >
        {hovered ? (
          <>
            <span className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {hovered.batteryMWh} MWh · {hovered.chargePowerMW} MW
            </span>
            <span className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              worst margin {hovered.worstMarginPercent.toFixed(1)}%
            </span>
            <span className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {hovered.deadZoneCount} dead zone{hovered.deadZoneCount === 1 ? '' : 's'}
            </span>
            <span className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {formatMoney(hovered.evTotalTCO)} TCO
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold"
              style={{
                fontFamily: 'var(--font-display)',
                color: hovered.feasible ? 'var(--chart-good)' : 'var(--chart-warm)',
                background: hovered.feasible ? 'rgba(5,150,105,0.12)' : 'rgba(234,88,12,0.12)',
              }}
            >
              {hovered.feasible ? 'completes' : 'strands'}
            </span>
          </>
        ) : (
          <span className="text-[11px]" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
            Hover a cell to read its numbers. White ring = your current setting, green ring = cheapest that completes.
          </span>
        )}
      </div>

      {/* Scale legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5">
        <span
          className="text-[9px] uppercase tracking-wider"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
        >
          Worst SoC margin
        </span>
        {SCALE.map((c) => (
          <span key={c.label} className="flex items-center gap-1">
            <span
              className="inline-block flex-shrink-0"
              style={{ width: 12, height: 8, background: c.fill, borderRadius: 2 }}
            />
            <span className="text-[9px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {c.label}
            </span>
          </span>
        ))}
      </div>

      <TableView
        caption="Feasibility frontier: worst state-of-charge margin by battery size and connector rating"
        columns={['Battery (MWh)', ...frontier.powerAxis.map((p) => `${p} MW`)]}
        rows={[...frontier.batteryAxis].reverse().map((battery) => [
          `${battery}`,
          ...frontier.powerAxis.map((power) => {
            const c = cellAt(battery, power);
            return c ? `${c.worstMarginPercent.toFixed(1)}%${c.feasible ? '' : ' ✕'}` : '—';
          }),
        ])}
      />

      {/* ═══ 2. Charger build-up ═══ */}
      <div className="pt-5 mt-5" style={{ borderTop: '1px solid var(--card-border)' }}>
        <SectionLabel icon={<PlugZap size={14} />}>
          Marginal value of the Nth charger
        </SectionLabel>

        <p
          className="text-[11px] leading-relaxed mb-3"
          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
        >
          Chargers added greedily — at each step, whichever remaining port buys the most margin.
          {firstFeasible ? (
            <> The voyage first completes at <strong>{firstFeasible.chargerCount} chargers</strong>{' '}
              ({formatMoney(firstFeasible.infraCapex)} of shore investment).</>
          ) : (
            <> No number of chargers makes this configuration complete the voyage — the constraint is
              the battery, the connector or the timetable, not the network.</>
          )}
          {knee && knee.chargerCount < buildUp.length && (
            <> Past <strong>{knee.chargerCount}</strong>, each further charger buys under a point of
              margin.</>
          )}
          {' '}You currently have {currentChargers}.
        </p>

        <div className="w-full min-w-0 overflow-hidden" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height={220} minWidth={0}>
            <LineChart data={buildUp} margin={{ top: 10, right: 20, left: -6, bottom: 18 }}>
              <CartesianGrid stroke={GRID_STROKE} />
              <XAxis
                dataKey="chargerCount"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={axisTick}
                axisLine={axisLine}
                tickLine={false}
                label={{
                  value: 'Ports with a charger',
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
                width={46}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<BuildUpTooltip />} />
              <ReferenceLine
                y={0}
                stroke="var(--chart-warm)"
                strokeWidth={1.5}
                label={{
                  value: 'reserve floor',
                  position: 'insideTopRight',
                  fill: 'var(--chart-warm)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <Line
                type="monotone"
                dataKey="worstMarginPercent"
                stroke={SERIES.ev}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {firstFeasible && (
                <ReferenceDot
                  x={firstFeasible.chargerCount}
                  y={firstFeasible.worstMarginPercent}
                  r={5}
                  fill={SERIES.good}
                  stroke="var(--card-bg)"
                  strokeWidth={2}
                  label={{
                    value: `first feasible: ${firstFeasible.chargerCount}`,
                    position: 'top',
                    fill: 'var(--text-secondary)',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <TableView
          caption="Greedy charger build-up order and the margin each port buys"
          columns={['#', 'Port added', 'Worst margin', 'Gain', 'Dead zones', 'Shore capex']}
          rows={buildUp.map((s) => [
            s.chargerCount,
            s.addedPortName ?? '—',
            `${s.worstMarginPercent.toFixed(1)}%`,
            `${s.marginalGain >= 0 ? '+' : ''}${s.marginalGain.toFixed(1)}`,
            s.deadZoneCount,
            formatMoney(s.infraCapex),
          ])}
        />
      </div>
    </motion.div>
  );
}
