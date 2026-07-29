// Sea Zero — Scenario presets
// Generates presets dynamically based on active port list

import { PORTS as DEFAULT_PORTS, Port } from '@/data/ports';
import { SimulationConfig, PortConfig } from '@/engine/types';

function makePortConfigs(
  ports: Port[],
  chargerPortIds: number[],
  bufferPortIds: number[] = []
): PortConfig[] {
  return ports.map((port) => ({
    portId: port.id,
    hasCharger: chargerPortIds.includes(port.id),
    hasBufferBattery: bufferPortIds.includes(port.id),
    gridTier: port.gridTier,
  }));
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  config: SimulationConfig;
}

const BASE_CONFIG: Omit<SimulationConfig, 'portConfigs'> = {
  vesselType: 'ev',
  batteryMWh: 70,
  speedKnots: 13.2,
  cargoLoadPercent: 70,
  efficiencyPackage: false,
  reservePercent: 15,
  cubeExponent: 3.0,
  discountRate: 0.08,
  seaMarginPercent: 15,
  connectionOverheadMinutes: 10,
  batteryEfficiency: 0.92,
};

/**
 * Generate presets dynamically for any set of ports.
 * Adapts the charging strategy based on available grid tiers.
 */
export function generatePresetsForRoute(ports: Port[]): Preset[] {
  // Categorize ports by grid tier
  const strongPorts = ports.filter((p) => p.gridTier === 'strong').map((p) => p.id);
  const mediumPorts = ports.filter((p) => p.gridTier === 'medium').map((p) => p.id);
  const weakPorts = ports.filter((p) => p.gridTier === 'weak').map((p) => p.id);

  // Always include first and last port in hub chargers
  const hubIds = new Set(strongPorts);
  if (ports.length > 0) hubIds.add(ports[0].id);
  if (ports.length > 1) hubIds.add(ports[ports.length - 1].id);
  const hubs = Array.from(hubIds);

  // Dense: all strong + medium
  const denseChargers = [...hubs, ...mediumPorts.filter((id) => !hubIds.has(id))];

  // Identify weak ports in the second half of the route for buffer batteries
  const halfwayIndex = Math.floor(ports.length / 2);
  const weakSecondHalf = ports
    .filter((p, i) => i >= halfwayIndex && p.gridTier === 'weak')
    .map((p) => p.id);

  const presets: Preset[] = [
    {
      id: 'sparse-big',
      name: 'Sparse & Big',
      description: `70 MWh battery, ${hubs.length} hub chargers only`,
      config: {
        ...BASE_CONFIG,
        batteryMWh: 70,
        portConfigs: makePortConfigs(ports, hubs),
      },
    },
    {
      id: 'dense-small',
      name: 'Dense & Small',
      description: `50 MWh battery, ${denseChargers.length} chargers (strong + medium)`,
      config: {
        ...BASE_CONFIG,
        batteryMWh: 50,
        portConfigs: makePortConfigs(ports, denseChargers),
      },
    },
    {
      id: 'buffered-north',
      name: 'Buffered Extended',
      description: `50 MWh, dense chargers + buffers on weak-grid ports`,
      config: {
        ...BASE_CONFIG,
        batteryMWh: 50,
        efficiencyPackage: true,
        portConfigs: makePortConfigs(
          ports,
          [...denseChargers, ...weakSecondHalf],
          weakSecondHalf
        ),
      },
    },
    {
      id: 'ice-benchmark',
      name: 'ICE Benchmark',
      description: 'Conventional diesel vessel for comparison',
      config: {
        ...BASE_CONFIG,
        vesselType: 'ice',
        portConfigs: makePortConfigs(ports, []),
      },
    },
  ];

  return presets;
}

// ─── Default Hurtigruten Presets ───

// Strong-grid hub port IDs
const STRONG_HUBS = [0, 7, 13, 21, 33]; // Bergen, Trondheim, Bodø, Tromsø, Kirkenes

// Medium-grid ports
const MEDIUM_PORTS = [4, 6, 19, 24, 26, 15, 10]; // Ålesund, Kristiansund, Harstad, Hammerfest, Honningsvåg, Svolvær, Sandnessjøen

// All strong + medium
const DENSE_CHARGERS = [...STRONG_HUBS, ...MEDIUM_PORTS];

// Weak-grid ports north of Bodø (id >= 14, excluding strong/medium)
const WEAK_NORTH_PORTS = DEFAULT_PORTS
  .filter((p) => p.id >= 14 && p.gridTier === 'weak')
  .map((p) => p.id);

export const PRESETS: Preset[] = [
  {
    id: 'sparse-big',
    name: 'Sparse & Big',
    description: '70 MWh battery, 5 hub chargers only',
    config: {
      ...BASE_CONFIG,
      batteryMWh: 70,
      portConfigs: makePortConfigs(DEFAULT_PORTS, STRONG_HUBS),
    },
  },
  {
    id: 'dense-small',
    name: 'Dense & Small',
    description: '50 MWh battery, ~12 chargers (all strong + medium)',
    config: {
      ...BASE_CONFIG,
      batteryMWh: 50,
      portConfigs: makePortConfigs(DEFAULT_PORTS, DENSE_CHARGERS),
    },
  },
  {
    id: 'buffered-north',
    name: 'Buffered North',
    description: '50 MWh, dense chargers + buffers on weak-grid northern ports',
    config: {
      ...BASE_CONFIG,
      batteryMWh: 50,
      efficiencyPackage: true,
      portConfigs: makePortConfigs(
        DEFAULT_PORTS,
        [...DENSE_CHARGERS, ...WEAK_NORTH_PORTS],
        WEAK_NORTH_PORTS
      ),
    },
  },
  {
    id: 'ice-benchmark',
    name: 'ICE Benchmark',
    description: 'Conventional diesel vessel for comparison',
    config: {
      ...BASE_CONFIG,
      vesselType: 'ice',
      portConfigs: makePortConfigs(DEFAULT_PORTS, []),
    },
  },
];

export const DEFAULT_CONFIG: SimulationConfig = PRESETS[0].config;
