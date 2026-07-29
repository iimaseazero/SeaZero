// Sea Zero — Emissions module
// CO2 calculations for EV vs ICE, per-voyage and cumulative

import { SimulationResult, EmissionsResult } from './types';

const EV_GRID_CO2_G_PER_KWH = 30;   // Norwegian grid intensity
const ICE_CO2_PER_SAILING_HR = 1.6;  // tonnes CO2e per sailing hour
const VOYAGES_PER_YEAR = 33;         // single vessel

export function computeEmissions(simResult: SimulationResult): EmissionsResult {
  // EV CO2
  const evEnergyKWh = simResult.totalEnergyMWh * 1000;
  const evCO2PerVoyageTons = (evEnergyKWh * EV_GRID_CO2_G_PER_KWH) / 1_000_000; // grams → tonnes

  // ICE CO2
  const iceCO2PerVoyageTons = ICE_CO2_PER_SAILING_HR * simResult.totalSailingHours;

  const evCO2PerYear = evCO2PerVoyageTons * VOYAGES_PER_YEAR;
  const iceCO2PerYear = iceCO2PerVoyageTons * VOYAGES_PER_YEAR;

  const co2AbatedPerVoyage = iceCO2PerVoyageTons - evCO2PerVoyageTons;
  const co2Abated10yr = co2AbatedPerVoyage * VOYAGES_PER_YEAR * 10;

  // Cumulative arrays for charting (year 0 to 10)
  const evCumulativeCO2: number[] = [0];
  const iceCumulativeCO2: number[] = [0];
  for (let y = 1; y <= 10; y++) {
    evCumulativeCO2.push(evCO2PerYear * y);
    iceCumulativeCO2.push(iceCO2PerYear * y);
  }

  return {
    evCO2PerVoyageTons,
    iceCO2PerVoyageTons,
    evCO2PerYear,
    iceCO2PerYear,
    co2AbatedPerVoyage,
    co2Abated10yr,
    evCumulativeCO2,
    iceCumulativeCO2,
  };
}
