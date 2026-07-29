'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Trophy } from 'lucide-react';
import ConfigPanel from '@/components/config/ConfigPanel';
import VerdictBanner from '@/components/VerdictBanner';
import OperationalCard from '@/components/cards/OperationalCard';
import FinancialCard from '@/components/cards/FinancialCard';
import EnvironmentalCard from '@/components/cards/EnvironmentalCard';
import TeamSelector from '@/components/compete/TeamSelector';
import SubmitPanel from '@/components/compete/SubmitPanel';
import Leaderboard from '@/components/compete/Leaderboard';
import { Team } from '@/store/persistence';

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

  const handleSubmitted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <main
      className="flex-1 flex overflow-hidden"
    >
      {/* LEFT — Config Panel */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
        className="w-[260px] flex-shrink-0 overflow-hidden"
        style={{
          background: 'var(--background)',
          borderRight: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <ConfigPanel />
      </motion.aside>

      {/* CENTER — Team controls + Analytics + Leaderboard */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        style={{ minWidth: 0 }}
      >
        {/* Team selector + Submit row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
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
          className="glass-card p-6"
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
        <FinancialCard />
        <EnvironmentalCard />
      </motion.section>

      {/* RIGHT — Map */}
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="w-[380px] flex-shrink-0 p-4 flex flex-col"
        style={{
          background: 'var(--background)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        <RouteMap />
      </motion.aside>
    </main>
  );
}
