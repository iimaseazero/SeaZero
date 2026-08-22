'use client';

<<<<<<< HEAD
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Download, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useSimStore } from '@/store/useSimStore';
import { Team, Submission, addSubmission } from '@/store/persistence';
import { scoreSubmission, ScoreBreakdown, ScenarioOutcome } from '@/engine/scoring';
import { downloadTeamReport } from '@/utils/generateTeamReport';
import { formatMoney } from '@/components/charts/chartTheme';
=======
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Download } from 'lucide-react';
import { useSimStore } from '@/store/useSimStore';
import { Team, Submission, addSubmission, computeScore, ScoreBreakdown } from '@/store/persistence';
import { downloadTeamReport } from '@/utils/generateTeamReport';

function formatM(val: number): string {
  if (Math.abs(val) >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
  return `$${(val / 1_000).toFixed(0)}K`;
}
>>>>>>> origin/master

interface SubmitPanelProps {
  selectedTeam: Team | null;
  onSubmitted: () => void;
}

<<<<<<< HEAD
/** The four components, with the trade-off each one is meant to create. */
const COMPONENTS: {
  key: keyof Pick<ScoreBreakdown, 'reliability' | 'cost' | 'climate' | 'service'>;
  label: string;
  max: number;
  color: string;
  hint: string;
}[] = [
  {
    key: 'reliability',
    label: 'Reliability',
    max: 35,
    color: 'var(--chart-ev)',
    hint: 'Does the bid still sail when the weather, the load, a charger or the pack turns against it? Zero if the base case cannot complete the voyage at all.',
  },
  {
    key: 'cost',
    label: 'Cost',
    max: 35,
    color: 'var(--chart-accent)',
    hint: 'Ten-year TCO of the vessel you chose, scored at its WORST economic scenario — an optimistic fuel forecast buys nothing here.',
  },
  {
    key: 'climate',
    label: 'Climate',
    max: 20,
    color: 'var(--chart-good)',
    hint: 'Absolute CO₂ your vessel emits, against a conventional ship with no efficiency package. Burning more energy always costs you points.',
  },
  {
    key: 'service',
    label: 'Service',
    max: 10,
    color: 'var(--chart-demand)',
    hint: 'Adherence to the Exhibit 2 timetable. The Kystruten contract requires daily calls at every port.',
  },
];

function ComponentBar({
  label, value, max, color, hint,
}: {
  label: string; value: number; max: number; color: string; hint: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div title={hint}>
      <div className="flex justify-between items-baseline mb-1">
        <span
          className="text-[11px] font-medium"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          {label}
        </span>
        <span
          className="text-[11px] font-bold"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
        >
          {value.toFixed(1)}
          <span style={{ color: 'var(--text-muted)' }}> / {max}</span>
        </span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: 'var(--glass-strong)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct * 100}%`, background: color, transition: 'width 220ms ease' }}
        />
      </div>
    </div>
  );
}

function ScenarioChip({ outcome }: { outcome: ScenarioOutcome }) {
  const passed = outcome.feasible;
  const isEconomic = outcome.kind === 'economic';
  // Economic scenarios do not decide feasibility — they move cost. Showing them
  // with a pass/fail tick would misrepresent what they test.
  const tone = isEconomic
    ? { fg: 'var(--text-secondary)', bg: 'var(--glass-strong)' }
    : passed
      ? { fg: 'var(--chart-good)', bg: 'rgba(5,150,105,0.12)' }
      : { fg: 'var(--chart-warm)', bg: 'rgba(234,88,12,0.12)' };

  const detail = isEconomic
    ? `${outcome.rationale}\n\n10-year TCO in this scenario: ${formatMoney(outcome.chosenTCO)}`
    : `${outcome.rationale}\n\n${
        passed
          ? `Completes. Worst margin ${outcome.worstMarginPercent.toFixed(1)}%.`
          : `Fails: ${outcome.infeasibleReason}`
      }`;

  return (
    <span
      title={detail}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider cursor-help"
      style={{ fontFamily: 'var(--font-display)', color: tone.fg, background: tone.bg }}
    >
      {!isEconomic && (passed ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />)}
      {outcome.short}
      {isEconomic && (
        <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
          {formatMoney(outcome.chosenTCO)}
        </span>
      )}
    </span>
  );
}

export default function SubmitPanel({ selectedTeam, onSubmitted }: SubmitPanelProps) {
  const { config, simResult, economics, emissions, activePorts, activeLegs } = useSimStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Nine pipeline passes; the preview and the stored score come from the same
  // function, so what the team sees here is exactly what lands on the board.
  const preview: ScoreBreakdown = useMemo(
    () => scoreSubmission(config, activePorts, activeLegs),
    [config, activePorts, activeLegs],
  );

  const handleSubmit = async () => {
    if (!selectedTeam) return;
    await addSubmission(
      selectedTeam, config, simResult, economics, emissions, activePorts, activeLegs,
    );
=======
export default function SubmitPanel({ selectedTeam, onSubmitted }: SubmitPanelProps) {
  const { config, simResult, economics, emissions } = useSimStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Preview score
  const preview: ScoreBreakdown = computeScore(simResult, economics, emissions);

  const handleSubmit = async () => {
    if (!selectedTeam) return;
    await addSubmission(selectedTeam, config, simResult, economics, emissions);
>>>>>>> origin/master
    setShowConfirm(false);
    setJustSubmitted(true);
    onSubmitted();
    setTimeout(() => setJustSubmitted(false), 3000);
  };

  const canSubmit = selectedTeam !== null;
<<<<<<< HEAD
  const scoreColor =
    preview.totalScore >= 70 ? 'var(--chart-good)'
      : preview.totalScore >= 45 ? 'var(--chart-demand)'
        : 'var(--chart-warm)';

  const operational = preview.scenarios.filter((s) => s.kind !== 'economic');
  const economic = preview.scenarios.filter((s) => s.kind === 'economic');
=======
>>>>>>> origin/master

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
<<<<<<< HEAD
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--chart-ev)' }} />
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          Bid Score &amp; Submit
        </h3>
      </div>

      {/* Score + components */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-5">
        <div
          className="sm:col-span-2 flex flex-col items-center justify-center px-4 py-4 rounded-xl"
          style={{ background: 'var(--glass-strong)', border: '1px solid var(--card-border)' }}
        >
          <span
            className="text-[10px] uppercase tracking-wider mb-1 font-semibold text-center"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
          >
            Bid Score
          </span>
          <span
            className="text-4xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: scoreColor, lineHeight: 1.05 }}
          >
            {preview.totalScore.toFixed(0)}
          </span>
          <span className="text-[10px] mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            out of 100 · higher wins
          </span>
        </div>

        <div className="sm:col-span-3 space-y-2.5">
          {COMPONENTS.map((c) => (
            <ComponentBar
              key={c.key}
              label={c.label}
              value={preview[c.key]}
              max={c.max}
              color={c.color}
              hint={c.hint}
            />
=======
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
>>>>>>> origin/master
          ))}
        </div>
      </div>

<<<<<<< HEAD
      {/* Stress panel */}
      <div
        className="px-4 py-3.5 rounded-xl mb-5"
        style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-baseline justify-between mb-2 gap-2 flex-wrap">
          <span
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
          >
            Base case + {preview.operationalTotal} operational stresses
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {preview.operationalPassed}/{preview.operationalTotal} stresses survived
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {operational.map((o) => <ScenarioChip key={o.id} outcome={o} />)}
        </div>

        <div className="flex items-baseline justify-between mb-1.5 gap-2 flex-wrap">
          <span
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
          >
            Price scenarios — cost is scored at the worst of these
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {economic.map((o) => <ScenarioChip key={o.id} outcome={o} />)}
        </div>

        <p
          className="text-[10px] leading-relaxed mt-3"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
        >
          Worst-case TCO {formatMoney(preview.worstCaseTCO)} against a{' '}
          {formatMoney(preview.benchmarkTCO)} efficiency-upgraded conventional benchmark ·{' '}
          {preview.co2ReductionPercent.toFixed(0)}% below a do-nothing vessel ·{' '}
          {preview.scheduleDeviationHours >= 0 ? '+' : ''}
          {preview.scheduleDeviationHours.toFixed(1)} h vs the Exhibit 2 timetable
        </p>
      </div>

=======
>>>>>>> origin/master
      {/* Config summary */}
      <div
        className="px-4 py-3 rounded-xl mb-5"
        style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
      >
<<<<<<< HEAD
        <span
          className="text-[10px] uppercase tracking-wider font-semibold block mb-2"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
        >
          Configuration Summary
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Vessel', value: config.vesselType === 'ev' ? 'Battery' : 'Conventional' },
            { label: 'Battery', value: `${config.batteryMWh} MWh` },
            { label: 'Speed', value: `${config.speedKnots.toFixed(1)} kn` },
            { label: 'Chargers', value: `${config.portConfigs.filter((p) => p.hasCharger).length}` },
            { label: 'Connector', value: `${config.chargePowerMW} MW` },
            { label: 'Efficiency', value: config.efficiencyPackage ? 'Yes' : 'No' },
          ].map((item) => (
            <div key={item.label} className="flex justify-between gap-2">
=======
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
>>>>>>> origin/master
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

<<<<<<< HEAD
      {/* Submit */}
=======
      {/* Submit button & Download Current Report */}
>>>>>>> origin/master
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {justSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-3 rounded-xl"
<<<<<<< HEAD
              style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.25)' }}
            >
              <CheckCircle size={20} style={{ color: 'var(--chart-good)' }} />
              <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--chart-good)' }}>
                Bid submitted
=======
              style={{
                background: 'var(--green-dim)',
                border: '1px solid rgba(52, 211, 153, 0.2)',
              }}
            >
              <CheckCircle size={20} className="text-green-500" />
              <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
                Submitted Successfully!
>>>>>>> origin/master
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
<<<<<<< HEAD
                  background: 'rgba(5,150,105,0.14)',
                  color: 'var(--chart-good)',
                  border: '1px solid rgba(5,150,105,0.25)',
                }}
              >
                Confirm bid for {selectedTeam?.name}
=======
                  background: 'rgba(52, 211, 153, 0.15)',
                  color: 'var(--green)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                }}
              >
                Confirm Submit for {selectedTeam?.name}
>>>>>>> origin/master
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
<<<<<<< HEAD
                background: canSubmit ? 'rgba(8,145,178,0.12)' : 'var(--glass)',
                color: canSubmit ? 'var(--chart-ev)' : 'var(--text-muted)',
                border: `1px solid ${canSubmit ? 'rgba(8,145,178,0.25)' : 'var(--card-border)'}`,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {canSubmit ? 'Submit bid (replaces your previous one)' : 'Select a team first'}
=======
                background: canSubmit ? 'rgba(56, 217, 200, 0.12)' : 'var(--glass)',
                color: canSubmit ? 'var(--cyan)' : 'var(--text-muted)',
                border: `1px solid ${canSubmit ? 'rgba(56, 217, 200, 0.2)' : 'var(--card-border)'}`,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                boxShadow: canSubmit ? '0 0 20px rgba(56, 217, 200, 0.06)' : 'none',
              }}
            >
              {canSubmit ? 'Submit Configuration' : 'Select a team first'}
>>>>>>> origin/master
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={() => {
            const tempSubmission: Submission = {
              id: `preview-${Date.now()}`,
              teamId: selectedTeam?.id || 'preview',
              teamName: selectedTeam?.name || 'Current Configuration',
<<<<<<< HEAD
              teamColor: selectedTeam?.color || '#0891B2',
=======
              teamColor: selectedTeam?.color || '#38D9C8',
>>>>>>> origin/master
              config,
              simResult,
              economics,
              emissions,
              score: preview.totalScore,
              breakdown: preview,
              submittedAt: Date.now(),
            };
            downloadTeamReport(tempSubmission);
          }}
          className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          style={{
            fontFamily: 'var(--font-display)',
            background: 'var(--glass-strong)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--card-border)',
          }}
        >
<<<<<<< HEAD
          <Download size={14} style={{ color: 'var(--chart-ev)' }} />
          Download current report
=======
          <Download size={14} className="text-cyan-400" />
          Download Current Report
>>>>>>> origin/master
        </button>
      </div>
    </motion.div>
  );
}
