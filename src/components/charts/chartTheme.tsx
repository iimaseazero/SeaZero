'use client';

// Sea Zero — shared chart chrome
//
// The cards were each re-declaring their own tooltip shell and axis props,
// which drifted. These are the single source of truth for chart chrome so
// every plot in the app reads as one system.
//
// Colours come from the --chart-* tokens in globals.css, NOT the --cyan /
// --red / --amber UI tokens. See the comment there: the UI tokens are the
// lighter 500 steps, which glow nicely on borders but fall outside the OKLCH
// lightness band for chart marks on a dark surface.

import React from 'react';

/** Series palette, in fixed assignment order. Never cycle past these. */
export const SERIES = {
  ev: 'var(--chart-ev)',
  ice: 'var(--chart-ice)',
  warm: 'var(--chart-warm)',
  demand: 'var(--chart-demand)',
  accent: 'var(--chart-accent)',
  good: 'var(--chart-good)',
  neutral: 'var(--chart-neutral)',
} as const;

/** Recessive hairline grid — solid, one shade off the surface. */
export const GRID_STROKE = 'var(--chart-grid)';

export const axisTick = {
  fontSize: 10,
  fill: 'var(--text-muted)',
  fontFamily: 'var(--font-mono)',
} as const;

export const axisLine = { stroke: 'var(--chart-grid)' } as const;

/** Glass tooltip shell shared by every chart. */
export function TooltipShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs max-w-[280px]"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        fontFamily: 'var(--font-mono)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <p
        className="font-semibold text-sm mb-1"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </p>
      {subtitle && (
        <p
          className="text-[10px] mb-2 leading-relaxed"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

/** One label/value line inside a tooltip. Text stays in ink, never series colour. */
export function TooltipRow({
  label,
  value,
  swatch,
}: {
  label: string;
  value: string;
  swatch?: string;
}) {
  return (
    <p className="flex justify-between gap-4 items-center leading-relaxed">
      <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
        {swatch && (
          <span
            className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
            style={{ background: swatch }}
          />
        )}
        {label}
      </span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </p>
  );
}

/**
 * Legend for >= 2 series. Always rendered — identity is never carried by
 * colour alone, so a colourblind reader still has the name next to the swatch.
 */
export function ChartLegend({
  items,
}: {
  items: { label: string; color: string; dashed?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span
            className="inline-block flex-shrink-0"
            style={{
              width: 12,
              height: item.dashed ? 0 : 8,
              borderTop: item.dashed ? `2px dashed ${item.color}` : undefined,
              background: item.dashed ? undefined : item.color,
              borderRadius: item.dashed ? 0 : 2,
            }}
          />
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
          >
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}

/** Card section heading, matching the existing card headers. */
export function SectionLabel({
  icon,
  children,
  right,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}
      >
        {children}
      </span>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  );
}

/** Compact money formatter shared across the new cards. */
export function formatMoney(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function formatMoneySigned(val: number): string {
  return `${val > 0 ? '+' : val < 0 ? '−' : ''}${formatMoney(Math.abs(val))}`;
}

/**
 * Table-view twin. Every chart here ships one: colour is never the only way to
 * read a value, and a screen reader gets real markup instead of SVG paths.
 */
export function TableView({
  columns,
  rows,
  caption,
}: {
  columns: string[];
  rows: (string | number)[][];
  caption: string;
}) {
  return (
    <details className="mt-2 group">
      <summary
        className="cursor-pointer text-[10px] uppercase tracking-wider select-none"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
      >
        Table view
      </summary>
      <div className="mt-2 overflow-x-auto rounded-lg" style={{ border: '1px solid var(--card-border)' }}>
        <table className="w-full text-[11px]" style={{ fontFamily: 'var(--font-mono)', borderCollapse: 'collapse' }}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="text-left px-3 py-1.5 font-semibold whitespace-nowrap"
                  style={{
                    color: 'var(--text-secondary)',
                    background: 'var(--glass)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--card-border)' }}>
                {r.map((cell, j) => (
                  <td
                    key={j}
                    className="px-3 py-1.5 whitespace-nowrap"
                    style={{
                      color: j === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
