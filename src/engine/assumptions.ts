// Sea Zero — Overridable price and intensity assumptions
//
// The numbers in constants.ts are the case's own. Everything downstream used
// to import them directly, which made them impossible to vary — so there was
// no way to ask "what if MGO goes back to Exhibit 6's 2020 lows?" without
// editing source.
//
// This module wraps the varying ones in a single record that computeEconomics
// and computeEmissions accept as an optional argument. Omit it and you get the
// case exactly; pass a partial override and you get a scenario.

import {
  MGO_COST_PER_TONNE,
  ELECTRICITY_COST_PER_KWH,
  BATTERY_COST_PER_MWH,
  CHARGING_INFRA_PER_PORT,
  GRID_CO2_G_PER_KWH,
  ICE_CO2_TONNES_PER_MWH,
  DESIGN_CHARGE_POWER_MW,
} from './constants';

export interface Assumptions {
  /** Marine gas oil, $/tonne. Case p.4: $1200. Exhibit 6 spans roughly €300–€1450. */
  mgoCostPerTonne: number;
  /** Electricity, $/kWh. Case p.4: 75 øre ≈ $0.07. */
  electricityCostPerKWh: number;
  /** Installed marine battery, $/MWh. Case implies ~$803.6k (22.5% of $250M / 70 MWh). */
  batteryCostPerMWh: number;
  /** Shore charging installation at the 12 MW design point, $/port. Case p.7: $1M. */
  chargingInfraPerPort: number;
  /** Grid carbon intensity, g CO2/kWh. Case p.4: 30 (Norway). Exhibit 7 gives other mixes. */
  gridCO2gPerKWh: number;
  /** CO2e per MWh of delivered energy on marine gas oil, tonnes. Case p.5: 1.6/2.6. */
  iceCO2TonnesPerMWh: number;
}

/** The case's own numbers — the default for every call. */
export const CASE_ASSUMPTIONS: Assumptions = {
  mgoCostPerTonne: MGO_COST_PER_TONNE,
  electricityCostPerKWh: ELECTRICITY_COST_PER_KWH,
  batteryCostPerMWh: BATTERY_COST_PER_MWH,
  chargingInfraPerPort: CHARGING_INFRA_PER_PORT,
  gridCO2gPerKWh: GRID_CO2_G_PER_KWH,
  iceCO2TonnesPerMWh: ICE_CO2_TONNES_PER_MWH,
};

/** Fill in the case defaults for anything the caller left out. */
export function resolveAssumptions(partial?: Partial<Assumptions>): Assumptions {
  return partial ? { ...CASE_ASSUMPTIONS, ...partial } : CASE_ASSUMPTIONS;
}

/**
 * Per-port charging cost at a given connector rating.
 *
 * [ASSUMPTION] Linear in rating above the 12 MW design point — the case only
 * says grid upgrades could make the $1M/port "substantially higher".
 */
export function infraCostPerPort(base: number, chargePowerMW: number): number {
  return base * (chargePowerMW / DESIGN_CHARGE_POWER_MW);
}
