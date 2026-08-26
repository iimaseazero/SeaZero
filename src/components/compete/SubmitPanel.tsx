'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Download, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useSimStore } from '@/store/useSimStore';
import { Team, Submission, addSubmission } from '@/store/persistence';
import { scoreSubmission, ScoreBreakdown, ScenarioOutcome } from '@/engine/scoring';
import { downloadTeamReport } from '@/utils/generateTeamReport';
import { formatMoney } from '@/components/charts/chartTheme';

interface SubmitPanelProps {
  selectedTeam: Team | null;
  onSubmitted: () => void;
}

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
    hint: 'Does the bid still sail when the weather, the load, a charger or the pack turns against it? Zero if the base case cannot complete the voyage.',
  },
  {
    key: 'cost',
    label: 'Cost',
    max: 35,
    color: 'var(--chart-accent)',
    hint: 'Ten-year TCO of the vessel you chose, scored at its worst economic scenario. An optimistic fuel forecast buys nothing.',
  },
  {
    key: 'climate',
    label: 'Climate',
    max: 20,
    color: 'var(--chart-good)',
    hint: 'Absolute CO₂ your vessel emits, against a conventional ship with no efficiency package. Burning more energy costs points.',
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
    setShowConfirm(false);
    setJustSubmitted(true);
    onSubmitted();
    setTimeout(() => setJustSubmitted(false), 3000);
  };

  const canSubmit = selectedTeam !== null;
  const scoreColor =
    preview.totalScore >= 70 ? 'var(--chart-good)'
      : preview.totalScore >= 45 ? 'var(--chart-demand)'
        : 'var(--chart-warm)';

  const operational = preview.scenarios.filter((s) => s.kind !== 'economic');
  const economic = preview.scenarios.filter((s) => s.kind === 'economic');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--chart-ev)' }} />
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          Bid Score
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
          ))}
        </div>
      </div>

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
            Stress panel
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
            Price scenarios
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {economic.map((o) => <ScenarioChip key={o.id} outcome={o} />)}
        </div>

        <p
          className="text-[10px] leading-relaxed mt-3"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
        >
          Worst-case TCO {formatMoney(preview.worstCaseTCO)} vs {formatMoney(preview.benchmarkTCO)}{' '}
          conventional benchmark · {preview.co2ReductionPercent.toFixed(0)}% less CO₂ than a
          do-nothing vessel · {preview.scheduleDeviationHours >= 0 ? '+' : ''}
          {preview.scheduleDeviationHours.toFixed(1)} h vs timetable
        </p>
      </div>

      {/* Config summary */}
      <div
        className="px-4 py-3 rounded-xl mb-5"
        style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
      >
        <span
          className="text-[10px] uppercase tracking-wider font-semibold block mb-2"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
        >
          Configuration Summary
        </span>
        <div className="grid grid-cols-2 2xl:grid-cols-3 gap-x-4 gap-y-2.5">
          {[
            { label: 'Vessel', value: config.vesselType === 'ev' ? 'Battery' : 'Conventional' },
            { label: 'Battery', value: `${config.batteryMWh} MWh` },
            { label: 'Speed', value: `${config.speedKnots.toFixed(1)} kn` },
            { label: 'Chargers', value: `${config.portConfigs.filter((p) => p.hasCharger).length}` },
            { label: 'Connector', value: `${config.chargePowerMW} MW` },
            { label: 'Efficiency', value: config.efficiencyPackage ? 'Yes' : 'No' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
                {item.label}
              </span>
              <span className="text-[11px] font-bold truncate" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {justSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-3 rounded-xl"
              style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.25)' }}
            >
              <CheckCircle size={20} style={{ color: 'var(--chart-good)' }} />
              <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--chart-good)' }}>
                Submitted
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
                  background: 'rgba(5,150,105,0.14)',
                  color: 'var(--chart-good)',
                  border: '1px solid rgba(5,150,105,0.25)',
                }}
              >
                Confirm
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
                background: canSubmit ? 'rgba(8,145,178,0.12)' : 'var(--glass)',
                color: canSubmit ? 'var(--chart-ev)' : 'var(--text-muted)',
                border: `1px solid ${canSubmit ? 'rgba(8,145,178,0.25)' : 'var(--card-border)'}`,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {canSubmit ? 'Submit Bid' : 'Select a team first'}
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={() => {
            const tempSubmission: Submission = {
              id: `preview-${Date.now()}`,
              teamId: selectedTeam?.id || 'preview',
              teamName: selectedTeam?.name || 'Current Configuration',
              teamColor: selectedTeam?.color || '#0891B2',
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
          <Download size={14} style={{ color: 'var(--chart-ev)' }} />
          Download Report
        </button>
      </div>
    </motion.div>
  );
}
