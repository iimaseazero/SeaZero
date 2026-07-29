'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useSimStore } from '@/store/useSimStore';
import { Team, addSubmission, computeScore, ScoreBreakdown } from '@/store/persistence';

function formatM(val: number): string {
  if (Math.abs(val) >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
  return `$${(val / 1_000).toFixed(0)}K`;
}

interface SubmitPanelProps {
  selectedTeam: Team | null;
  onSubmitted: () => void;
}

export default function SubmitPanel({ selectedTeam, onSubmitted }: SubmitPanelProps) {
  const { config, simResult, economics, emissions } = useSimStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Preview score
  const preview: ScoreBreakdown = computeScore(simResult, economics, emissions);

  const handleSubmit = () => {
    if (!selectedTeam) return;
    addSubmission(selectedTeam, config, simResult, economics, emissions);
    setShowConfirm(false);
    setJustSubmitted(true);
    onSubmitted();
    setTimeout(() => setJustSubmitted(false), 3000);
  };

  const canSubmit = selectedTeam !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--cyan)' }} />
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
          Score Preview & Submit
        </h3>
      </div>

      {/* Score preview */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          className="flex flex-col items-center px-4 py-4 rounded-xl"
          style={{ background: 'var(--glass-strong)', border: '1px solid var(--card-border)' }}
        >
          <span className="text-[10px] uppercase tracking-wider mb-2 font-semibold" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Projected Score
          </span>
          <span
            className="text-3xl font-bold"
            style={{
              fontFamily: 'var(--font-mono)',
              color: preview.totalScore < 0 ? 'var(--green)' : preview.totalScore < 50 ? 'var(--amber)' : 'var(--red)',
              lineHeight: 1.1,
            }}
          >
            {preview.totalScore.toFixed(1)}
          </span>
          <span className="text-[10px] mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            lower is better
          </span>
        </div>

        <div
          className="flex flex-col px-4 py-3 rounded-xl space-y-1.5"
          style={{ background: 'var(--glass-strong)', border: '1px solid var(--card-border)' }}
        >
          <span className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Breakdown
          </span>
          {[
            { label: 'Feasibility', value: preview.feasibilityBonus, color: preview.feasibilityBonus < 0 ? 'var(--green)' : 'var(--text-muted)' },
            { label: 'Dead Zones', value: preview.deadZonePenalty, color: preview.deadZonePenalty > 0 ? 'var(--red)' : 'var(--green)' },
            { label: 'NPV Gap', value: preview.npvScore, color: preview.npvScore < 0 ? 'var(--green)' : 'var(--amber)' },
            { label: 'CO₂ Reward', value: preview.co2Score, color: preview.co2Score < 0 ? 'var(--green)' : 'var(--red)' },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <span className="text-[11px]" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
                {item.label}
              </span>
              <span className="text-[11px] font-bold" style={{ fontFamily: 'var(--font-mono)', color: item.color }}>
                {item.value > 0 ? '+' : ''}{item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Config summary */}
      <div
        className="px-4 py-3 rounded-xl mb-5"
        style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
      >
        <span className="text-[10px] uppercase tracking-wider font-semibold block mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
          Configuration Summary
        </span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Battery', value: `${config.batteryMWh} MWh` },
            { label: 'Speed', value: `${config.speedKnots.toFixed(1)} kn` },
            { label: 'Chargers', value: `${config.portConfigs.filter(p => p.hasCharger).length}` },
            { label: 'Buffers', value: `${config.portConfigs.filter(p => p.hasBufferBattery).length}` },
            { label: 'Efficiency', value: config.efficiencyPackage ? 'Yes' : 'No' },
            { label: 'NPV Gap', value: formatM(economics.npvGap) },
          ].map((item) => (
            <div key={item.label} className="flex justify-between">
              <span className="text-[11px]" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
                {item.label}
              </span>
              <span className="text-[11px] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <AnimatePresence mode="wait">
        {justSubmitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl"
            style={{
              background: 'var(--green-dim)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
            }}
          >
            <CheckCircle size={20} className="text-green-500" />
            <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
              Submitted Successfully!
            </span>
          </motion.div>
        ) : showConfirm ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-2"
          >
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'rgba(52, 211, 153, 0.15)',
                color: 'var(--green)',
                border: '1px solid rgba(52, 211, 153, 0.25)',
              }}
            >
              Confirm Submit for {selectedTeam?.name}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'var(--glass-strong)',
                color: 'var(--text-muted)',
                border: '1px solid var(--card-border)',
              }}
            >
              Cancel
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="submit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => canSubmit && setShowConfirm(true)}
            disabled={!canSubmit}
            className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
            style={{
              fontFamily: 'var(--font-display)',
              background: canSubmit ? 'rgba(56, 217, 200, 0.12)' : 'var(--glass)',
              color: canSubmit ? 'var(--cyan)' : 'var(--text-muted)',
              border: `1px solid ${canSubmit ? 'rgba(56, 217, 200, 0.2)' : 'var(--card-border)'}`,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 0 20px rgba(56, 217, 200, 0.06)' : 'none',
            }}
          >
            {canSubmit ? 'Submit Configuration' : 'Select a team first'}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
