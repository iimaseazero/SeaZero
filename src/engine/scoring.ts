// Sea Zero — Competition scoring
//
// WHY THIS WAS REWRITTEN
//
// The original score was `feasibilityBonus + deadZonePenalty + npvGap$M − co2AbatedKt`,
// lower-is-better, and it had a structural flaw: both of its continuous terms
// improve when the ship consumes MORE energy.
//
//   abated  = totalEnergy × (0.6154 − 0.0326)  =  totalEnergy × 0.5828   ↑ with energy
//   d(npvGap)/d(MWh) = EV($76.09 + $6.20) − ICE($230.77 + $116.92) = −$265/MWh   ↓ with energy
//
// So sailing faster — which burns more fuel, emits more, and drains the battery
// harder — scored better on both terms. Slow steaming, the single lever the case
// devotes Exhibit 9 to, was penalised. Teams optimising the score were being
// taught the opposite of the case's lesson.
//
// THE REPLACEMENT
//
// Four bounded components summing to 100, higher-is-better, each one a real
// trade-off against the others:
//
//   Reliability 0–35  does the bid still work when the world misbehaves?
//   Cost        0–35  worst-case 10-year TCO of the vessel you actually chose
//   Climate     0–20  ABSOLUTE emissions, not counterfactual abatement
//   Service     0–10  can you hold the Exhibit 2 timetable?
//
// Emissions are scored on what the chosen vessel actually emits relative to a
// fixed do-nothing baseline, so burning more energy can never earn points.
// Cost is scored at the WORST economic scenario, not the team's own optimistic
// one, because the case is about a bid on a 2030–2040 contract.

import { Port } from '@/data/ports';
import { Leg } from '@/data/legs';
import { SimulationConfig, SimulationResult } from './types';
import { simulate } from './simulate';
import { computeEconomics } from './economics';
import { computeEmissions } from './emissions';
import { Assumptions } from './assumptions';
import { ANALYSIS_YEARS, voyagesPerYear as voyagesPerYearFor } from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// The stress panel
// ─────────────────────────────────────────────────────────────────────────────

export type ScenarioKind = 'base' | 'operational' | 'economic';

export interface StressScenario {
  id: string;
  name: string;
  /** Compact label for the chip row. */
  short: string;
  kind: ScenarioKind;
  /** Shown on hover — always traceable to the case. */
  rationale: string;
  configPatch?: Partial<SimulationConfig>;
  assumptions?: Partial<Assumptions>;
  /** Set when the scenario has to be derived from the base run (e.g. outages). */
  derive?: (base: SimulationResult, config: SimulationConfig) => Partial<SimulationConfig>;
}

/**
 * Eight stresses plus the base case.
 *
 * Operational ones move the physics and so decide RELIABILITY.
 * Economic ones move only prices and so decide COST.
 */
export const STRESS_SCENARIOS: StressScenario[] = [
  {
    id: 'base',
    name: 'Base case',
    short: 'Base',
    kind: 'base',
    rationale: 'Your configuration exactly as submitted, on the case’s own assumptions.',
  },
  {
    id: 'heavy-weather',
    name: 'Heavy weather',
    short: 'Weather',
    kind: 'operational',
    rationale:
      'Sea margin doubled to 30%. The Norwegian coast in winter is not the working allowance baked into the case’s 2 MW figure.',
    configPatch: { seaMarginPercent: 30 },
  },
  {
    id: 'peak-season',
    name: 'Peak season, full ship',
    short: 'Full load',
    kind: 'operational',
    rationale:
      'Cargo and passenger load at 100%. Exhibit 4 shows cargo swinging ~40% between quarters.',
    configPatch: { cargoLoadPercent: 100 },
  },
  {
    id: 'charger-outage',
    name: 'Busiest charger offline',
    short: 'Outage',
    kind: 'operational',
    rationale:
      'The single port that delivered the most energy is out of service. Case p.7 notes Hurtigruten may be the only user maintaining this equipment.',
    derive: (base, config) => {
      // Find the charger port that supplied the most energy over the voyage.
      const byPort = new Map<number, number>();
      for (const leg of base.legs) {
        if (leg.chargeGainedMWh > 0) {
          byPort.set(leg.toPortId, (byPort.get(leg.toPortId) ?? 0) + leg.chargeGainedMWh);
        }
      }
      let worstPort = -1;
      let most = 0;
      for (const [portId, mwh] of byPort) {
        if (mwh > most) {
          most = mwh;
          worstPort = portId;
        }
      }
      if (worstPort < 0) return {};
      return {
        portConfigs: config.portConfigs.map((p) =>
          p.portId === worstPort ? { ...p, hasCharger: false } : p,
        ),
      };
    },
  },
  {
    id: 'battery-aged',
    name: 'Battery at end of life',
    short: 'Aged pack',
    kind: 'operational',
    rationale:
      'Round-trip efficiency down to 85% and 10 minutes of hookup overhead. A 10-year contract is bid on year 10, not year 1.',
    configPatch: { batteryEfficiency: 0.85, connectionOverheadMinutes: 10 },
  },
  // The economic scenarios come in opposed pairs on purpose. Cost is scored at
  // the WORST of them, so if every scenario leaned one way the "worst case"
  // would only ever stress one of the two vessels — a battery bid judged at
  // cheap fuel while a diesel bid was never judged at expensive fuel. Each
  // vessel has to face the price world that is bad for it.
  {
    id: 'fuel-crash',
    name: 'Fuel price crash',
    short: 'Cheap fuel',
    kind: 'economic',
    rationale:
      'MGO at $400/t. Exhibit 6 shows Bergen prices near this level through 2020 — the scenario that removes the battery vessel’s operating-cost argument.',
    assumptions: { mgoCostPerTonne: 400 },
  },
  {
    id: 'fuel-spike',
    name: 'Fuel price spike',
    short: 'Dear fuel',
    kind: 'economic',
    rationale:
      'MGO at $1,600/t. Exhibit 6 peaks near EUR 1,450 in 2022 — the scenario that punishes a conventional bid.',
    assumptions: { mgoCostPerTonne: 1600 },
  },
  {
    id: 'no-carbon-price',
    name: 'Carbon price removed',
    short: 'No carbon',
    kind: 'economic',
    rationale:
      'Carbon at $0/t. The case’s $190 is a tender penalty, not a guaranteed tax — a bid that only works with it is fragile.',
    configPatch: { carbonPricePerTon: 0 },
  },
  {
    id: 'carbon-tightened',
    name: 'Carbon price tightened',
    short: 'Hard carbon',
    kind: 'economic',
    rationale:
      'Carbon at $400/t. The 2030–2040 tender is being written now, and the direction of travel on maritime carbon pricing is one way.',
    configPatch: { carbonPricePerTon: 400 },
  },
];

export interface ScenarioOutcome {
  id: string;
  name: string;
  short: string;
  kind: ScenarioKind;
  rationale: string;
  feasible: boolean;
  worstMarginPercent: number;
  deadZoneCount: number;
  scheduleDeviationHours: number;
  /** 10-year TCO of the vessel the team actually chose. */
  chosenTCO: number;
  infeasibleReason: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Score
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  /** 0–35. Zero if the base case cannot sail at all. */
  reliability: number;
  /** 0–35. Driven by the worst economic scenario, not the best. */
  cost: number;
  /** 0–20. Absolute emissions vs a do-nothing baseline. */
  climate: number;
  /** 0–10. Adherence to the Exhibit 2 timetable. */
  service: number;
  /** 0–100, higher is better. */
  totalScore: number;

  // ── Supporting detail, for the UI and the team report ──
  scenarios: ScenarioOutcome[];
  baseFeasible: boolean;
  operationalPassed: number;
  operationalTotal: number;
  worstCaseTCO: number;
  benchmarkTCO: number;
  chosenCO2PerYear: number;
  baselineCO2PerYear: number;
  co2ReductionPercent: number;
  scheduleDeviationHours: number;
  vesselType: 'ev' | 'ice';
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const round1 = (x: number) => Math.round(x * 10) / 10;

/** 10-year TCO of whichever vessel this config actually commits to. */
function chosenTCO(config: SimulationConfig, sim: SimulationResult, a?: Partial<Assumptions>): number {
  const econ = computeEconomics(config, sim, a);
  return config.vesselType === 'ev' ? econ.evTotalTCO : econ.iceTotalTCO;
}

/**
 * Score one submitted configuration.
 *
 * Runs the full stress panel — seven pipeline passes, roughly 5 ms — so the
 * preview in the submit panel and the stored score are always the same number.
 */
export function scoreSubmission(
  config: SimulationConfig,
  ports: Port[],
  legs: Leg[],
): ScoreBreakdown {
  const baseSim = simulate(config, ports, legs);

  // ── Run the panel ──
  const outcomes: ScenarioOutcome[] = STRESS_SCENARIOS.map((scenario) => {
    const patch = scenario.derive
      ? scenario.derive(baseSim, config)
      : (scenario.configPatch ?? {});
    const scenarioConfig: SimulationConfig = { ...config, ...patch };
    const sim =
      scenario.id === 'base' ? baseSim : simulate(scenarioConfig, ports, legs);

    return {
      id: scenario.id,
      name: scenario.name,
      short: scenario.short,
      kind: scenario.kind,
      rationale: scenario.rationale,
      feasible: sim.feasible,
      worstMarginPercent: sim.worstMarginPercent,
      deadZoneCount: sim.deadZoneCount,
      scheduleDeviationHours: sim.scheduleDeviationHours,
      chosenTCO: chosenTCO(scenarioConfig, sim, scenario.assumptions),
      infeasibleReason: sim.infeasibleReason,
    };
  });

  const base = outcomes.find((o) => o.id === 'base')!;
  const operational = outcomes.filter((o) => o.kind === 'operational');
  const economic = outcomes.filter((o) => o.kind === 'economic');

  // ── Reliability (0–35) ──
  // Hard gate: a bid whose base case cannot complete the voyage scores zero
  // here no matter how well it survives the stresses. You cannot tender a ship
  // that does not arrive.
  const operationalPassed = operational.filter((o) => o.feasible).length;
  const reliability = base.feasible
    ? 15 + (operational.length > 0 ? (operationalPassed / operational.length) * 20 : 20)
    : 0;

  // ── Cost (0–35) ──
  // Benchmarked against the same route run as an efficiency-upgraded
  // conventional vessel — the case's own "lower-risk bid". Scored at the worst
  // economic scenario so an optimistic fuel forecast buys nothing.
  const benchmarkConfig: SimulationConfig = { ...config, vesselType: 'ice', efficiencyPackage: true };
  const benchmarkSim = simulate(benchmarkConfig, ports, legs);
  const benchmarkTCO = computeEconomics(benchmarkConfig, benchmarkSim).iceTotalTCO;

  const worstCaseTCO = Math.max(base.chosenTCO, ...economic.map((o) => o.chosenTCO));
  // 25% under the benchmark earns full marks; 25% over earns none.
  const cost =
    benchmarkTCO > 0
      ? 35 * clamp01((1.25 * benchmarkTCO - worstCaseTCO) / (0.5 * benchmarkTCO))
      : 0;

  // ── Climate (0–20) ──
  // Absolute annual CO2 of the chosen vessel against a fixed do-nothing
  // baseline: the same voyage on a conventional vessel WITHOUT the efficiency
  // package. Consuming more energy always lowers this score, which is the whole
  // point of the rewrite.
  const doNothingConfig: SimulationConfig = {
    ...config,
    vesselType: 'ice',
    efficiencyPackage: false,
  };
  const doNothingSim = simulate(doNothingConfig, ports, legs);
  const baselineCO2PerYear = computeEmissions(doNothingSim).iceCO2PerYear;

  const baseEmissions = computeEmissions(baseSim);
  const chosenCO2PerYear =
    config.vesselType === 'ev' ? baseEmissions.evCO2PerYear : baseEmissions.iceCO2PerYear;

  const co2ReductionPercent =
    baselineCO2PerYear > 0 ? (1 - chosenCO2PerYear / baselineCO2PerYear) * 100 : 0;
  const climate = 20 * clamp01(co2ReductionPercent / 100);

  // ── Service (0–10) ──
  // Only lateness is penalised; arriving ahead of the timetable is not a virtue
  // worth points, and the energy it costs is already charged to cost + climate.
  const lateHours = Math.max(0, base.scheduleDeviationHours);
  const service = 10 * clamp01(1 - lateHours / 12);

  const totalScore = reliability + cost + climate + service;

  return {
    reliability: round1(reliability),
    cost: round1(cost),
    climate: round1(climate),
    service: round1(service),
    totalScore: round1(totalScore),

    scenarios: outcomes,
    baseFeasible: base.feasible,
    operationalPassed,
    operationalTotal: operational.length,
    worstCaseTCO,
    benchmarkTCO,
    chosenCO2PerYear,
    baselineCO2PerYear,
    co2ReductionPercent: round1(co2ReductionPercent),
    scheduleDeviationHours: base.scheduleDeviationHours,
    vesselType: config.vesselType,
  };
}

/** Voyages a submission's vessel completes across the analysis horizon. */
export function voyagesOverHorizon(config: SimulationConfig): number {
  return voyagesPerYearFor(config.voyageMode) * ANALYSIS_YEARS;
}
