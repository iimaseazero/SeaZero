// Sea Zero — Sensitivity and decision-surface analysis
//
// Everything here works by re-running the existing pure `simulate` /
// `computeEconomics` pipeline with one input moved at a time. Nothing is
// modelled twice, so these charts can never disagree with the main cards.
//
// Cost note: one roundtrip `simulate()` is dominated by the 1-minute CC-CV
// integrator and measures ~0.4 ms. That makes a 100-point sweep cheap enough
// to recompute inline on every config change; the greedy charger walk is
// ~600 runs and is the one analysis worth deferring.

import { Port } from '@/data/ports';
import { Leg } from '@/data/legs';
import { SimulationConfig } from './types';
import { simulate } from './simulate';
import { computeEconomics } from './economics';
import { computeEmissions } from './emissions';
import { Assumptions, CASE_ASSUMPTIONS } from './assumptions';
import { REF_SPEED_KNOTS, DESIGN_CHARGE_POWER_MW } from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper
// ─────────────────────────────────────────────────────────────────────────────

export interface RunOutcome {
  npvGap: number;
  evTotalTCO: number;
  worstMarginPercent: number;
  feasible: boolean;
  deadZoneCount: number;
  evCO2PerYear: number;
  co2Abated10yr: number;
  totalEnergyMWh: number;
  scheduleDeviationHours: number;
}

/**
 * Force the battery path.
 *
 * simulate() only tracks state of charge when vesselType is 'ev' — for the ICE
 * option worstMarginPercent comes back as a flat 100 and `feasible` only tests
 * the timetable. Any analysis about batteries, chargers or SoC margin therefore
 * has to ask the EV question explicitly, even while the user is looking at the
 * conventional vessel. That is the useful reading anyway: "if we went electric,
 * what would it take?"
 */
function asEv(config: SimulationConfig): SimulationConfig {
  return config.vesselType === 'ev' ? config : { ...config, vesselType: 'ev' };
}

/** One full pass of the pipeline for a given config + assumption set. */
export function runOnce(
  config: SimulationConfig,
  ports: Port[],
  legs: Leg[],
  assumptions?: Partial<Assumptions>,
): RunOutcome {
  const sim = simulate(config, ports, legs);
  const econ = computeEconomics(config, sim, assumptions);
  const emis = computeEmissions(sim, assumptions);
  return {
    npvGap: econ.npvGap,
    evTotalTCO: econ.evTotalTCO,
    worstMarginPercent: sim.worstMarginPercent,
    feasible: sim.feasible,
    deadZoneCount: sim.deadZoneCount,
    evCO2PerYear: emis.evCO2PerYear,
    co2Abated10yr: emis.co2Abated10yr,
    totalEnergyMWh: sim.totalEnergyMWh,
    scheduleDeviationHours: sim.scheduleDeviationHours,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Tornado — which assumption moves the NPV verdict most?
// ─────────────────────────────────────────────────────────────────────────────

export interface TornadoFactor {
  /** Axis label. */
  label: string;
  /** Where the low and high probes came from, for the tooltip. */
  source: string;
  lowLabel: string;
  highLabel: string;
  /** NPV gap ($) at the low and high probe. */
  lowNpv: number;
  highNpv: number;
  /** Signed swing away from the baseline gap ($). */
  lowDelta: number;
  highDelta: number;
  /** Total width of the bar — what the rows are sorted by. */
  swing: number;
}

export interface TornadoResult {
  baselineNpvGap: number;
  factors: TornadoFactor[];
}

interface ProbeSide {
  label: string;
  assumptions?: Partial<Assumptions>;
  config?: Partial<SimulationConfig>;
}

interface Probe {
  label: string;
  source: string;
  low: ProbeSide;
  high: ProbeSide;
}

/**
 * The probe ranges are the case's own evidence wherever the case supplies it,
 * so the chart reads as "here is what Exhibit 6 does to your answer" rather
 * than as an arbitrary plus-or-minus 20%.
 */
function buildProbes(): Probe[] {
  return [
    {
      label: 'Marine gas oil price',
      source: 'Exhibit 6. Bergen MGO ranged roughly EUR 300–1450/t over 2018–2024',
      low: { label: '$400/t', assumptions: { mgoCostPerTonne: 400 } },
      high: { label: '$1,600/t', assumptions: { mgoCostPerTonne: 1600 } },
    },
    {
      label: 'Battery pack price',
      source: 'Exhibit 8. BloombergNEF packs fell $806 to $115/kWh 2013–2024; the case implies ~$804/kWh installed marine',
      low: { label: '$300/kWh', assumptions: { batteryCostPerMWh: 300_000 } },
      high: { label: '$1,100/kWh', assumptions: { batteryCostPerMWh: 1_100_000 } },
    },
    {
      label: 'Carbon price',
      source: 'Case p.6. $190/t is the tender penalty; treated here as a shadow price',
      low: { label: '$0/t', config: { carbonPricePerTon: 0 } },
      high: { label: '$400/t', config: { carbonPricePerTon: 400 } },
    },
    {
      label: 'Electricity price',
      source: 'Case p.4. 75 oere/kWh is about $0.07; Nordic spot has swung far wider',
      low: { label: '$0.03/kWh', assumptions: { electricityCostPerKWh: 0.03 } },
      high: { label: '$0.20/kWh', assumptions: { electricityCostPerKWh: 0.2 } },
    },
    {
      label: 'Shore charging capex',
      source: 'Case p.7. $1M/port, "substantially higher" if grid upgrades are needed',
      low: { label: '$0.5M/port', assumptions: { chargingInfraPerPort: 500_000 } },
      high: { label: '$3M/port', assumptions: { chargingInfraPerPort: 3_000_000 } },
    },
    {
      label: 'Discount rate',
      source: 'Modelling choice. 8% base.',
      low: { label: '4%', config: { discountRate: 0.04 } },
      high: { label: '14%', config: { discountRate: 0.14 } },
    },
    {
      label: 'Sailing speed',
      source: 'Exhibit 9. GHG runs 75%–120% of benchmark across 10.7–14.8 kn',
      low: { label: '11.5 kn', config: { speedKnots: 11.5 } },
      high: { label: '15 kn', config: { speedKnots: 15 } },
    },
    {
      label: 'Weather / sea margin',
      source: 'Modelling choice. The case bakes a working margin into its 2 MW figure',
      low: { label: '5%', config: { seaMarginPercent: 5 } },
      high: { label: '30%', config: { seaMarginPercent: 30 } },
    },
    {
      label: 'Grid carbon intensity',
      source: 'Exhibit 7. Norway 30 g/kWh; a gas-heavy grid is 400–650',
      low: { label: '10 g/kWh', assumptions: { gridCO2gPerKWh: 10 } },
      high: { label: '450 g/kWh', assumptions: { gridCO2gPerKWh: 450 } },
    },
  ];
}

export function computeTornado(
  config: SimulationConfig,
  ports: Port[],
  legs: Leg[],
): TornadoResult {
  const baseline = runOnce(config, ports, legs).npvGap;

  const factors: TornadoFactor[] = buildProbes().map((probe) => {
    const at = (side: ProbeSide) =>
      runOnce(
        side.config ? { ...config, ...side.config } : config,
        ports,
        legs,
        side.assumptions,
      ).npvGap;

    const lowNpv = at(probe.low);
    const highNpv = at(probe.high);
    return {
      label: probe.label,
      source: probe.source,
      lowLabel: probe.low.label,
      highLabel: probe.high.label,
      lowNpv,
      highNpv,
      lowDelta: lowNpv - baseline,
      highDelta: highNpv - baseline,
      swing: Math.abs(highNpv - lowNpv),
    };
  });

  factors.sort((a, b) => b.swing - a.swing);
  return { baselineNpvGap: baseline, factors };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Speed sweep — Exhibit 9's question, answered on this configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface SpeedPoint {
  speedKnots: number;
  /** All three indexed to the 13.2 kn reference = 100, so they share one axis. */
  energyIndex: number;
  evCO2Index: number;
  evTcoIndex: number;
  /** Raw values for the tooltip. */
  worstMarginPercent: number;
  feasible: boolean;
  scheduleDeviationHours: number;
  evTotalTCO: number;
  evCO2PerYear: number;
  totalEnergyMWh: number;
  isReference: boolean;
}

/**
 * Sweep speed and index everything to the case's 13.2 kn benchmark.
 *
 * Indexing is not decoration: energy (MWh), CO2 (t/yr) and TCO ($) have wildly
 * different magnitudes, and putting them on separate y-scales would invent a
 * correlation that is not in the data. Exhibit 9 is itself an index chart, so
 * this reads the same way the case does.
 */
export function sweepSpeed(
  config: SimulationConfig,
  ports: Port[],
  legs: Leg[],
  from = 10,
  to = 16,
  step = 0.5,
): SpeedPoint[] {
  const evConfig = asEv(config);
  const ref = runOnce({ ...evConfig, speedKnots: REF_SPEED_KNOTS }, ports, legs);
  const points: SpeedPoint[] = [];

  const safeIndex = (value: number, reference: number) =>
    reference > 0 ? (value / reference) * 100 : 100;

  // The 13.2 kn benchmark has to be an actual sampled point, not something the
  // grid steps past — otherwise the reference line sits between two points and
  // nothing on the chart reads exactly 100.
  const speeds: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) speeds.push(Math.round(v * 10) / 10);
  if (REF_SPEED_KNOTS >= from && REF_SPEED_KNOTS <= to && !speeds.includes(REF_SPEED_KNOTS)) {
    speeds.push(REF_SPEED_KNOTS);
  }
  speeds.sort((a, b) => a - b);

  for (const speedKnots of speeds) {
    const r = runOnce({ ...evConfig, speedKnots }, ports, legs);
    points.push({
      speedKnots,
      energyIndex: safeIndex(r.totalEnergyMWh, ref.totalEnergyMWh),
      evCO2Index: safeIndex(r.evCO2PerYear, ref.evCO2PerYear),
      evTcoIndex: safeIndex(r.evTotalTCO, ref.evTotalTCO),
      worstMarginPercent: r.worstMarginPercent,
      feasible: r.feasible,
      scheduleDeviationHours: r.scheduleDeviationHours,
      evTotalTCO: r.evTotalTCO,
      evCO2PerYear: r.evCO2PerYear,
      totalEnergyMWh: r.totalEnergyMWh,
      isReference: speedKnots === REF_SPEED_KNOTS,
    });
  }
  return points;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Feasibility frontier — battery size vs connector rating
// ─────────────────────────────────────────────────────────────────────────────

export interface FrontierCell {
  batteryMWh: number;
  chargePowerMW: number;
  worstMarginPercent: number;
  feasible: boolean;
  deadZoneCount: number;
  evTotalTCO: number;
}

export interface FrontierResult {
  cells: FrontierCell[];
  batteryAxis: number[];
  powerAxis: number[];
  /** Where the user currently sits, so the grid can mark it. */
  currentBatteryMWh: number;
  currentChargePowerMW: number;
  /** Cheapest feasible cell on the grid — the "you could do this instead" hint. */
  cheapestFeasible: FrontierCell | null;
}

/**
 * Two levers, one picture: how big a battery, and how much connector (and by
 * implication grid upgrade) to buy. The charger network stays as the user set
 * it, so this answers "given my network, what hardware makes it work?".
 */
export function computeFrontier(
  config: SimulationConfig,
  ports: Port[],
  legs: Leg[],
): FrontierResult {
  const batteryAxis = [30, 40, 50, 60, 70, 80, 90, 100];
  const powerAxis = [6, 8, 10, 12, 14, 16, 20, 24, 30];

  const cells: FrontierCell[] = [];
  let cheapestFeasible: FrontierCell | null = null;
  const evConfig = asEv(config);

  for (const batteryMWh of batteryAxis) {
    for (const chargePowerMW of powerAxis) {
      // batteryMWh is typed 50 | 70 on the config because those are the two
      // options the case puts on the table; the physics does not care, and
      // this frontier is exactly the chart that shows what that choice buys.
      const probe: SimulationConfig = {
        ...evConfig,
        batteryMWh: batteryMWh as SimulationConfig['batteryMWh'],
        chargePowerMW,
      };
      const r = runOnce(probe, ports, legs);
      const cell: FrontierCell = {
        batteryMWh,
        chargePowerMW,
        worstMarginPercent: r.worstMarginPercent,
        feasible: r.feasible,
        deadZoneCount: r.deadZoneCount,
        evTotalTCO: r.evTotalTCO,
      };
      cells.push(cell);
      if (cell.feasible && (!cheapestFeasible || cell.evTotalTCO < cheapestFeasible.evTotalTCO)) {
        cheapestFeasible = cell;
      }
    }
  }

  return {
    cells,
    batteryAxis,
    powerAxis,
    currentBatteryMWh: config.batteryMWh,
    currentChargePowerMW: config.chargePowerMW,
    cheapestFeasible,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Charger build-up — the marginal value of the Nth charger
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildUpStep {
  chargerCount: number;
  /** Port added at this step (null for the origin-only starting point). */
  addedPortName: string | null;
  addedPortId: number | null;
  worstMarginPercent: number;
  deadZoneCount: number;
  feasible: boolean;
  /** Cumulative shore-side capex at the current connector rating. */
  infraCapex: number;
  /** Margin points bought by this one charger. */
  marginalGain: number;
}

/**
 * Greedy walk: start with a charger at the origin only, then repeatedly add
 * whichever remaining port improves the worst state-of-charge margin most.
 *
 * This is the case's "how dense a network" question turned into a curve. The
 * greedy order is not provably optimal, but it is the order a planner would
 * actually build in, and the diminishing-returns shape is the point.
 *
 * Cost: about ports-squared-over-two simulate() calls — around 600 for the
 * 34-port route, roughly 300 ms. Call it from a deferred value, never inline.
 */
export function computeChargerBuildUp(
  config: SimulationConfig,
  ports: Port[],
  legs: Leg[],
): BuildUpStep[] {
  if (ports.length === 0 || legs.length === 0) return [];

  const evConfig = asEv(config);
  const originId = legs[0].fromPortId;
  const infraUnit =
    CASE_ASSUMPTIONS.chargingInfraPerPort * (config.chargePowerMW / DESIGN_CHARGE_POWER_MW);

  // Keep the user's grid tiers and buffer batteries; only charger presence moves.
  const baseConfigs = evConfig.portConfigs.map((p) => ({ ...p, hasCharger: false }));
  const withChargers = (ids: Set<number>): SimulationConfig => ({
    ...evConfig,
    portConfigs: baseConfigs.map((p) => ({ ...p, hasCharger: ids.has(p.portId) })),
  });

  const chosen = new Set<number>([originId]);
  const remaining = ports.map((p) => p.id).filter((id) => id !== originId);

  // The walk is quadratic in port count. The 34-port Kystruten is ~600 runs
  // (about 300 ms); an uploaded route three times that long would be twenty
  // times the work, so cap how far the curve is drawn rather than freeze the
  // tab. The interesting shape is all in the early steps regardless.
  const MAX_STEPS = 40;

  const first = runOnce(withChargers(chosen), ports, legs);
  const steps: BuildUpStep[] = [{
    chargerCount: 1,
    addedPortName: ports.find((p) => p.id === originId)?.name ?? null,
    addedPortId: originId,
    worstMarginPercent: first.worstMarginPercent,
    deadZoneCount: first.deadZoneCount,
    feasible: first.feasible,
    infraCapex: infraUnit,
    marginalGain: 0,
  }];

  let previousMargin = first.worstMarginPercent;

  while (remaining.length > 0 && steps.length < MAX_STEPS) {
    let bestId = remaining[0];
    let bestOutcome = runOnce(withChargers(new Set([...chosen, bestId])), ports, legs);

    for (let i = 1; i < remaining.length; i++) {
      const candidate = remaining[i];
      const outcome = runOnce(withChargers(new Set([...chosen, candidate])), ports, legs);
      // Prefer the bigger margin; break ties on fewer dead zones.
      const better =
        outcome.worstMarginPercent > bestOutcome.worstMarginPercent + 1e-9 ||
        (Math.abs(outcome.worstMarginPercent - bestOutcome.worstMarginPercent) < 1e-9 &&
          outcome.deadZoneCount < bestOutcome.deadZoneCount);
      if (better) {
        bestId = candidate;
        bestOutcome = outcome;
      }
    }

    chosen.add(bestId);
    remaining.splice(remaining.indexOf(bestId), 1);

    steps.push({
      chargerCount: chosen.size,
      addedPortName: ports.find((p) => p.id === bestId)?.name ?? `Port ${bestId}`,
      addedPortId: bestId,
      worstMarginPercent: bestOutcome.worstMarginPercent,
      deadZoneCount: bestOutcome.deadZoneCount,
      feasible: bestOutcome.feasible,
      infraCapex: infraUnit * chosen.size,
      marginalGain: bestOutcome.worstMarginPercent - previousMargin,
    });
    previousMargin = bestOutcome.worstMarginPercent;
  }

  return steps;
}
