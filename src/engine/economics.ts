// Sea Zero — Economics module
// 10-year discounted TCO comparison, EV vs ICE.
//
// Both options are costed from the SAME voyage energy profile, so the
// comparison isolates the propulsion decision rather than mixing in different
// operating assumptions.

import { SimulationConfig, SimulationResult, EconomicsResult, AnnualCashFlow, NpvComponent } from './types';
import {
  voyagesPerYear as voyagesPerYearFor,
  ANALYSIS_YEARS,
  COMMON_VESSEL_COST,
<<<<<<< HEAD
  EFFICIENCY_PACKAGE_COST,
  iceVesselTotalCost,
} from './constants';
import { Assumptions, resolveAssumptions, infraCostPerPort } from './assumptions';
=======
  BATTERY_COST_PER_MWH,
  EFFICIENCY_PACKAGE_COST,
  chargingInfraCostPerPort,
  ELECTRICITY_COST_PER_KWH,
  MGO_COST_PER_TONNE,
  ICE_CO2_TONNES_PER_MWH,
  GRID_CO2_G_PER_KWH,
  iceVesselTotalCost,
} from './constants';
>>>>>>> origin/master

/**
 * Compute 10-year discounted TCO for EV vs ICE,
 * including year-by-year cash flows and NPV component breakdowns.
 */
export function computeEconomics(
  config: SimulationConfig,
  simResult: SimulationResult,
<<<<<<< HEAD
  assumptions?: Partial<Assumptions>,
): EconomicsResult {
  const {
    mgoCostPerTonne,
    electricityCostPerKWh,
    batteryCostPerMWh,
    chargingInfraPerPort,
    gridCO2gPerKWh,
    iceCO2TonnesPerMWh,
  } = resolveAssumptions(assumptions);

  const {
=======
): EconomicsResult {
  const {
>>>>>>> origin/master
    batteryMWh, efficiencyPackage, discountRate, portConfigs,
    carbonPricePerTon, chargePowerMW,
  } = config;
  // A roundtrip covers both directions, so a vessel completes half as many of
  // them per year as it does one-way legs.
  const voyagesPerYear = voyagesPerYearFor(config.voyageMode);

  // ─── EV CAPEX (Year 0) ───
  // The $250M case figure is inclusive of both the battery (22.5%) and the
  // $30M efficiency package, so the package is netted out when it isn't bought
  // rather than added on top of a total that already contains it.
<<<<<<< HEAD
  const evBatteryCost = batteryCostPerMWh * batteryMWh;
=======
  const evBatteryCost = BATTERY_COST_PER_MWH * batteryMWh;
>>>>>>> origin/master
  const evEfficiencyCost = efficiencyPackage ? EFFICIENCY_PACKAGE_COST : 0;
  const evVesselCost = COMMON_VESSEL_COST; // hull, hotel, outfit — shared with the ICE design

  // $1M per port at the 12 MW design point, scaling with connector rating to
  // stand in for the grid reinforcement the case warns about.
  const chargingPorts = portConfigs.filter((p) => p.hasCharger).length;
<<<<<<< HEAD
  const evChargingInfraCost = chargingPorts * infraCostPerPort(chargingInfraPerPort, chargePowerMW);
=======
  const evChargingInfraCost = chargingPorts * chargingInfraCostPerPort(chargePowerMW);
>>>>>>> origin/master

  // ─── EV Annual OPEX ───
  // Billed on energy actually bought from the grid, which includes charging
  // losses and the pre-departure fill — not on the energy delivered to the props.
  const evEnergyPerVoyageKWh = simResult.totalGridEnergyMWh * 1000;
<<<<<<< HEAD
  const evAnnualEnergyCost = evEnergyPerVoyageKWh * electricityCostPerKWh * voyagesPerYear;

  // The Norwegian grid is clean but not carbon-free (30 g/kWh).
  const evCO2PerVoyage = (evEnergyPerVoyageKWh * gridCO2gPerKWh) / 1_000_000; // tonnes
=======
  const evAnnualEnergyCost = evEnergyPerVoyageKWh * ELECTRICITY_COST_PER_KWH * voyagesPerYear;

  // The Norwegian grid is clean but not carbon-free (30 g/kWh).
  const evCO2PerVoyage = (evEnergyPerVoyageKWh * GRID_CO2_G_PER_KWH) / 1_000_000; // tonnes
>>>>>>> origin/master
  const evAnnualCarbonCost = evCO2PerVoyage * carbonPricePerTon * voyagesPerYear;

  // ─── ICE CAPEX (Year 0) ───
  // Derived from the case: same hull and (optionally) the same efficiency
  // package, plus a conventional propulsion system at 12% of vessel total.
  const iceTotal = iceVesselTotalCost(efficiencyPackage);
  const icePropulsionCost = iceTotal - COMMON_VESSEL_COST - (efficiencyPackage ? EFFICIENCY_PACKAGE_COST : 0);
  const iceEfficiencyCost = efficiencyPackage ? EFFICIENCY_PACKAGE_COST : 0;
  const iceVesselCost = COMMON_VESSEL_COST;
  const iceChargingInfraCost = 0;

  // ─── ICE Annual OPEX ───
  // Fuel scales with delivered energy, so it rises with speed — matching
  // Exhibit 9. A flat tonnes-per-hour rate would invert that relationship.
<<<<<<< HEAD
  const iceFuelPerVoyage = simResult.totalFuelTonnes * mgoCostPerTonne;
  const iceAnnualFuel = iceFuelPerVoyage * voyagesPerYear;

  const iceCO2PerVoyage = simResult.totalEnergyMWh * iceCO2TonnesPerMWh;
=======
  const iceFuelPerVoyage = simResult.totalFuelTonnes * MGO_COST_PER_TONNE;
  const iceAnnualFuel = iceFuelPerVoyage * voyagesPerYear;

  const iceCO2PerVoyage = simResult.totalEnergyMWh * ICE_CO2_TONNES_PER_MWH;
>>>>>>> origin/master
  const iceAnnualCarbonCost = iceCO2PerVoyage * carbonPricePerTon * voyagesPerYear;

  // ─── Year-by-year cash flows ───
  const annualCashFlows: AnnualCashFlow[] = [];

  const evCapexTotal = evVesselCost + evBatteryCost + evEfficiencyCost + evChargingInfraCost;
  const iceCapexTotal = iceVesselCost + icePropulsionCost + iceEfficiencyCost;

  annualCashFlows.push({
    year: 0,
    evVessel: evVesselCost,
    evBattery: evBatteryCost,
    evEfficiency: evEfficiencyCost,
    evChargingInfra: evChargingInfraCost,
    evEnergy: 0,
    evCarbon: 0,
    evTotal: evCapexTotal,
    iceVessel: iceVesselCost + icePropulsionCost,
    iceEfficiency: iceEfficiencyCost,
    iceFuel: 0,
    iceCarbon: 0,
    iceTotal: iceCapexTotal,
    delta: evCapexTotal - iceCapexTotal,
    // Year 0 is not discounted (df = 1)
    evTotalDiscounted: evCapexTotal,
    iceTotalDiscounted: iceCapexTotal,
    deltaDiscounted: evCapexTotal - iceCapexTotal,
  });

  let evEnergyCost10yr = 0;
  let evCarbonCost10yr = 0;
  let iceFuelCost10yr = 0;
  let iceCarbonFines10yr = 0;

  for (let y = 1; y <= ANALYSIS_YEARS; y++) {
    const df = Math.pow(1 + discountRate, y);

    const evEnergyDiscounted = evAnnualEnergyCost / df;
    const evCarbonDiscounted = evAnnualCarbonCost / df;
    const iceFuelDiscounted = iceAnnualFuel / df;
    const iceCarbonDiscounted = iceAnnualCarbonCost / df;

    evEnergyCost10yr += evEnergyDiscounted;
    evCarbonCost10yr += evCarbonDiscounted;
    iceFuelCost10yr += iceFuelDiscounted;
    iceCarbonFines10yr += iceCarbonDiscounted;

    annualCashFlows.push({
      year: y,
      evVessel: 0,
      evBattery: 0,
      evEfficiency: 0,
      evChargingInfra: 0,
      evEnergy: evAnnualEnergyCost,
      evCarbon: evAnnualCarbonCost,
      evTotal: evAnnualEnergyCost + evAnnualCarbonCost,
      iceVessel: 0,
      iceEfficiency: 0,
      iceFuel: iceAnnualFuel,
      iceCarbon: iceAnnualCarbonCost,
      iceTotal: iceAnnualFuel + iceAnnualCarbonCost,
      delta: (evAnnualEnergyCost + evAnnualCarbonCost) - (iceAnnualFuel + iceAnnualCarbonCost),
      evTotalDiscounted: evEnergyDiscounted + evCarbonDiscounted,
      iceTotalDiscounted: iceFuelDiscounted + iceCarbonDiscounted,
      deltaDiscounted:
        (evEnergyDiscounted + evCarbonDiscounted) - (iceFuelDiscounted + iceCarbonDiscounted),
    });
  }

  // ─── 10-year totals ───
  const evTotalTCO =
    evVesselCost + evBatteryCost + evEfficiencyCost + evChargingInfraCost +
    evEnergyCost10yr + evCarbonCost10yr;
  const iceTotalTCO =
    iceVesselCost + icePropulsionCost + iceEfficiencyCost +
    iceFuelCost10yr + iceCarbonFines10yr;

  // Negative = EV saves money
  const npvGap = evTotalTCO - iceTotalTCO;

  // ─── NPV component breakdown ───
  const npvComponents: NpvComponent[] = [
    {
      category: 'Propulsion System',
      evCost: evBatteryCost,
      iceCost: icePropulsionCost,
      delta: evBatteryCost - icePropulsionCost,
      color: '#38D9C8',
    },
    {
      category: 'Vessel Hull',
      evCost: evVesselCost,
      iceCost: iceVesselCost,
      delta: evVesselCost - iceVesselCost,
      color: '#4A90CC',
    },
    {
      category: 'Efficiency Pkg',
      evCost: evEfficiencyCost,
      iceCost: iceEfficiencyCost,
      delta: evEfficiencyCost - iceEfficiencyCost,
      color: '#8B5CF6',
    },
    {
      category: 'Charging Infra',
      evCost: evChargingInfraCost,
      iceCost: iceChargingInfraCost,
      delta: evChargingInfraCost - iceChargingInfraCost,
      color: '#F59E0B',
    },
    {
      category: 'Energy (10yr)',
      evCost: evEnergyCost10yr,
      iceCost: iceFuelCost10yr,
      delta: evEnergyCost10yr - iceFuelCost10yr,
      color: '#FB923C',
    },
    {
      category: 'Carbon (10yr)',
      evCost: evCarbonCost10yr,
      iceCost: iceCarbonFines10yr,
      delta: evCarbonCost10yr - iceCarbonFines10yr,
      color: '#EF4444',
    },
  ];

  // ─── Abatement cost ───
  const co2AbatedPerVoyage = iceCO2PerVoyage - evCO2PerVoyage;
  const co2Abated10yr = co2AbatedPerVoyage * voyagesPerYear * ANALYSIS_YEARS;

  // Guard against a near-zero denominator producing a meaningless headline
  // number — the UI renders `null` as "n/a" rather than "$0/ton".
  const costPerTonCO2Abated = Math.abs(co2Abated10yr) > 1 ? npvGap / co2Abated10yr : null;

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
    annualCashFlows,
    npvComponents,
  };
}
