'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import ConfigPanel from '@/components/config/ConfigPanel';
import VerdictBanner from '@/components/VerdictBanner';
import OperationalCard from '@/components/cards/OperationalCard';
import FinancialCard from '@/components/cards/FinancialCard';
import EnvironmentalCard from '@/components/cards/EnvironmentalCard';
import HoverTag from '@/components/HoverTag';
import { useSimStore } from '@/store/useSimStore';

// Dynamic import for Leaflet (needs browser APIs)
const RouteMap = dynamic(() => import('@/components/map/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center rounded-2xl glass-card">
      <div className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
        Loading map...
      </div>
    </div>
  ),
});

function IssuesBadge() {
  const { simResult } = useSimStore();
  const issues = simResult.deadZoneCount + simResult.gridThrottledPortCount;
  if (issues === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{
        background: 'var(--red-dim)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
      }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: 'var(--red)', animation: 'shimmer 2s ease-in-out infinite' }}
      />
      <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>
        {issues}
      </span>
    </motion.div>
  );
}

export default function Home() {
  const { routeName, activePorts, simResult } = useSimStore();
  const totalDistance = Math.round(simResult.totalDistanceKm);

  return (
    <main className="h-screen flex flex-col overflow-hidden relative">
      {/* ─── Top header bar ─── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-3.5 relative z-10"
        style={{
          background: 'var(--background)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center gap-4">
          {/* Logo mark */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                background: 'var(--cyan)',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L13 12H3L8 2Z" fill="white" opacity="0.9"/>
                  <path d="M4 13H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide uppercase leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
                Sea Zero
              </h1>
              <span className="text-[11px] font-medium" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
                Coastal Route Electrification Simulator
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg" style={{ background: 'var(--glass-strong)', border: '1px solid var(--border)' }}>
            <span className="text-[11px] font-medium tracking-wide" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
              {routeName}
            </span>
            <span className="w-px h-3" style={{ background: 'var(--border)' }} />
            <span className="text-[11px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {totalDistance.toLocaleString()} km
            </span>
            <span className="w-px h-3" style={{ background: 'var(--border)' }} />
            <span className="text-[11px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {activePorts.length} ports
            </span>
          </div>
          <IssuesBadge />
        </div>
      </motion.header>

      {/* ─── Three-column layout ─── */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* LEFT — Config Panel (streamlined) */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-[260px] flex-shrink-0 overflow-hidden"
          style={{
            background: 'var(--background)',
            borderRight: '1px solid var(--border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <HoverTag tag="Config Panel" position="top-right" className="h-full">
            <ConfigPanel />
          </HoverTag>
        </motion.aside>

        {/* CENTER — Analytics (more padding, breathing room) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
          style={{ minWidth: 0 }}
        >
          <HoverTag tag="Feasibility Verdict">
            <VerdictBanner />
          </HoverTag>
          <HoverTag tag="SoC Operational View">
            <OperationalCard />
          </HoverTag>
          <HoverTag tag="10-Year TCO Analysis">
            <FinancialCard />
          </HoverTag>
          <HoverTag tag="CO₂ Emissions Impact">
            <EnvironmentalCard />
          </HoverTag>
        </motion.section>

        {/* RIGHT — Map */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="w-[440px] flex-shrink-0 p-4 flex flex-col"
          style={{
            background: 'var(--background)',
            borderLeft: '1px solid var(--border)',
          }}
        >
          <HoverTag tag="Route Map & Playback" position="top-right" className="flex-1 flex flex-col min-h-0">
            <RouteMap />
          </HoverTag>
        </motion.aside>
      </div>
    </main>
  );
}
