'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSimStore } from '@/store/useSimStore';
import { Lock, Unlock, Save, Loader2 } from 'lucide-react';

/**
 * All freezable simulation controls.
 * Each entry maps a config key to a human-readable label.
 */
const FREEZABLE_CONTROLS: { key: string; label: string; group: string }[] = [
  // Core
  { key: 'vesselType', label: 'Vessel Type (EV / ICE)', group: 'Core' },
  { key: 'voyageMode', label: 'Voyage Mode', group: 'Core' },
  { key: 'batteryMWh', label: 'Battery Capacity', group: 'Core' },
  { key: 'speedKnots', label: 'Sailing Speed', group: 'Core' },
  { key: 'cargoLoadPercent', label: 'Cargo Load', group: 'Core' },
  { key: 'efficiencyPackage', label: 'Efficiency Package', group: 'Core' },
  { key: 'reservePercent', label: 'Reserve Floor', group: 'Core' },
  // Port infrastructure
  { key: 'portConfigs', label: 'Charging Ports (all port toggles)', group: 'Ports' },
  // Advanced — Physics
  { key: 'cubeExponent', label: 'Speed Exponent (n)', group: 'Physics' },
  { key: 'seaMarginPercent', label: 'Sea Margin', group: 'Physics' },
  { key: 'connectionOverheadMinutes', label: 'Connection Overhead', group: 'Physics' },
  { key: 'batteryEfficiency', label: 'Battery Efficiency', group: 'Physics' },
  { key: 'chargePowerMW', label: 'Charger Rating', group: 'Physics' },
  // Advanced — Commercial
  { key: 'discountRate', label: 'Discount Rate', group: 'Commercial' },
  { key: 'carbonPricePerTon', label: 'Carbon Price', group: 'Commercial' },
  { key: 'scheduleToleranceHours', label: 'Schedule Tolerance', group: 'Commercial' },
];

function formatValue(key: string, value: unknown): string {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'boolean') return value ? 'ON' : 'OFF';
  if (key === 'vesselType') return String(value).toUpperCase();
  if (key === 'voyageMode') return value === 'roundtrip' ? 'Roundtrip' : 'One-Way';
  if (key === 'batteryMWh') return `${value} MWh`;
  if (key === 'speedKnots') return `${Number(value).toFixed(1)} kn`;
  if (key === 'cargoLoadPercent' || key === 'reservePercent' || key === 'seaMarginPercent')
    return `${value}%`;
  if (key === 'discountRate') return `${(Number(value) * 100).toFixed(0)}%`;
  if (key === 'batteryEfficiency') return `${(Number(value) * 100).toFixed(0)}%`;
  if (key === 'cubeExponent') return Number(value).toFixed(2);
  if (key === 'connectionOverheadMinutes') return `${value} min`;
  if (key === 'chargePowerMW') return `${value} MW`;
  if (key === 'carbonPricePerTon') return `$${value}/t`;
  if (key === 'scheduleToleranceHours') return `${value} h`;
  if (key === 'portConfigs') return `${Array.isArray(value) ? value.length : '?'} ports`;
  return String(value);
}

export default function FreezeManager() {
  const config = useSimStore((s) => s.config);
  const [lockedKeys, setLockedKeys] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load current frozen state from the API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/frozen-controls');
        if (res.ok) {
          const data = await res.json();
          setLockedKeys(data.lockedKeys ?? {});
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleFreeze = useCallback(
    (key: string) => {
      setLockedKeys((prev) => {
        const next = { ...prev };
        if (key in next) {
          // Unfreeze
          delete next[key];
        } else {
          // Freeze at current config value
          next[key] = (config as unknown as Record<string, unknown>)[key];
        }
        return next;
      });
      setDirty(true);
    },
    [config],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/frozen-controls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockedKeys }),
      });
      if (res.ok) {
        setDirty(false);
        // Reload frozen controls in the sim store so the ConfigPanel updates
        useSimStore.getState().loadFrozenControls();
      }
    } catch {
      // Ignore
    } finally {
      setSaving(false);
    }
  }, [lockedKeys]);

  // Group controls
  const groups = Array.from(new Set(FREEZABLE_CONTROLS.map((c) => c.group)));

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
        <Loader2 size={14} className="animate-spin" /> Loading frozen controls…
      </div>
    );
  }

  const frozenCount = Object.keys(lockedKeys).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--amber)' }} />
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
          Freeze Controls
        </h2>
        {frozenCount > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--amber)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {frozenCount} locked
          </span>
        )}
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
        Frozen controls lock at their current values for all users until unfrozen.
      </p>

      {/* Control groups */}
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group}>
            <span
              className="text-[10px] uppercase tracking-widest mb-2 block font-semibold"
              style={{
                color: group === 'Core' ? 'var(--cyan)' : group === 'Ports' ? 'var(--green)' : group === 'Physics' ? 'var(--steel)' : 'var(--amber)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.12em',
              }}
            >
              {group}
            </span>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--card-border)', background: 'var(--glass)' }}
            >
              {FREEZABLE_CONTROLS.filter((c) => c.group === group).map((control) => {
                const isFrozen = control.key in lockedKeys;
                const currentValue = (config as unknown as Record<string, unknown>)[control.key];
                const frozenValue = lockedKeys[control.key];

                return (
                  <div
                    key={control.key}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isFrozen ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
                    }}
                  >
                    {/* Toggle button */}
                    <button
                      onClick={() => toggleFreeze(control.key)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                      style={{
                        border: `1px solid ${isFrozen ? 'rgba(245, 158, 11, 0.3)' : 'var(--card-border)'}`,
                        backgroundColor: isFrozen ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                        color: isFrozen ? 'var(--amber)' : 'var(--text-muted)',
                      }}
                      title={isFrozen ? `Unfreeze ${control.label}` : `Freeze ${control.label} at current value`}
                    >
                      {isFrozen ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>

                    {/* Label */}
                    <span
                      className="flex-1 min-w-0 text-[12px] font-medium leading-snug"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: isFrozen ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {control.label}
                    </span>

                    {/* Value badge */}
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-md flex-shrink-0"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: isFrozen ? 'var(--amber)' : 'var(--text-muted)',
                        background: isFrozen ? 'rgba(245, 158, 11, 0.08)' : 'var(--glass-strong)',
                        border: isFrozen ? '1px solid rgba(245, 158, 11, 0.15)' : '1px solid transparent',
                      }}
                    >
                      {isFrozen ? formatValue(control.key, frozenValue) : formatValue(control.key, currentValue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          style={{
            fontFamily: 'var(--font-display)',
            background: dirty ? 'rgba(245, 158, 11, 0.15)' : 'var(--glass-strong)',
            color: dirty ? 'var(--amber)' : 'var(--text-muted)',
            border: `1px solid ${dirty ? 'rgba(245, 158, 11, 0.3)' : 'var(--card-border)'}`,
            opacity: !dirty || saving ? 0.5 : 1,
            cursor: !dirty || saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Frozen Controls'}
        </button>
        {dirty && (
          <span className="text-[10px]" style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)' }}>
            Unsaved changes
          </span>
        )}
      </div>
    </div>
  );
}
