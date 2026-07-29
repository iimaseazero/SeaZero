'use client';

import { useSimStore } from '@/store/useSimStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Zap, Flame, Battery, Navigation, Maximize2, MoveVertical } from 'lucide-react';

const PRESET_ICONS: Record<string, any> = {
  'sparse-big': Maximize2,
  'dense-small': MoveVertical,
  'buffered-north': Navigation,
  'ice-benchmark': Flame,
};

function GridDot({ tier }: { tier: string }) {
  const color = tier === 'strong' ? 'var(--green)' : tier === 'medium' ? 'var(--amber)' : 'var(--red)';
  return <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color === 'var(--green)' ? 'rgba(52,211,153,0.3)' : color === 'var(--amber)' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }} />;
}

function SliderControl({
  label, value, displayValue, min, max, step, onChange, accentColor
}: {
  label: string; value: number; displayValue: string;
  min: number; max: number; step: number;
  onChange: (v: number) => void; accentColor?: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-[11px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
          {label}
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
      />
    </div>
  );
}

export default function ConfigPanel() {
  const store = useSimStore();
  const { config, activePorts, activePresets } = store;
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        <div>
          <label className="text-[11px] uppercase tracking-wider mb-2.5 block font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Scenario Presets
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

        {/* ─── Vessel Type Toggle ─── */}
        <div>
          <label className="text-[11px] uppercase tracking-wider mb-2.5 block font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Vessel Type
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

        {/* ─── EV Controls ─── */}
        {config.vesselType === 'ev' && (
          <>
            {/* Battery Capacity */}
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-2.5 block font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                Battery Capacity
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
            />

            <SliderControl
              label="Cargo Load"
              value={config.cargoLoadPercent}
              displayValue={`${config.cargoLoadPercent}%`}
              min={0} max={100} step={5}
              onChange={(v) => store.setCargoLoad(v)}
            />

            {/* Efficiency Package toggle */}
            <div className="flex items-center justify-between py-1">
              <label className="text-[11px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                Efficiency Package
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
            />

            {/* ─── Charging Ports ─── */}
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-2.5 block font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                Charging Ports
                <span className="ml-2 text-[11px] font-bold" style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                  {config.portConfigs.filter(p => p.hasCharger).length}/{activePorts.length}
                </span>
              </label>
              <div className="max-h-56 overflow-y-auto rounded-xl" style={{
                border: '1px solid var(--card-border)',
                background: 'var(--glass)',
              }}>
                {activePorts.map((port) => {
                  const pc = config.portConfigs[port.id];
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
                        title="Toggle charging station — allows the ship to recharge at this port"
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
                        title={pc.hasCharger ? "Toggle buffer battery — stores grid energy locally for faster 12 MW charging on weak grids" : "Enable charger first to use buffer battery"}
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
                  label="Cube Exponent (n)"
                  value={config.cubeExponent}
                  displayValue={config.cubeExponent.toFixed(2)}
                  min={2.7} max={3.0} step={0.01}
                  onChange={(v) => store.setCubeExponent(v)}
                />

                <SliderControl
                  label="Discount Rate"
                  value={config.discountRate}
                  displayValue={`${(config.discountRate * 100).toFixed(0)}%`}
                  min={0.03} max={0.15} step={0.01}
                  onChange={(v) => store.setDiscountRate(v)}
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
                />

                <SliderControl
                  label="Connection Overhead"
                  value={config.connectionOverheadMinutes}
                  displayValue={`${config.connectionOverheadMinutes} min`}
                  min={0} max={20} step={1}
                  onChange={(v) => store.setConnectionOverheadMinutes(v)}
                />

                <SliderControl
                  label="Battery Efficiency"
                  value={config.batteryEfficiency}
                  displayValue={`${(config.batteryEfficiency * 100).toFixed(0)}%`}
                  min={0.85} max={1.0} step={0.01}
                  onChange={(v) => store.setBatteryEfficiency(v)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
