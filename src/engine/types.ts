// Sea Zero — Engine type definitions

import { GridTier } from '@/data/ports';

/** Per-port configuration (user-toggleable) */
export interface PortConfig {
  portId: number;
  hasCharger: boolean;
  hasBufferBattery: boolean;
  gridTier: GridTier;       // can be overridden by user
}

/** Top-level simulation configuration */
export interface SimulationConfig {
  vesselType: 'ev' | 'ice';
  batteryMWh: 50 | 70;
  speedKnots: number;          // 10–16
  cargoLoadPercent: number;    // 0–100
  efficiencyPackage: boolean;
  reservePercent: number;      // 5–30, default 15
  cubeExponent: number;        // 2.7–3.0, default 3.0
  discountRate: number;        // default 0.08
  seaMarginPercent: number;    // 0–40, default 15 — weather/wave drag factor
  connectionOverheadMinutes: number; // 0–20, default 10 — cable connect/disconnect time
  batteryEfficiency: number;   // 0.85–1.0, default 0.92 — round-trip efficiency
  portConfigs: PortConfig[];
}

/** Result for a single leg */
export interface LegResult {
  legIndex: number;
  fromPortName: string;
  toPortName: string;
  distanceKm: number;
  sailTimeHours: number;
  propulsionPowerMW: number;
  hotelPowerMW: number;
  energyConsumedMWh: number;
  socBeforeMWh: number;
  socAfterSailingMWh: number;    // after sailing, before charging
  chargeGainedMWh: number;       // energy gained at destination port (after efficiency)
  chargeGainedRawMWh: number;    // energy drawn from grid (before efficiency loss)
  hotelEnergyAtPortMWh: number;  // hotel energy consumed during port stay
  socAfterPortMWh: number;       // final SoC after charging + hotel at port
  isDeadZone: boolean;           // SoC dropped below reserve floor during this leg
  lowestSocMWh: number;          // lowest SoC reached during this leg
  marginPercent: number;         // (lowestSoc - reserveFloor) / batteryMWh * 100
  isGridThrottled: boolean;      // charging was throttled below 12 MW
  scheduleSlipMinutes: number;   // extra time needed for full charge
  dwellMinutes: number;
  effectiveChargePowerMW: number;
  effectiveChargingMinutes: number; // actual charging time after connection overhead
  ccCvPhaseSplit: number;        // fraction of charge that happened in CC phase (0–1)
}

/** Full simulation result */
export interface SimulationResult {
  legs: LegResult[];
  totalEnergyMWh: number;
  totalSailingHours: number;
  totalDistanceKm: number;
  totalChargedMWh: number;
  deadZoneCount: number;
  worstMarginPercent: number;
  totalScheduleSlipMinutes: number;
  gridThrottledPortCount: number;
  feasible: boolean;
  infeasibleReason: string;
  chargingPortCount: number;
  bufferBatteryCount: number;
}

/** Economics result */
export interface EconomicsResult {
  // EV costs (10-year)
  evVesselCost: number;
  evBatteryCost: number;
  evEfficiencyCost: number;
  evChargingInfraCost: number;
  evEnergyCost10yr: number;       // discounted
  evCarbonCost10yr: number;       // EV has zero carbon fines
  evTotalTCO: number;

  // ICE costs (10-year)
  iceVesselCost: number;
  icePropulsionCost: number;
  iceEfficiencyCost: number;
  iceChargingInfraCost: number;
  iceFuelCost10yr: number;        // discounted
  iceCarbonFines10yr: number;     // discounted
  iceTotalTCO: number;

  npvGap: number;                 // EV - ICE (negative = EV saves money)
  costPerTonCO2Abated: number;
  voyagesPerYear: number;
}

/** Emissions result */
export interface EmissionsResult {
  evCO2PerVoyageTons: number;
  iceCO2PerVoyageTons: number;
  evCO2PerYear: number;
  iceCO2PerYear: number;
  co2AbatedPerVoyage: number;
  co2Abated10yr: number;
  /** Cumulative CO2 arrays for charting (index = year 0..10) */
  evCumulativeCO2: number[];
  iceCumulativeCO2: number[];
}
