// Sea Zero — Engine type definitions

import { GridTier } from '@/data/ports';
import { VoyageMode, LegDirection } from './voyage';

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
  /** 'one-way' = Bergen -> Kirkenes (Exhibit 2). 'roundtrip' = there and back. */
  voyageMode: VoyageMode;
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
  carbonPricePerTon: number;   // $/tonne CO2e applied to both vessels
  scheduleToleranceHours: number; // allowed drift from the Exhibit 2 timetable
  chargePowerMW: number;       // shore connector rating, 6–30, case design point 12
  portConfigs: PortConfig[];
}

/** Result for a single leg */
export interface LegResult {
  legIndex: number;
  /** Unique across the voyage — a roundtrip visits most ports twice. */
  voyageIndex: number;
  direction: LegDirection;
  fromPortId: number;
  toPortId: number;
  fromPortName: string;
  toPortName: string;
  distanceKm: number;

  // ── Timing ──
  baselineSailHours: number;     // Exhibit 2 scheduled sailing time
  sailTimeHours: number;         // at the configured speed
  dwellMinutes: number;          // Exhibit 2 scheduled port stay at the destination

  // ── Energy demand (vessel-agnostic) ──
  propulsionPowerMW: number;
  hotelPowerMW: number;
  sailingEnergyMWh: number;      // energy delivered to loads while sailing
  portHotelEnergyMWh: number;    // energy delivered to hotel load while docked
  legEnergyMWh: number;          // sailing + port hotel
  cumulativeEnergyMWh: number;   // running total from origin

  // ── ICE equivalent for this leg ──
  fuelTonnes: number;
  iceCO2Tonnes: number;
  cumulativeFuelTonnes: number;

  // ── Battery / charging (EV) ──
  batteryDrawMWh: number;        // SoC drained (includes discharge loss)
  socBeforeMWh: number;
  socAfterSailingMWh: number;    // after sailing, before charging
  chargeGainedMWh: number;       // energy stored in the battery (after efficiency)
  chargeGainedRawMWh: number;    // energy drawn from the grid (before efficiency loss)
  socAfterPortMWh: number;       // final SoC after charging + hotel at port
  lowestSocMWh: number;          // lowest SoC reached during this leg + port stay
  marginPercent: number;         // (lowestSoc - reserveFloor) / batteryMWh * 100

  // ── Diagnostics ──
  isDeadZone: boolean;           // SoC dropped below the reserve floor
  energyShortfallMWh: number;    // energy the battery could not supply (SoC hit 0)
  isGridThrottled: boolean;      // charging limited below 12 MW by the local grid
  scheduleSlipMinutes: number;   // extra dwell needed to depart with enough charge
  effectiveChargePowerMW: number;
  effectiveChargingMinutes: number; // actual charging time after connection overhead
  ccCvPhaseSplit: number;        // fraction of charge that happened in the CC phase (0–1)
}

/** Full simulation result */
export interface SimulationResult {
  vesselType: 'ev' | 'ice';
  voyageMode: VoyageMode;
  legs: LegResult[];

  /** Scheduled port calls over the voyage — 34 northbound, 67 for a roundtrip. */
  portCallCount: number;

  // ── Route / timing ──
  totalDistanceKm: number;
  totalSailingHours: number;
  scheduledVoyageHours: number;   // Exhibit 2 sailing + dwell
  actualVoyageHours: number;      // at the configured speed, incl. charging slip
  scheduleDeviationHours: number; // actual − scheduled (positive = late)
  onSchedule: boolean;

  // ── Energy (vessel-agnostic) ──
  totalEnergyMWh: number;         // delivered to loads (propulsion + hotel, sailing + port)
  totalFuelTonnes: number;        // marine gas oil, if this voyage were run on ICE

  // ── Battery / grid (EV) ──
  totalBatteryDrawMWh: number;    // SoC drained, including discharge losses
  totalChargedMWh: number;        // stored in the battery at ports
  initialChargeGridMWh: number;   // grid energy to fill the battery before departure
  totalGridEnergyMWh: number;     // everything bought from the grid, incl. losses

  // ── Energy balance: can the timetable physically deliver the energy? ──
  chargingWindowHours: number;    // dwell time at charger ports, net of connection overhead
  chargingCapacityMWh: number;    // upper bound on energy deliverable in that window
  energyBalanceMWh: number;       // capacity + initial charge − grid demand (negative = short)
  deadZoneCount: number;
  totalEnergyShortfallMWh: number;
  worstMarginPercent: number;
  totalScheduleSlipMinutes: number;
  gridThrottledPortCount: number;
  chargingPortCount: number;
  bufferBatteryCount: number;

  // ── Verdict ──
  feasible: boolean;
  infeasibleReason: string;
}

/** Annual cash flow for one year (year 0 = capex, years 1–10 = opex) */
export interface AnnualCashFlow {
  year: number;
  // EV components (undiscounted)
  evVessel: number;
  evBattery: number;
  evEfficiency: number;
  evChargingInfra: number;
  evEnergy: number;
  evCarbon: number;
  evTotal: number;
  // ICE components (undiscounted)
  iceVessel: number;
  iceEfficiency: number;
  iceFuel: number;
  iceCarbon: number;
  iceTotal: number;
  // Delta (undiscounted)
  delta: number;
  // Discounted variants
  evTotalDiscounted: number;
  iceTotalDiscounted: number;
  deltaDiscounted: number;
}

/** One category's contribution to the NPV gap */
export interface NpvComponent {
  category: string;
  evCost: number;       // discounted 10yr total
  iceCost: number;      // discounted 10yr total
  delta: number;        // ev - ice (positive = EV more expensive in this category)
  color: string;
}

/** Economics result */
export interface EconomicsResult {
  // EV costs (10-year)
  evVesselCost: number;
  evBatteryCost: number;
  evEfficiencyCost: number;
  evChargingInfraCost: number;
  evEnergyCost10yr: number;       // discounted
  evCarbonCost10yr: number;       // discounted — grid CO2 is not zero
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
  /** null when there is no meaningful abatement to divide by */
  costPerTonCO2Abated: number | null;
  voyagesPerYear: number;

  // Detailed breakdowns for explorable charts
  annualCashFlows: AnnualCashFlow[];  // 11 entries (year 0–10)
  npvComponents: NpvComponent[];      // ~6 categories
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
