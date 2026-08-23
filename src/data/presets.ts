// Sea Zero — Scenario presets
// Generates presets dynamically based on the active port list.

import { PORTS as DEFAULT_PORTS, Port } from '@/data/ports';
import { SimulationConfig, PortConfig } from '@/engine/types';
import {
  REF_SPEED_KNOTS,
  DEFAULT_CARBON_PRICE_PER_TON,
  DEFAULT_SCHEDULE_TOLERANCE_HOURS,
  DESIGN_CHARGE_POWER_MW,
  DEFAULT_CUBE_EXPONENT,
} from '@/engine/constants';

function makePortConfigs(
  ports: Port[],
  chargerPortIds: number[],
  bufferPortIds: number[] = [],
): PortConfig[] {
  const chargers = new Set(chargerPortIds);
  const buffers = new Set(bufferPortIds);
  return ports.map((port) => ({
    portId: port.id,
    hasCharger: chargers.has(port.id),
    hasBufferBattery: buffers.has(port.id),
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
  // The service Hurtigruten actually runs is Bergen -> Kirkenes -> Bergen.
  voyageMode: 'roundtrip',
  batteryMWh: 70,
  speedKnots: REF_SPEED_KNOTS,
  cargoLoadPercent: 70,
  efficiencyPackage: true, // the case's 2 MW / 0.6 MW design point assumes it
  reservePercent: 15,
  cubeExponent: DEFAULT_CUBE_EXPONENT,
  discountRate: 0.08,
  seaMarginPercent: 15,
  connectionOverheadMinutes: 10,
  batteryEfficiency: 0.92,
  carbonPricePerTon: DEFAULT_CARBON_PRICE_PER_TON,
  scheduleToleranceHours: DEFAULT_SCHEDULE_TOLERANCE_HOURS,
  chargePowerMW: DESIGN_CHARGE_POWER_MW,
};

/**
 * Build the four scenarios for an arbitrary ordered port list.
 *
 * The origin always gets a charger — the ship has to be filled somewhere
 * before it departs, and the simulator charges for that energy.
 */
export function generatePresetsForRoute(ports: Port[]): Preset[] {
  if (ports.length === 0) {
    return [{
      id: 'empty',
      name: 'No Route',
      description: 'Upload a route to begin',
      config: { ...BASE_CONFIG, portConfigs: [] },
    }];
  }

  const originId = ports[0].id;
  const terminusId = ports[ports.length - 1].id;

  const strongPorts = ports.filter((p) => p.gridTier === 'strong').map((p) => p.id);

  // Hubs: every strong-grid port, plus both ends of the route.
  const hubs = Array.from(new Set([originId, terminusId, ...strongPorts]));

  // Every port, with buffer batteries anywhere the local grid cannot sustain
  // the full connector rating on its own.
  const allIds = ports.map((p) => p.id);
  const nonStrongIds = ports.filter((p) => p.gridTier !== 'strong').map((p) => p.id);

  return [
    {
      id: 'case-design',
      name: 'Case Design',
      description:
        `70 MWh battery, ${hubs.length} hub chargers at ${DESIGN_CHARGE_POWER_MW} MW. Hurtigruten's starting point, Nov 2024.`,
      config: {
        ...BASE_CONFIG,
        batteryMWh: 70,
        portConfigs: makePortConfigs(ports, hubs),
      },
    },
    {
      id: 'dense-network',
      name: 'Dense Network',
      description:
        `70 MWh, chargers at all ${allIds.length} ports, buffer batteries off the strong grid. The most a ${DESIGN_CHARGE_POWER_MW} MW design can do.`,
      config: {
        ...BASE_CONFIG,
        batteryMWh: 70,
        portConfigs: makePortConfigs(ports, allIds, nonStrongIds),
      },
    },
    {
      id: 'grid-upgrade',
      name: 'Grid Upgrade',
      description:
        '70 MWh, 16 MW connectors, 2-minute hookup at every port. The cheapest setup that completes the voyage.',
      config: {
        ...BASE_CONFIG,
        batteryMWh: 70,
        chargePowerMW: 16,
        connectionOverheadMinutes: 2,
        portConfigs: makePortConfigs(ports, allIds, nonStrongIds),
      },
    },
    {
      id: 'ice-benchmark',
      name: 'ICE Benchmark',
      description: 'Efficiency-upgraded conventional vessel. The lower-risk bid.',
      config: {
        ...BASE_CONFIG,
        vesselType: 'ice',
        batteryMWh: 70,
        chargePowerMW: 16,
        connectionOverheadMinutes: 2,
        // Same charging network as "Grid Upgrade" so the EV column of the
        // comparison describes the EV Hurtigruten would actually build, rather
        // than a hypothetical EV with nowhere to plug in.
        portConfigs: makePortConfigs(ports, allIds, nonStrongIds),
      },
    },
  ];
}

// ─── Default Hurtigruten presets (Bergen → Kirkenes) ───

export const PRESETS: Preset[] = generatePresetsForRoute(DEFAULT_PORTS);

/**
 * Landing configuration. "Grid Upgrade" is the only preset that completes the
 * voyage, so the app opens on a working baseline the user can then degrade
 * back toward the case's own numbers to see where they stop closing.
 */
export const DEFAULT_CONFIG: SimulationConfig =
  PRESETS.find((p) => p.id === 'grid-upgrade')?.config ?? PRESETS[0].config;
