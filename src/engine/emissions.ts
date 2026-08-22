// Sea Zero — Emissions module
// CO2 for EV vs ICE, per-voyage and cumulative.

import { SimulationResult, EmissionsResult } from './types';
import {
<<<<<<< HEAD
  voyagesPerYear as voyagesPerYearFor,
  ANALYSIS_YEARS,
} from './constants';
import { Assumptions, resolveAssumptions } from './assumptions';

export function computeEmissions(
  simResult: SimulationResult,
  assumptions?: Partial<Assumptions>,
): EmissionsResult {
  const { gridCO2gPerKWh, iceCO2TonnesPerMWh } = resolveAssumptions(assumptions);
=======
  GRID_CO2_G_PER_KWH,
  ICE_CO2_TONNES_PER_MWH,
  voyagesPerYear as voyagesPerYearFor,
  ANALYSIS_YEARS,
} from './constants';

export function computeEmissions(simResult: SimulationResult): EmissionsResult {
>>>>>>> origin/master
  const perYear = voyagesPerYearFor(simResult.voyageMode);
  // EV emissions follow the energy actually drawn from the grid — which
  // includes charging losses and the pre-departure fill, not just the energy
  // that reaches the propellers.
  const evEnergyKWh = simResult.totalGridEnergyMWh * 1000;
<<<<<<< HEAD
  const evCO2PerVoyageTons = (evEnergyKWh * gridCO2gPerKWh) / 1_000_000; // grams → tonnes

  // ICE emissions scale with delivered energy, so they rise with speed
  // (Exhibit 9) instead of falling with sailing hours.
  const iceCO2PerVoyageTons = simResult.totalEnergyMWh * iceCO2TonnesPerMWh;
=======
  const evCO2PerVoyageTons = (evEnergyKWh * GRID_CO2_G_PER_KWH) / 1_000_000; // grams → tonnes

  // ICE emissions scale with delivered energy, so they rise with speed
  // (Exhibit 9) instead of falling with sailing hours.
  const iceCO2PerVoyageTons = simResult.totalEnergyMWh * ICE_CO2_TONNES_PER_MWH;
>>>>>>> origin/master

  const evCO2PerYear = evCO2PerVoyageTons * perYear;
  const iceCO2PerYear = iceCO2PerVoyageTons * perYear;

  const co2AbatedPerVoyage = iceCO2PerVoyageTons - evCO2PerVoyageTons;
  const co2Abated10yr = co2AbatedPerVoyage * perYear * ANALYSIS_YEARS;

  // Cumulative arrays for charting (year 0 to 10)
  const evCumulativeCO2: number[] = [0];
  const iceCumulativeCO2: number[] = [0];
  for (let y = 1; y <= ANALYSIS_YEARS; y++) {
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
