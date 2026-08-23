'use client';

// Sea Zero — where every team's bid sits on the cost/reliability trade-off.
//
// A ranked table answers "who won". It cannot answer "why", and it hides the
// thing the case is actually about: there is no single best bid, there is a
// frontier, and each team has chosen a different point on it.

import { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { Submission } from '@/store/persistence';
import { ScoreBreakdown } from '@/engine/scoring';
import {
  GRID_STROKE, axisTick, axisLine,
  TooltipShell, TooltipRow, TableView,
} from '@/components/charts/chartTheme';

interface Point {
  teamName: string;
  teamColor: string;
  /** x — worst-case 10-year TCO, $M. */
  costM: number;
  /** y — reliability points earned, 0–35. */
  reliability: number;
  totalScore: number;
  climate: number;
  service: number;
  baseFeasible: boolean;
  stressSurvived: string;
  vesselType: string;
}

/** Older submissions may predate the score rewrite; treat them as unscored. */
function isCurrentBreakdown(b: unknown): b is ScoreBreakdown {
  return !!b && typeof b === 'object' && 'reliability' in b && 'worstCaseTCO' in b;
}

function ParetoTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <TooltipShell
      title={d.teamName}
      subtitle={d.baseFeasible ? undefined : 'Base case does not complete the voyage'}
    >
      <TooltipRow label="Bid score" value={`${d.totalScore.toFixed(0)} / 100`} swatch={d.teamColor} />
      <TooltipRow label="Worst-case TCO" value={`$${d.costM.toFixed(0)}M`} />
      <TooltipRow label="Reliability" value={`${d.reliability.toFixed(1)} / 35`} />
      <TooltipRow label="Stresses survived" value={d.stressSurvived} />
      <TooltipRow label="Climate" value={`${d.climate.toFixed(1)} / 20`} />
      <TooltipRow label="Service" value={`${d.service.toFixed(1)} / 10`} />
      <TooltipRow label="Vessel" value={d.vesselType === 'ev' ? 'Battery' : 'Conventional'} />
    </TooltipShell>
  );
}

export default function ParetoChart({ submissions }: { submissions: Submission[] }) {
  const points = useMemo<Point[]>(
    () =>
      submissions
        .filter((s) => isCurrentBreakdown(s.breakdown))
        .map((s) => {
          const b = s.breakdown as ScoreBreakdown;
          return {
            teamName: s.teamName,
            teamColor: s.teamColor,
            costM: b.worstCaseTCO / 1_000_000,
            reliability: b.reliability,
            totalScore: b.totalScore,
            climate: b.climate,
            service: b.service,
            baseFeasible: b.baseFeasible,
            stressSurvived: `${b.operationalPassed}/${b.operationalTotal}`,
            vesselType: b.vesselType,
          };
        }),
    [submissions],
  );

  if (points.length === 0) {
    return (
      <p
        className="text-[11px] py-6 text-center"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
      >
        No scored bids yet.
      </p>
    );
  }

  // The Pareto set: no other bid is both cheaper AND more reliable.
  const frontier = points.filter(
    (p) => !points.some((q) => q !== p && q.costM <= p.costM && q.reliability >= p.reliability
      && (q.costM < p.costM || q.reliability > p.reliability)),
  );
  const frontierNames = new Set(frontier.map((f) => f.teamName));

  const bestScore = points.reduce((a, b) => (b.totalScore > a.totalScore ? b : a));

  return (
    <div>
      <p
        className="text-[11px] leading-relaxed mb-3"
        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
      >
        Cheaper is left, more robust is up. Rings mark the{' '}
        <strong>{frontier.length}</strong> bid{frontier.length === 1 ? '' : 's'} no one has beaten on
        both cost and reliability.
      </p>

      <div className="w-full min-w-0 overflow-hidden" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height={280} minWidth={0}>
          <ScatterChart margin={{ top: 12, right: 20, left: 4, bottom: 20 }}>
            <CartesianGrid stroke={GRID_STROKE} />
            <XAxis
              type="number"
              dataKey="costM"
              name="Worst-case TCO"
              domain={['dataMin - 15', 'dataMax + 15']}
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(0)}M`}
              label={{
                value: 'Worst-case 10-year TCO (cheaper is better →)',
                position: 'insideBottom',
                offset: -12,
                fill: 'var(--text-muted)',
                fontSize: 10,
                fontFamily: 'var(--font-display)',
              }}
              reversed
            />
            <YAxis
              type="number"
              dataKey="reliability"
              name="Reliability"
              domain={[0, 35]}
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              width={40}
              label={{
                value: 'Reliability',
                angle: -90,
                position: 'insideLeft',
                offset: 14,
                fill: 'var(--text-muted)',
                fontSize: 10,
                fontFamily: 'var(--font-display)',
              }}
            />
            {/* ~22px diameter — a pinpoint dot you have to land on dead centre
                is the classic scatter interaction failure. */}
            <ZAxis range={[400, 400]} />
            <Tooltip content={<ParetoTooltip />} cursor={{ strokeDasharray: '0', stroke: GRID_STROKE }} />
            <ReferenceLine
              y={15}
              stroke="var(--chart-neutral)"
              strokeWidth={1}
              label={{
                value: 'base case sails',
                position: 'insideTopLeft',
                fill: 'var(--text-muted)',
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
              }}
            />
            <Scatter data={points} isAnimationActive={false}>
              {points.map((p) => (
                <Cell
                  key={p.teamName}
                  fill={p.teamColor}
                  // Ring = on the frontier. Secondary encoding, so the story
                  // never rests on team colour alone.
                  stroke={frontierNames.has(p.teamName) ? 'var(--text-primary)' : 'var(--card-bg)'}
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <p
        className="text-[10px] mt-1"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
      >
        Top score: <strong>{bestScore.teamName}</strong>, {bestScore.totalScore.toFixed(0)}/100.
      </p>

      <TableView
        caption="Every submitted bid by worst-case cost and reliability"
        columns={['Team', 'Score', 'Worst-case TCO', 'Reliability', 'Stresses', 'Climate', 'Service', 'Frontier']}
        rows={[...points]
          .sort((a, b) => b.totalScore - a.totalScore)
          .map((p) => [
            p.teamName,
            p.totalScore.toFixed(0),
            `$${p.costM.toFixed(0)}M`,
            `${p.reliability.toFixed(1)}`,
            p.stressSurvived,
            `${p.climate.toFixed(1)}`,
            `${p.service.toFixed(1)}`,
            frontierNames.has(p.teamName) ? 'yes' : 'no',
          ])}
      />
    </div>
  );
}
