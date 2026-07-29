'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import ConfigPanel from '@/components/config/ConfigPanel';
import VerdictBanner from '@/components/VerdictBanner';
import OperationalCard from '@/components/cards/OperationalCard';
import FinancialCard from '@/components/cards/FinancialCard';
import EnvironmentalCard from '@/components/cards/EnvironmentalCard';
import HoverTag from '@/components/HoverTag';
import { useSimStore } from '@/store/useSimStore';
import { BarChart3, Sliders, Map as MapIcon } from 'lucide-react';

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
        {issues} issue{issues === 1 ? '' : 's'}
      </span>
    </motion.div>
  );
}

export default function Home() {
  const { routeName, simResult } = useSimStore();
  const [mobileTab, setMobileTab] = useState<'analytics' | 'config' | 'map'>('analytics');
  const totalDistance = Math.round(simResult.totalDistanceKm);
  const isRoundtrip = simResult.voyageMode === 'roundtrip';

  return (
    <main className="min-h-screen lg:h-screen flex flex-col overflow-y-auto lg:overflow-hidden relative">
      {/* ─── Top header bar ─── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 relative z-10"
        style={{
          background: 'var(--background)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center gap-4">
          {/* Logo mark */}
          <div className="flex items-center gap-2.5">
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
              <h1 className="text-base sm:text-lg font-bold tracking-wide uppercase leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
                Sea Zero
              </h1>
              <span className="text-[10px] sm:text-[11px] font-medium" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
                Coastal Route Electrification Simulator
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-5">
          <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 rounded-lg" style={{ background: 'var(--glass-strong)', border: '1px solid var(--border)' }}>
            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide truncate max-w-[120px] sm:max-w-none" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
              {routeName}{isRoundtrip ? ' \u21c4' : ''}
            </span>
            <span className="w-px h-3" style={{ background: 'var(--border)' }} />
            <span className="text-[10px] sm:text-[11px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {totalDistance.toLocaleString()} km
            </span>
            <span className="w-px h-3" style={{ background: 'var(--border)' }} />
            <span className="text-[10px] sm:text-[11px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {simResult.portCallCount} calls
            </span>
          </div>
          <IssuesBadge />
        </div>
      </motion.header>

      {/* ─── Mobile View Switcher Tabs (< lg screens) ─── */}
      <div className="lg:hidden flex border-b border-[var(--border)] bg-[var(--background)] px-4 py-2 gap-2 z-10 sticky top-0">
        {[
          { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
          { id: 'config' as const, label: 'Config', icon: Sliders },
          { id: 'map' as const, label: 'Map', icon: MapIcon },
        ].map((tab) => {
          const isActive = mobileTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
              style={{
                fontFamily: 'var(--font-display)',
                color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                background: isActive ? 'rgba(56, 217, 200, 0.1)' : 'var(--glass-strong)',
                border: `1px solid ${isActive ? 'rgba(56, 217, 200, 0.2)' : 'var(--card-border)'}`,
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Layout container ─── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden relative z-10">
        {/* LEFT — Config Panel */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`w-full lg:w-[260px] flex-shrink-0 flex-col lg:h-full border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--background)] ${
            mobileTab === 'config' ? 'flex h-[600px] lg:h-full' : 'hidden lg:flex'
          }`}
        >
          <HoverTag tag="Config Panel" position="top-right" className="h-full">
            <ConfigPanel />
          </HoverTag>
        </motion.aside>

        {/* CENTER — Analytics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 lg:h-full ${
            mobileTab === 'analytics' ? 'block' : 'hidden lg:block'
          }`}
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
          className={`w-full lg:w-[440px] flex-shrink-0 p-3 sm:p-4 flex flex-col lg:h-full bg-[var(--background)] border-t lg:border-t-0 lg:border-l border-[var(--border)] ${
            mobileTab === 'map' ? 'flex h-[550px] lg:h-full' : 'hidden lg:flex'
          }`}
        >
          <HoverTag tag="Route Map & Playback" position="top-right" className="flex-1 flex flex-col min-h-0 h-full">
            <RouteMap />
          </HoverTag>
        </motion.aside>
      </div>
    </main>
  );
}

