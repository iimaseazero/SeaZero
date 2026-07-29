'use client';

import { useSimStore } from '@/store/useSimStore';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Area, ComposedChart
} from 'recharts';
import { TrendingDown, AlertTriangle, Clock, Plug } from 'lucide-react';

function StatTile({ label, value, unit, alert, icon }: { label: string; value: string | number; unit?: string; alert?: boolean; icon?: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-center px-4 py-3.5 rounded-xl"
      style={{
        background: alert ? 'var(--red-dim)' : 'var(--glass-strong)',
        border: `1px solid ${alert ? 'rgba(239,68,68,0.15)' : 'var(--card-border)'}`,
      }}
    >
      <span className="text-[11px] uppercase tracking-wider font-medium mb-1.5 flex items-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
        {icon && <span className="mr-1.5 flex items-center justify-center text-cyan-400 opacity-80">{icon}</span>}{label}
      </span>
      <span className={`text-2xl font-bold ${alert ? 'text-[var(--red)]' : 'text-[var(--text-primary)]'}`} style={{ fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
        {value}
        {unit && <span className="text-sm ml-1 font-normal" style={{ color: 'var(--text-secondary)' }}>{unit}</span>}
      </span>
    </div>
  );
}

export default function OperationalCard() {
  const { simResult, config, playback, activePorts } = useSimStore();
  const reserveFloor = config.batteryMWh * (config.reservePercent / 100);

  // Build chart data: two points per port (Arrival before charging, Departure after charging)
  const fullChartData: { port: string; portShort: string; soc: number; index: number; belowReserve: boolean; isArr?: boolean; isDep?: boolean }[] = [
    { port: activePorts[0]?.name ?? 'Start', portShort: (activePorts[0]?.name ?? 'STR').substring(0, 3).toUpperCase(), soc: config.batteryMWh as number, index: 0, belowReserve: false, isDep: true },
  ];

  for (const leg of simResult.legs) {
    const socArr = Math.max(0, leg.socAfterSailingMWh);
    const socDep = Math.max(0, leg.socAfterPortMWh);
    
    // Arrival point (Lowest SoC before charging)
    fullChartData.push({
      port: leg.toPortName + ' (Arr)',
      portShort: leg.toPortName.substring(0, 3).toUpperCase() + '↓',
      soc: socArr,
      index: leg.legIndex + 0.5,
      belowReserve: socArr < reserveFloor,
      isArr: true
    });
    
    // Departure point (Highest SoC after charging)
    fullChartData.push({
      port: leg.toPortName + ' (Dep)',
      portShort: leg.toPortName.substring(0, 3).toUpperCase() + '↑',
      soc: socDep,
      index: leg.legIndex + 1,
      belowReserve: socDep < reserveFloor,
      isDep: true
    });
  }

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl px-4 py-3 text-xs" style={{
          background: 'rgba(14, 26, 43, 0.92)',
          border: '1px solid var(--card-border)',
          fontFamily: 'var(--font-mono)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{data.port}</p>
          <p style={{ color: data.soc < reserveFloor ? 'var(--red)' : 'var(--cyan)' }}>
            SoC: {data.soc.toFixed(1)} MWh ({((data.soc / config.batteryMWh) * 100).toFixed(0)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom gradient-colored line via SVG defs
  const gradientId = 'socGradient';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--cyan)' }} />
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
          Operational — State of Charge
        </h3>
        {isAnimating && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase flex items-center gap-1.5" style={{
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

      {/* SoC Chart — taller with gradient line */}
      <div className="w-full mb-5 min-w-0 overflow-hidden" style={{ height: 224 }}>
        <ResponsiveContainer width="100%" height={224} minWidth={0}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -5, bottom: 5 }}>
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
              interval="equidistantPreserveStart"
              axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
              tickLine={false}
              domain={[0, (config.batteryMWh as number) + 5]}
              unit=" MWh"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={reserveFloor}
              stroke="var(--red)"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              strokeOpacity={0.7}
              label={{ value: `Reserve ${config.reservePercent}%`, position: 'right', fill: 'var(--red)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
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
              dot={(props: any) => {
                const { cx, cy, payload } = props;
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

      {/* Stat tiles — update progressively during playback */}
      <div className="grid grid-cols-4 gap-3">
        <StatTile
          icon={<TrendingDown size={16} />}
          label="Worst Margin"
          value={worstMargin === Infinity || worstMargin === 100 && isAnimating ? '—' : worstMargin.toFixed(1)}
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
          label="Schedule Slip"
          value={Math.round(scheduleSlip)}
          unit="min"
          alert={scheduleSlip > 30}
        />
        <StatTile
          icon={<Plug size={16} />}
          label="Grid Throttled"
          value={gridThrottled}
          alert={gridThrottled > 3}
        />
      </div>
    </motion.div>
  );
}
