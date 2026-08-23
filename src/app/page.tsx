'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import ConfigPanel from '@/components/config/ConfigPanel';
import VerdictBanner from '@/components/VerdictBanner';
import OperationalCard from '@/components/cards/OperationalCard';
import FinancialCard from '@/components/cards/FinancialCard';
import EnvironmentalCard from '@/components/cards/EnvironmentalCard';
import DecisionCard from '@/components/cards/DecisionCard';
import SensitivityCard from '@/components/cards/SensitivityCard';
import HoverTag from '@/components/HoverTag';
import { BarChart3, Sliders, Map as MapIcon } from 'lucide-react';
import { useFrozenControls } from '@/store/useFrozenControls';

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

export default function Home() {
  const [mobileTab, setMobileTab] = useState<'analytics' | 'config' | 'map'>('analytics');
  useFrozenControls();

  return (
    <main className="min-h-screen lg:h-screen flex flex-col overflow-y-auto lg:overflow-hidden relative">
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
          <HoverTag tag="Configuration" position="top-right" className="h-full">
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
          <HoverTag tag="Verdict">
            <VerdictBanner />
          </HoverTag>
          <HoverTag tag="State of Charge">
            <OperationalCard />
          </HoverTag>
          <HoverTag tag="10-Year TCO">
            <FinancialCard />
          </HoverTag>
          <HoverTag tag="Emissions">
            <EnvironmentalCard />
          </HoverTag>
          <HoverTag tag="Decision Surface">
            <DecisionCard />
          </HoverTag>
          <HoverTag tag="Sensitivity">
            <SensitivityCard />
          </HoverTag>
        </motion.section>

        {/* RIGHT — Map */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`w-full lg:w-[440px] flex-shrink-0 p-3 sm:p-4 flex flex-col bg-[var(--background)] border-t lg:border-t-0 lg:border-l border-[var(--border)] ${
            mobileTab === 'map' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <HoverTag tag="Route Map" position="top-right" className="w-full flex flex-col">
            <RouteMap />
          </HoverTag>
        </motion.aside>
      </div>
    </main>
  );
}

