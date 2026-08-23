'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ExcelUploader from '@/components/admin/ExcelUploader';
import PortTable from '@/components/admin/PortTable';
import TeamManager from '@/components/admin/TeamManager';
import RouteSelector from '@/components/admin/RouteSelector';
import FreezeManager from '@/components/admin/FreezeManager';
import { Lightbulb } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, loading, router]);

  // Show nothing while checking auth (proxy handles the actual protection)
  if (loading || !isAdmin) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
          Verifying access…
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex-1 overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-xl sm:text-2xl font-bold uppercase tracking-wider mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Admin Console
          </h1>
          <p
            className="text-xs sm:text-sm"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}
          >
            Manage routes, ports, and competition teams
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column — Route Management */}
          <div className="space-y-6">
            {/* Pre-built route selector */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 }}
              className="glass-card p-4 sm:p-6"
            >
              <RouteSelector />
            </motion.section>

            {/* Upload section */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="glass-card p-4 sm:p-6"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--cyan)' }} />
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
                  Route Upload
                </h2>
              </div>
              <ExcelUploader />
            </motion.section>

            {/* Team Management */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="glass-card p-4 sm:p-6"
            >
              <TeamManager />
            </motion.section>

            {/* Freeze Controls */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="glass-card p-4 sm:p-6"
            >
              <FreezeManager />
            </motion.section>
          </div>

          {/* Right column — Port Data */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 sm:p-6"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--amber)' }} />
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
                Active Port Data
              </h2>
            </div>
            <PortTable />
          </motion.section>
        </div>

        {/* Sample format helper */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 sm:p-6"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--steel)' }} />
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
              Excel Format Guide
            </h2>
          </div>
          <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid var(--card-border)' }}>
            <div className="min-w-[550px]">
              <div
                className="grid px-4 py-2"
                style={{
                  gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                  background: 'var(--glass-strong)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {['name', 'lat', 'lng', 'gridTier', 'portStayMinutes', 'distanceToNextKm'].map((h) => (
                  <span key={h} className="text-[11px] font-bold" style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                    {h}
                  </span>
                ))}
              </div>
              {[
                ['Bergen', '60.391', '5.322', 'strong', '0', '163'],
                ['Florø', '61.599', '5.032', 'weak', '15', '52'],
                ['Måløy', '61.936', '5.113', 'weak', '15', ''],
              ].map((row, i) => (
                <div
                  key={i}
                  className="grid px-4 py-1.5"
                  style={{
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  {row.map((cell, j) => (
                    <span key={j} className="text-xs" style={{ color: cell ? 'var(--text-secondary)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {cell || '(auto)'}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs mt-3 flex items-start gap-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            <Lightbulb size={14} className="flex-shrink-0 text-cyan-400 mt-0.5" />
            <span>
              <strong>distanceToNextKm</strong> is optional. If omitted, distances use the Haversine formula × 1.3 for coastal routing.
              The first port&apos;s <strong>portStayMinutes</strong> is always treated as 0 (voyage origin).
            </span>
          </p>
        </motion.section>
      </div>
    </main>
  );
}
