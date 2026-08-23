'use client';

import { useSimStore } from '@/store/useSimStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Zap, Flame, Battery, Plug, Maximize2, Network, ArrowRight, Repeat, Lock } from 'lucide-react';
import { MIN_CUBE_EXPONENT, MAX_CUBE_EXPONENT } from '@/engine/constants';
import ExportButton from '@/components/ExportButton';

const PRESET_ICONS: Record<string, LucideIcon> = {
  'case-design': Maximize2,
  'dense-network': Network,
  'grid-upgrade': Plug,
  'ice-benchmark': Flame,
};

function GridDot({ tier }: { tier: string }) {
  const color = tier === 'strong' ? 'var(--green)' : tier === 'medium' ? 'var(--amber)' : 'var(--red)';
  return <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color === 'var(--green)' ? 'rgba(52,211,153,0.3)' : color === 'var(--amber)' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }} />;
}

function LockBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ml-2"
      style={{
        background: 'rgba(245, 158, 11, 0.12)',
        color: 'var(--amber)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        fontFamily: 'var(--font-display)',
      }}
    >
      <Lock size={9} /> Locked
    </span>
  );
}

function SliderControl({
  label, value, displayValue, min, max, step, onChange, accentColor, frozen
}: {
  label: string; value: number; displayValue: string;
  min: number; max: number; step: number;
  onChange: (v: number) => void; accentColor?: string; frozen?: boolean;
}) {
  return (
    <div style={{ opacity: frozen ? 0.5 : 1, pointerEvents: frozen ? 'none' : 'auto' }}>
      <div className="flex justify-between items-center mb-2">
        <label className="text-[11px] uppercase tracking-wider font-medium flex items-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
          {label}
          {frozen && <LockBadge />}
        </label>
        <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)', color: accentColor || 'var(--text-primary)' }}>
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        disabled={frozen}
      />
    </div>
  );
}

export default function ConfigPanel() {
  const store = useSimStore();
  const { config, activePorts, activePresets, frozenControls } = store;
  const isFrozen = useSimStore((s) => s.isFrozen);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasFrozenControls = Object.keys(frozenControls).length > 0;

  // Port ids are not guaranteed to equal array positions once a custom route
  // has been uploaded, so look configs up by id rather than indexing.
  const configByPortId = useMemo(
    () => new Map(config.portConfigs.map((pc) => [pc.portId, pc])),
    [config.portConfigs],
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-base font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--steel)' }}>
          Configuration
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* ─── Scenario Presets ─── */}
        <div style={{ opacity: hasFrozenControls ? 0.4 : 1, pointerEvents: hasFrozenControls ? 'none' : 'auto' }}>
          <label className="text-[11px] uppercase tracking-wider mb-2.5 block font-medium flex items-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Scenario Presets
            {hasFrozenControls && <LockBadge />}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {activePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => store.applyPreset(preset.id)}
                className="text-xs px-3 py-2.5 rounded-lg transition-all text-left group flex items-center"
                style={{
                  fontFamily: 'var(--font-display)',
                  border: '1px solid var(--card-border)',
                  backgroundColor: 'var(--glass-strong)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(74, 144, 204, 0.3)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.backgroundColor = 'rgba(74, 144, 204, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--card-border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'var(--glass-strong)';
                }}
                title={preset.description}
              >
                <span className="mr-1.5 flex items-center justify-center">
                  {PRESET_ICONS[preset.id] ? (() => {
                    const Icon = PRESET_ICONS[preset.id];
                    return <Icon size={14} />;
                  })() : '•'}
                </span>
                <span className="truncate">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Voyage Mode ─── */}
        <div style={{ opacity: isFrozen('voyageMode') ? 0.5 : 1, pointerEvents: isFrozen('voyageMode') ? 'none' : 'auto' }}>
          <label className="text-[11px] uppercase tracking-wider mb-2.5 block font-medium flex items-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Voyage
            {isFrozen('voyageMode') && <LockBadge />}
          </label>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--card-border)' }}>
            {([
              { mode: 'one-way' as const, label: 'One-Way', Icon: ArrowRight },
              { mode: 'roundtrip' as const, label: 'Roundtrip', Icon: Repeat },
            ]).map(({ mode, label, Icon }, i) => {
              const isActive = config.voyageMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => store.setVoyageMode(mode)}
                  className="flex-1 px-3 py-2 text-xs uppercase font-semibold transition-all flex items-center justify-center gap-1.5"
                  style={{
                    fontFamily: 'var(--font-display)',
                    backgroundColor: isActive ? 'rgba(56, 217, 200, 0.12)' : 'transparent',
                    color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                    borderRight: i === 0 ? '1px solid var(--card-border)' : 'none',
                  }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            {config.voyageMode === 'roundtrip'
              ? 'Bergen \u2192 Kirkenes \u2192 Bergen. 67 port calls.'
              : 'Bergen \u2192 Kirkenes only. The 34 calls in Exhibit 2.'}
          </p>
        </div>

        {/* ─── Vessel Type Toggle ─── */}
        <div style={{ opacity: isFrozen('vesselType') ? 0.5 : 1, pointerEvents: isFrozen('vesselType') ? 'none' : 'auto' }}>
          <label className="text-[11px] uppercase tracking-wider mb-2.5 block font-medium flex items-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Vessel Type
            {isFrozen('vesselType') && <LockBadge />}
          </label>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--card-border)' }}>
            {(['ev', 'ice'] as const).map((type) => {
              const isActive = config.vesselType === type;
              return (
                <button
                  key={type}
                  onClick={() => store.setVesselType(type)}
                  className="flex-1 px-3 py-2 text-sm uppercase font-semibold transition-all flex items-center justify-center gap-1.5"
                  style={{
                    fontFamily: 'var(--font-display)',
                    backgroundColor: isActive
                      ? (type === 'ev' ? 'rgba(56, 217, 200, 0.12)' : 'rgba(74, 144, 204, 0.12)')
                      : 'transparent',
                    color: isActive
                      ? (type === 'ev' ? 'var(--cyan)' : 'var(--steel)')
                      : 'var(--text-muted)',
                    borderRight: type === 'ev' ? '1px solid var(--card-border)' : 'none',
                  }}
                >
                  <span className="flex items-center justify-center">
                    {type === 'ev' ? <Zap size={14} /> : <Flame size={14} />}
                  </span>
                  {type.toUpperCase()}
                  {isActive && <div className="w-1.5 h-1.5 rounded-full ml-1" style={{ backgroundColor: type === 'ev' ? 'var(--cyan)' : 'var(--steel)' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Vessel operating point (drives both EV energy and ICE fuel) ─── */}
        {config.vesselType === 'ice' && (
          <>
            <SliderControl
              label="Sailing Speed"
              value={config.speedKnots}
              displayValue={`${config.speedKnots.toFixed(1)} kn`}
              min={10} max={16} step={0.1}
              onChange={(v) => store.setSpeedKnots(v)}
              frozen={isFrozen('speedKnots')}
            />
            <SliderControl
              label="Cargo Load"
              value={config.cargoLoadPercent}
              displayValue={`${config.cargoLoadPercent}%`}
              min={0} max={100} step={5}
              onChange={(v) => store.setCargoLoad(v)}
              frozen={isFrozen('cargoLoadPercent')}
            />
            <div className="flex items-center justify-between py-1" style={{ opacity: isFrozen('efficiencyPackage') ? 0.5 : 1, pointerEvents: isFrozen('efficiencyPackage') ? 'none' : 'auto' }}>
              <label className="text-[11px] uppercase tracking-wider font-medium flex items-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                Efficiency Package
                {isFrozen('efficiencyPackage') && <LockBadge />}
              </label>
              <button
                onClick={() => store.setEfficiencyPackage(!config.efficiencyPackage)}
                className="w-11 h-6 rounded-full relative transition-all"
                style={{
                  backgroundColor: config.efficiencyPackage ? 'rgba(56, 217, 200, 0.3)' : 'var(--navy-medium)',
                  border: `1px solid ${config.efficiencyPackage ? 'rgba(56, 217, 200, 0.3)' : 'var(--card-border)'}`,
                }}
              >
                <div
                  className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                  style={{
                    left: config.efficiencyPackage ? '24px' : '2px',
                    backgroundColor: config.efficiencyPackage ? 'var(--cyan)' : 'var(--text-muted)',
                  }}
                />
              </button>
            </div>
          </>
        )}

        {/* ─── EV Controls ─── */}
        {config.vesselType === 'ev' && (
          <>
            {/* Battery Capacity */}
            <div style={{ opacity: isFrozen('batteryMWh') ? 0.5 : 1, pointerEvents: isFrozen('batteryMWh') ? 'none' : 'auto' }}>
              <label className="text-[11px] uppercase tracking-wider mb-2.5 block font-medium flex items-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                Battery Capacity
                {isFrozen('batteryMWh') && <LockBadge />}
              </label>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--card-border)' }}>
                {([50, 70] as const).map((mwh) => {
                  const isActive = config.batteryMWh === mwh;
                  return (
                    <button
                      key={mwh}
                      onClick={() => store.setBatteryMWh(mwh)}
                      className="flex-1 px-3 py-2 text-sm font-semibold transition-all"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: isActive ? 'rgba(56, 217, 200, 0.12)' : 'transparent',
                        color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                        borderRight: mwh === 50 ? '1px solid var(--card-border)' : 'none',
                      }}
                    >
                      {mwh} MWh
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders */}
            <SliderControl
              label="Sailing Speed"
              value={config.speedKnots}
              displayValue={`${config.speedKnots.toFixed(1)} kn`}
              min={10} max={16} step={0.1}
              onChange={(v) => store.setSpeedKnots(v)}
              frozen={isFrozen('speedKnots')}
            />

            <SliderControl
              label="Cargo Load"
              value={config.cargoLoadPercent}
              displayValue={`${config.cargoLoadPercent}%`}
              min={0} max={100} step={5}
              onChange={(v) => store.setCargoLoad(v)}
              frozen={isFrozen('cargoLoadPercent')}
            />

            {/* Efficiency Package toggle */}
            <div className="flex items-center justify-between py-1" style={{ opacity: isFrozen('efficiencyPackage') ? 0.5 : 1, pointerEvents: isFrozen('efficiencyPackage') ? 'none' : 'auto' }}>
              <label className="text-[11px] uppercase tracking-wider font-medium flex items-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                Efficiency Package
                {isFrozen('efficiencyPackage') && <LockBadge />}
              </label>
              <button
                onClick={() => store.setEfficiencyPackage(!config.efficiencyPackage)}
                className="w-11 h-6 rounded-full relative transition-all"
                style={{
                  backgroundColor: config.efficiencyPackage ? 'rgba(56, 217, 200, 0.3)' : 'var(--navy-medium)',
                  border: `1px solid ${config.efficiencyPackage ? 'rgba(56, 217, 200, 0.3)' : 'var(--card-border)'}`,
                }}
              >
                <div
                  className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                  style={{
                    left: config.efficiencyPackage ? '24px' : '2px',
                    backgroundColor: config.efficiencyPackage ? 'var(--cyan)' : 'var(--text-muted)',
                    boxShadow: config.efficiencyPackage ? '0 0 8px rgba(56,217,200,0.4)' : 'none',
                  }}
                />
              </button>
            </div>

            <SliderControl
              label="Reserve Floor"
              value={config.reservePercent}
              displayValue={`${config.reservePercent}%`}
              min={5} max={30} step={1}
              onChange={(v) => store.setReservePercent(v)}
              accentColor="var(--red)"
              frozen={isFrozen('reservePercent')}
            />

            {/* ─── Charging Ports ─── */}
            <div style={{ opacity: isFrozen('portConfigs') ? 0.5 : 1, pointerEvents: isFrozen('portConfigs') ? 'none' : 'auto' }}>
              <label className="text-[11px] uppercase tracking-wider mb-2.5 block font-medium flex items-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                Charging Ports
                {isFrozen('portConfigs') && <LockBadge />}
                <span className="ml-2 text-[11px] font-bold" style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                  {config.portConfigs.filter(p => p.hasCharger).length}/{activePorts.length}
                </span>
              </label>
              <div className="max-h-56 overflow-y-auto rounded-xl" style={{
                border: '1px solid var(--card-border)',
                background: 'var(--glass)',
              }}>
                {activePorts.map((port) => {
                  const pc = configByPortId.get(port.id);
                  if (!pc) return null;
                  return (
                    <div
                      key={port.id}
                      className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <GridDot tier={pc.gridTier} />
                      <span className="flex-1 text-[12px] truncate font-medium" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
                        {port.name}
                      </span>
                      {port.portStayMinutes > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-muted)',
                          background: 'var(--glass-strong)',
                        }}>
                          {port.portStayMinutes}m
                        </span>
                      )}
                      <button
                        onClick={() => store.toggleCharger(port.id)}
                        className="text-[11px] w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{
                          border: `1px solid ${pc.hasCharger ? 'rgba(56,217,200,0.25)' : 'var(--card-border)'}`,
                          backgroundColor: pc.hasCharger ? 'rgba(56,217,200,0.08)' : 'transparent',
                          color: pc.hasCharger ? 'var(--cyan)' : 'var(--text-muted)',
                        }}
                        title="Charging station"
                      >
                        <Zap size={14} />
                      </button>
                      <button
                        onClick={() => pc.hasCharger && store.toggleBufferBattery(port.id)}
                        className="text-[11px] w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{
                          border: `1px solid ${pc.hasBufferBattery && pc.hasCharger ? 'rgba(245,158,11,0.25)' : 'var(--card-border)'}`,
                          backgroundColor: pc.hasBufferBattery && pc.hasCharger ? 'rgba(245,158,11,0.08)' : 'transparent',
                          color: pc.hasBufferBattery && pc.hasCharger ? 'var(--amber)' : 'var(--text-muted)',
                          opacity: pc.hasCharger ? 1 : 0.35,
                          cursor: pc.hasCharger ? 'pointer' : 'not-allowed',
                        }}
                        title={pc.hasCharger ? "Buffer battery: stores grid energy locally for full-rate charging on a weak grid" : "Enable the charger first"}
                        disabled={!pc.hasCharger}
                      >
                        <Battery size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ─── Advanced Settings ─── */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] uppercase tracking-wider flex items-center gap-2 font-medium py-1"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
          >
            <span style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s', fontSize: '8px' }}>▶</span>
            Advanced Settings
          </button>
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3 space-y-4"
              >
                <SliderControl
                  label="Speed Exponent (n)"
                  value={config.cubeExponent}
                  displayValue={config.cubeExponent.toFixed(2)}
                  min={MIN_CUBE_EXPONENT} max={MAX_CUBE_EXPONENT} step={0.05}
                  onChange={(v) => store.setCubeExponent(v)}
                  frozen={isFrozen('cubeExponent')}
                />
                <p className="text-[10px] -mt-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  P &prop; v&#8319;. Default 3.45 is the least-squares fit to Exhibit 9; textbook cube law is 3.0. No effect at 13.2 kn.
                </p>

                <SliderControl
                  label="Discount Rate"
                  value={config.discountRate}
                  displayValue={`${(config.discountRate * 100).toFixed(0)}%`}
                  min={0.03} max={0.15} step={0.01}
                  onChange={(v) => store.setDiscountRate(v)}
                  frozen={isFrozen('discountRate')}
                />

                {/* Physics Model section */}
                <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-[10px] uppercase tracking-widest mb-3 block font-semibold" style={{ color: 'var(--cyan)', fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}>
                    Physics Model
                  </span>
                </div>

                <SliderControl
                  label="Sea Margin (Weather)"
                  value={config.seaMarginPercent}
                  displayValue={`${config.seaMarginPercent}%`}
                  min={0} max={40} step={1}
                  onChange={(v) => store.setSeaMarginPercent(v)}
                  accentColor="var(--amber)"
                  frozen={isFrozen('seaMarginPercent')}
                />

                <SliderControl
                  label="Connection Overhead"
                  value={config.connectionOverheadMinutes}
                  displayValue={`${config.connectionOverheadMinutes} min`}
                  min={0} max={20} step={1}
                  onChange={(v) => store.setConnectionOverheadMinutes(v)}
                  frozen={isFrozen('connectionOverheadMinutes')}
                />

                <SliderControl
                  label="Battery Efficiency"
                  value={config.batteryEfficiency}
                  displayValue={`${(config.batteryEfficiency * 100).toFixed(0)}%`}
                  min={0.85} max={1.0} step={0.01}
                  onChange={(v) => store.setBatteryEfficiency(v)}
                  frozen={isFrozen('batteryEfficiency')}
                />

                <SliderControl
                  label="Charger Rating"
                  value={config.chargePowerMW}
                  displayValue={`${config.chargePowerMW} MW`}
                  min={6} max={30} step={1}
                  onChange={(v) => store.setChargePower(v)}
                  accentColor="var(--cyan)"
                  frozen={isFrozen('chargePowerMW')}
                />
                <p className="text-[10px] -mt-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  Case design point is 12 MW. Higher ratings assume grid reinforcement and scale the $1M/port cost.
                </p>

                {/* Commercial assumptions */}
                <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-[10px] uppercase tracking-widest mb-3 block font-semibold" style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}>
                    Commercial
                  </span>
                </div>

                <SliderControl
                  label="Carbon Price"
                  value={config.carbonPricePerTon}
                  displayValue={`$${config.carbonPricePerTon}/t`}
                  min={0} max={400} step={10}
                  onChange={(v) => store.setCarbonPrice(v)}
                  accentColor="var(--amber)"
                  frozen={isFrozen('carbonPricePerTon')}
                />
                <p className="text-[10px] -mt-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  Applied to both vessels. The case&apos;s $190/t is the penalty for missing the tender&apos;s fleet-wide target, not a tax on every tonne.
                </p>

                <SliderControl
                  label="Schedule Tolerance"
                  value={config.scheduleToleranceHours}
                  displayValue={`${config.scheduleToleranceHours} h`}
                  min={0} max={24} step={1}
                  onChange={(v) => store.setScheduleTolerance(v)}
                  accentColor="var(--red)"
                  frozen={isFrozen('scheduleToleranceHours')}
                />
                <p className="text-[10px] -mt-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  Allowed drift from the Exhibit 2 timetable before the daily-call obligation is treated as broken.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Export — pinned below the scrolling controls so it is reachable
          without hunting through the accordion. */}
      <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <ExportButton />
        <p
          className="text-[10px] mt-1.5 leading-snug text-center"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
        >
          15 sheets
        </p>
      </div>
    </div>
  );
}
