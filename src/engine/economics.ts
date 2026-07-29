// Sea Zero — Economics module
// 10-year discounted TCO comparison, EV vs ICE

import { SimulationConfig, SimulationResult, EconomicsResult } from './types';

// Constants
const VOYAGES_PER_YEAR = 11 * 2; // ~11 roundtrips/year (northbound + southbound, roughly every 16 days)
// More realistically: the route takes ~5.5 days one way, with turnarounds.
// Hurtigruten runs daily sailings but with a fleet. One vessel: ~33 voyages/year.
const SINGLE_VESSEL_VOYAGES_PER_YEAR = 33;

const EV_BASE_VESSEL_COST = 250_000_000;  // $250M total for 70MWh version
const BATTERY_COST_70MWH = 56_000_000;    // $56M for 70 MWh
const BATTERY_COST_PER_MWH = BATTERY_COST_70MWH / 70; // $800k/MWh
const EFFICIENCY_PACKAGE_COST = 30_000_000; // $30M
const CHARGING_INFRA_PER_PORT = 1_000_000;  // $1M/port

const EV_ENERGY_COST_PER_KWH = 0.07; // $0.07/kWh
const ICE_FUEL_RATE_T_PER_HR = 0.5;  // 0.5 tonnes/hr
const ICE_FUEL_COST_PER_T = 1200;    // $1,200/tonne
const ICE_CO2_PER_SAILING_HR = 1.6;  // tonnes CO2e
const CARBON_FINE_PER_TON = 190;     // $190/ton CO2

const EV_GRID_CO2_G_PER_KWH = 30;   // 30 g CO2/kWh

/**
 * Compute 10-year discounted TCO for EV vs ICE.
 */
export function computeEconomics(
  config: SimulationConfig,
  simResult: SimulationResult
): EconomicsResult {
  const { batteryMWh, efficiencyPackage, discountRate, portConfigs } = config;
  const voyagesPerYear = SINGLE_VESSEL_VOYAGES_PER_YEAR;

  // --- EV COSTS ---
  const evBatteryCost = BATTERY_COST_PER_MWH * batteryMWh;
  const evVesselCost = EV_BASE_VESSEL_COST - BATTERY_COST_70MWH; // hull + systems without battery
  const evEfficiencyCost = efficiencyPackage ? EFFICIENCY_PACKAGE_COST : 0;
  
  const chargingPorts = portConfigs.filter((p) => p.hasCharger).length;
  const evChargingInfraCost = chargingPorts * CHARGING_INFRA_PER_PORT;

  // Annual EV energy cost
  const evEnergyPerVoyageMWh = simResult.totalEnergyMWh;
  const evEnergyPerVoyageKWh = evEnergyPerVoyageMWh * 1000;
  const evAnnualEnergyCost = evEnergyPerVoyageKWh * EV_ENERGY_COST_PER_KWH * voyagesPerYear;

  // Discount annual costs over 10 years
  let evEnergyCost10yr = 0;
  for (let y = 1; y <= 10; y++) {
    evEnergyCost10yr += evAnnualEnergyCost / Math.pow(1 + discountRate, y);
  }

  const evTotalTCO =
    evVesselCost + evBatteryCost + evEfficiencyCost + evChargingInfraCost + evEnergyCost10yr;

  // --- ICE COSTS ---
  const iceVesselCost = 200_000_000; // ICE vessel ~$200M
  const icePropulsionCost = 0; // included in vessel
  const iceEfficiencyCost = 0;
  const iceChargingInfraCost = 0;

  // ICE fuel: 0.5 t/hr × sailingHours × $1200/t
  const iceFuelPerVoyage = ICE_FUEL_RATE_T_PER_HR * simResult.totalSailingHours * ICE_FUEL_COST_PER_T;
  const iceAnnualFuel = iceFuelPerVoyage * voyagesPerYear;

  // ICE carbon fines: CO2 per voyage × $190/ton
  const iceCO2PerVoyage = ICE_CO2_PER_SAILING_HR * simResult.totalSailingHours;
  const iceAnnualCarbonFines = iceCO2PerVoyage * CARBON_FINE_PER_TON * voyagesPerYear;

  let iceFuelCost10yr = 0;
  let iceCarbonFines10yr = 0;
  for (let y = 1; y <= 10; y++) {
    const df = Math.pow(1 + discountRate, y);
    iceFuelCost10yr += iceAnnualFuel / df;
    iceCarbonFines10yr += iceAnnualCarbonFines / df;
  }

  const iceTotalTCO = iceVesselCost + iceFuelCost10yr + iceCarbonFines10yr;

  // NPV gap (negative = EV saves money)
  const npvGap = evTotalTCO - iceTotalTCO;

  // CO2 abated
  const evCO2PerVoyage = (evEnergyPerVoyageKWh * EV_GRID_CO2_G_PER_KWH) / 1_000_000; // tonnes
  const co2AbatedPerVoyage = iceCO2PerVoyage - evCO2PerVoyage;
  const co2Abated10yr = co2AbatedPerVoyage * voyagesPerYear * 10;

  const costPerTonCO2Abated = co2Abated10yr > 0 ? npvGap / co2Abated10yr : 0;
  const evCarbonCost10yr = 0; // EV has zero carbon fines

  return {
    evVesselCost,
    evBatteryCost,
    evEfficiencyCost,
    evChargingInfraCost,
    evEnergyCost10yr,
    evCarbonCost10yr,
    evTotalTCO,

    iceVesselCost,
    icePropulsionCost,
    iceEfficiencyCost,
    iceChargingInfraCost,
    iceFuelCost10yr,
    iceCarbonFines10yr,
    iceTotalTCO,

    npvGap,
    costPerTonCO2Abated,
    voyagesPerYear,
  };
}
