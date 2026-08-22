'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Trophy, BarChart3, Sliders, Map as MapIcon } from 'lucide-react';
import ConfigPanel from '@/components/config/ConfigPanel';
import VerdictBanner from '@/components/VerdictBanner';
import OperationalCard from '@/components/cards/OperationalCard';
import FinancialCard from '@/components/cards/FinancialCard';
import EnvironmentalCard from '@/components/cards/EnvironmentalCard';
<<<<<<< HEAD
import DecisionCard from '@/components/cards/DecisionCard';
import SensitivityCard from '@/components/cards/SensitivityCard';
=======
>>>>>>> origin/master
import TeamSelector from '@/components/compete/TeamSelector';
import SubmitPanel from '@/components/compete/SubmitPanel';
import Leaderboard from '@/components/compete/Leaderboard';
import { Team } from '@/store/persistence';
import { useFrozenControls } from '@/store/useFrozenControls';

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

export default function CompetePage() {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<'compete' | 'config' | 'map'>('compete');
  useFrozenControls();

  const handleSubmitted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <main className="min-h-screen lg:h-screen flex flex-col overflow-y-auto lg:overflow-hidden relative">
      {/* ─── Mobile View Switcher Tabs (< lg screens) ─── */}
      <div className="lg:hidden flex border-b border-[var(--border)] bg-[var(--background)] px-4 py-2 gap-2 z-10 sticky top-0">
        {[
          { id: 'compete' as const, label: 'Compete', icon: BarChart3 },
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

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden relative z-10">
        {/* LEFT — Config Panel */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className={`w-full lg:w-[260px] flex-shrink-0 flex-col lg:h-full border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--background)] ${
            mobileTab === 'config' ? 'flex h-[600px] lg:h-full' : 'hidden lg:flex'
          }`}
        >
          <ConfigPanel />
        </motion.aside>

        {/* CENTER — Team controls + Analytics + Leaderboard */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 lg:h-full ${
            mobileTab === 'compete' ? 'block' : 'hidden lg:block'
          }`}
          style={{ minWidth: 0 }}
        >
          {/* Team selector + Submit row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 sm:p-5"
            >
              <TeamSelector selectedTeam={selectedTeam} onSelect={setSelectedTeam} />
            </motion.div>

            <SubmitPanel selectedTeam={selectedTeam} onSubmitted={handleSubmitted} />
          </div>

          {/* Verdict */}
          <VerdictBanner />

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-4 sm:p-6"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <Trophy size={20} className="text-cyan-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
                Leaderboard
              </h2>
            </div>
            <Leaderboard key={refreshKey} />
          </motion.div>

          {/* Analytics cards */}
          <OperationalCard />
<<<<<<< HEAD
          <DecisionCard />
          <FinancialCard />
          <SensitivityCard />
=======
          <FinancialCard />
>>>>>>> origin/master
          <EnvironmentalCard />
        </motion.section>

        {/* RIGHT — Map */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`w-full lg:w-[380px] flex-shrink-0 p-3 sm:p-4 flex flex-col bg-[var(--background)] border-t lg:border-t-0 lg:border-l border-[var(--border)] ${
            mobileTab === 'map' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <RouteMap />
        </motion.aside>
      </div>
    </main>
  );
}

