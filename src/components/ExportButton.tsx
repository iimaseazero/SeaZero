'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2, Check } from 'lucide-react';
import { useSimStore } from '@/store/useSimStore';
import { downloadWorkbook } from '@/utils/exportWorkbook';

/**
 * Download the whole simulation as one .xlsx.
 *
 * The workbook re-runs the sensitivity, frontier, build-up and stress-panel
 * analyses — roughly 700 pipeline passes, around half a second of synchronous
 * work, plus a lazy fetch of the SheetJS chunk. `useTransition` would NOT help
 * here: React runs a transition callback synchronously, so the "Building…"
 * state would never get painted before the main thread locked up. Instead the
 * flag is set, and the work is handed to a later task so the browser gets one
 * frame to render it first.
 */
export default function ExportButton({ compact = false }: { compact?: boolean }) {
  const { config, simResult, economics, emissions, activePorts, activeLegs, routeName } = useSimStore();
  const [isPending, setIsPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    if (isPending) return;
    setError(null);
    setIsPending(true);

    // Two rAFs then a timeout: the first frame commits the pending render, the
    // second lets it paint, and only then do we block.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(async () => {
          try {
            await downloadWorkbook({
              config, simResult, economics, emissions,
              ports: activePorts, legs: activeLegs, routeName,
            });
            setDone(true);
            setTimeout(() => setDone(false), 2500);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Export failed');
            setTimeout(() => setError(null), 5000);
          } finally {
            setIsPending(false);
          }
        }, 0);
      });
    });
  };

  const label = error ? 'Export failed' : done ? 'Downloaded' : isPending ? 'Building…' : 'Export to Excel';
  const color = error ? 'var(--chart-warm)' : done ? 'var(--chart-good)' : 'var(--chart-ev)';

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      title={
        error
          ? error
          : 'Download the full model as a multi-sheet .xlsx'
      }
      className={`flex items-center justify-center gap-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all ${
        compact ? 'px-2.5 py-2 text-[10px]' : 'w-full px-3 py-2.5 text-[11px]'
      }`}
      style={{
        fontFamily: 'var(--font-display)',
        color,
        background: 'var(--glass-strong)',
        border: '1px solid var(--card-border)',
        cursor: isPending ? 'wait' : 'pointer',
        opacity: isPending ? 0.75 : 1,
      }}
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : done ? (
        <Check size={14} />
      ) : (
        <FileSpreadsheet size={14} />
      )}
      {compact ? <span className="hidden lg:inline">{label}</span> : label}
    </button>
  );
}
