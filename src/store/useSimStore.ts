// Sea Zero — Zustand store
// Reactive state management for simulation config + results
// Supports dynamic routes (custom port/leg data)

import { create } from 'zustand';
import { PORTS as DEFAULT_PORTS, Port } from '@/data/ports';
import { LEGS as DEFAULT_LEGS, Leg } from '@/data/legs';
import { SimulationConfig, SimulationResult, EconomicsResult } from '@/engine/types';
import { EmissionsResult } from '@/engine/types';
import { simulate } from '@/engine/simulate';
import { computeEconomics } from '@/engine/economics';
import { computeEmissions } from '@/engine/emissions';
import { DEFAULT_CONFIG, PRESETS, generatePresetsForRoute, Preset } from '@/data/presets';
import { GridTier } from '@/data/ports';
import { VoyageMode } from '@/engine/voyage';
import { saveCustomRoute, loadCustomRoute, clearCustomRoute, CustomRoute } from '@/store/persistence';

interface PlaybackState {
  isPlaying: boolean;
  currentLegIndex: number;
  legProgress: number; // 0–1 within current leg
  elapsedHours: number;
  playbackSpeed: number; // 1, 2, 4, 8
  graphProgress: number; // 0–1 normalized across entire voyage (for chart sync)
  hasPlayedOnce: boolean; // true after first play press — charts switch to animated mode
}

interface SimStore {
  // Route data (dynamic)
  activePorts: Port[];
  activeLegs: Leg[];
  activePresets: Preset[];
  routeName: string;
  isCustomRoute: boolean;

  // Config
  config: SimulationConfig;

  // Computed results (derived on every config change)
  simResult: SimulationResult;
  economics: EconomicsResult;
  emissions: EmissionsResult;

  // Playback
  playback: PlaybackState;

  // Actions
  setVesselType: (type: 'ev' | 'ice') => void;
  setVoyageMode: (mode: VoyageMode) => void;
  setBatteryMWh: (mwh: 50 | 70) => void;
  setSpeedKnots: (kn: number) => void;
  setCargoLoad: (pct: number) => void;
  setEfficiencyPackage: (on: boolean) => void;
  setReservePercent: (pct: number) => void;
  setCubeExponent: (n: number) => void;
  setDiscountRate: (r: number) => void;
  toggleCharger: (portId: number) => void;
  toggleBufferBattery: (portId: number) => void;
  setPortGridTier: (portId: number, tier: GridTier) => void;
  setSeaMarginPercent: (pct: number) => void;
  setConnectionOverheadMinutes: (min: number) => void;
  setBatteryEfficiency: (eff: number) => void;
  setCarbonPrice: (usdPerTon: number) => void;
  setScheduleTolerance: (hours: number) => void;
  setChargePower: (mw: number) => void;
  applyPreset: (presetId: string) => void;

  // Route management
  loadRoute: (ports: Port[], legs: Leg[], routeName: string) => Promise<void>;
  resetToDefaultRoute: () => Promise<void>;
  initFromSavedRoute: () => Promise<void>;

  // Playback actions
  setPlaying: (playing: boolean) => void;
  setCurrentLeg: (legIndex: number, progress: number) => void;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Internal
  _recompute: () => void;
}

function recompute(config: SimulationConfig, ports: Port[], legs: Leg[]) {
  const simResult = simulate(config, ports, legs);
  const economics = computeEconomics(config, simResult);
  const emissions = computeEmissions(simResult);
  return { simResult, economics, emissions };
}

const initialResults = recompute(DEFAULT_CONFIG, DEFAULT_PORTS, DEFAULT_LEGS);

export const useSimStore = create<SimStore>((set, get) => ({
  activePorts: DEFAULT_PORTS,
  activeLegs: DEFAULT_LEGS,
  activePresets: PRESETS,
  routeName: 'Bergen → Kirkenes',
  isCustomRoute: false,

  config: DEFAULT_CONFIG,
  ...initialResults,

  playback: {
    isPlaying: false,
    currentLegIndex: 0,
    legProgress: 0,
    elapsedHours: 0,
    playbackSpeed: 1,
    graphProgress: 0,
    hasPlayedOnce: false,
  },

  setVesselType: (type) => {
    set((s) => {
      const config = { ...s.config, vesselType: type };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setVoyageMode: (mode) => {
    set((s) => {
      const config = { ...s.config, voyageMode: mode };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setBatteryMWh: (mwh) => {
    set((s) => {
      const config = { ...s.config, batteryMWh: mwh };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setSpeedKnots: (kn) => {
    set((s) => {
      const config = { ...s.config, speedKnots: kn };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setCargoLoad: (pct) => {
    set((s) => {
      const config = { ...s.config, cargoLoadPercent: pct };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setEfficiencyPackage: (on) => {
    set((s) => {
      const config = { ...s.config, efficiencyPackage: on };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setReservePercent: (pct) => {
    set((s) => {
      const config = { ...s.config, reservePercent: pct };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setCubeExponent: (n) => {
    set((s) => {
      const config = { ...s.config, cubeExponent: n };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setSeaMarginPercent: (pct) => {
    set((s) => {
      const config = { ...s.config, seaMarginPercent: pct };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setConnectionOverheadMinutes: (min) => {
    set((s) => {
      const config = { ...s.config, connectionOverheadMinutes: min };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setBatteryEfficiency: (eff) => {
    set((s) => {
      const config = { ...s.config, batteryEfficiency: eff };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setCarbonPrice: (usdPerTon) => {
    set((s) => {
      const config = { ...s.config, carbonPricePerTon: usdPerTon };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setScheduleTolerance: (hours) => {
    set((s) => {
      const config = { ...s.config, scheduleToleranceHours: hours };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setChargePower: (mw) => {
    set((s) => {
      const config = { ...s.config, chargePowerMW: mw };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setDiscountRate: (r) => {
    set((s) => {
      const config = { ...s.config, discountRate: r };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  toggleCharger: (portId) => {
    set((s) => {
      const portConfigs = s.config.portConfigs.map((p) =>
        p.portId === portId ? { ...p, hasCharger: !p.hasCharger } : p
      );
      const config = { ...s.config, portConfigs };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  toggleBufferBattery: (portId) => {
    set((s) => {
      const portConfigs = s.config.portConfigs.map((p) =>
        p.portId === portId ? { ...p, hasBufferBattery: !p.hasBufferBattery } : p
      );
      const config = { ...s.config, portConfigs };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  setPortGridTier: (portId, tier) => {
    set((s) => {
      const portConfigs = s.config.portConfigs.map((p) =>
        p.portId === portId ? { ...p, gridTier: tier } : p
      );
      const config = { ...s.config, portConfigs };
      return { config, ...recompute(config, s.activePorts, s.activeLegs) };
    });
  },

  applyPreset: (presetId) => {
    const s = get();
    const preset = s.activePresets.find((p) => p.id === presetId);
    if (!preset) return;
    set(() => {
      const config = { ...preset.config };
      return {
        config,
        ...recompute(config, s.activePorts, s.activeLegs),
        playback: { isPlaying: false, currentLegIndex: 0, legProgress: 0, elapsedHours: 0, playbackSpeed: 1, graphProgress: 0, hasPlayedOnce: false },
      };
    });
  },

  loadRoute: async (ports, legs, routeName) => {
    const presets = generatePresetsForRoute(ports);
    const defaultConfig = presets[0].config;
    const route: CustomRoute = {
      ports,
      legs,
      routeName,
      uploadedAt: Date.now(),
    };
    await saveCustomRoute(route);

    set(() => ({
      activePorts: ports,
      activeLegs: legs,
      activePresets: presets,
      routeName,
      isCustomRoute: true,
      config: defaultConfig,
      ...recompute(defaultConfig, ports, legs),
      playback: { isPlaying: false, currentLegIndex: 0, legProgress: 0, elapsedHours: 0, playbackSpeed: 1, graphProgress: 0, hasPlayedOnce: false },
    }));
  },

  resetToDefaultRoute: async () => {
    await clearCustomRoute();
    set(() => ({
      activePorts: DEFAULT_PORTS,
      activeLegs: DEFAULT_LEGS,
      activePresets: PRESETS,
      routeName: 'Bergen → Kirkenes',
      isCustomRoute: false,
      config: DEFAULT_CONFIG,
      ...recompute(DEFAULT_CONFIG, DEFAULT_PORTS, DEFAULT_LEGS),
      playback: { isPlaying: false, currentLegIndex: 0, legProgress: 0, elapsedHours: 0, playbackSpeed: 1, graphProgress: 0, hasPlayedOnce: false },
    }));
  },

  initFromSavedRoute: async () => {
    const saved = await loadCustomRoute();
    if (saved) {
      const presets = generatePresetsForRoute(saved.ports);
      const defaultConfig = presets[0].config;
      set(() => ({
        activePorts: saved.ports,
        activeLegs: saved.legs,
        activePresets: presets,
        routeName: saved.routeName,
        isCustomRoute: true,
        config: defaultConfig,
        ...recompute(defaultConfig, saved.ports, saved.legs),
        playback: { isPlaying: false, currentLegIndex: 0, legProgress: 0, elapsedHours: 0, playbackSpeed: 1, graphProgress: 0, hasPlayedOnce: false },
      }));
    }
  },

  setPlaying: (playing) => {
    set((s) => ({ playback: { ...s.playback, isPlaying: playing } }));
  },

  setCurrentLeg: (legIndex, progress) => {
    set((s) => ({ playback: { ...s.playback, currentLegIndex: legIndex, legProgress: progress } }));
  },

  setPlaybackState: (state) => {
    set((s) => ({ playback: { ...s.playback, ...state } }));
  },

  setPlaybackSpeed: (speed) => {
    set((s) => ({ playback: { ...s.playback, playbackSpeed: speed } }));
  },

  _recompute: () => {
    set((s) => ({ ...recompute(s.config, s.activePorts, s.activeLegs) }));
  },
}));
