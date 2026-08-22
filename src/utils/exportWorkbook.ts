// Sea Zero — full simulation export to a single .xlsx workbook
//
// Everything the engine computes, in one file: the configuration, the route,
// every leg of the voyage, the cash flows, the emissions path, all four
// decision analyses, the competition stress panel, and the case constants each
// number traces back to.
//
// The charts are a reading of this data; the workbook is the data. Anyone who
// wants to check a figure, rebuild a chart in Excel, or hand the model to
// someone without the app should be able to start here.
//
// Uses the same `xlsx` package the route importer already depends on, so no
// new dependency is introduced.
//
// SheetJS is ~840 KB of JavaScript. A static import here would put all of it in
// the main page bundle, so every visitor downloads a spreadsheet writer whether
// or not they ever click Export. It is therefore imported dynamically inside
// `downloadWorkbook`, which moves it into its own chunk fetched on click. The
// `import type` below is erased at build time and costs nothing.

import type * as XLSXNS from 'xlsx';
import { Port } from '@/data/ports';
import { Leg } from '@/data/legs';
import {
  SimulationConfig, SimulationResult, EconomicsResult, EmissionsResult,
} from '@/engine/types';
import {
  computeTornado, sweepSpeed, computeFrontier, computeChargerBuildUp,
} from '@/engine/sensitivity';
import { scoreSubmission } from '@/engine/scoring';
import { CASE_ASSUMPTIONS } from '@/engine/assumptions';
import {
  REF_SPEED_KNOTS, DESIGN_PROPULSION_MW, DESIGN_HOTEL_MW,
  EFFICIENCY_PACKAGE_SAVING, MGO_TONNES_PER_MWH, ICE_CO2_TONNES_PER_MWH,
  EV_TOTAL_COST, EV_BATTERY_COST_SHARE, BATTERY_COST_PER_MWH,
  ICE_PROPULSION_COST_SHARE, EFFICIENCY_PACKAGE_COST, COMMON_VESSEL_COST,
  CHARGING_INFRA_PER_PORT, DESIGN_CHARGE_POWER_MW, ROUNDTRIPS_PER_YEAR,
  ANALYSIS_YEARS, DEFAULT_CUBE_EXPONENT, GRID_HEADROOM_FRACTION,
  TERMINAL_TURNAROUND_MINUTES, CC_CV_THRESHOLD, iceVesselTotalCost,
} from '@/engine/constants';

export interface ExportInput {
  config: SimulationConfig;
  simResult: SimulationResult;
  economics: EconomicsResult;
  emissions: EmissionsResult;
  ports: Port[];
  legs: Leg[];
  routeName: string;
}

type Row = Record<string, string | number | boolean | null>;

/** The SheetJS namespace, resolved at call time rather than import time. */
type XLSX = typeof XLSXNS;

/** Add a sheet from an array of row objects, sized to its content. */
function addSheet(XLSX: XLSX, wb: XLSXNS.WorkBook, name: string, rows: Row[], widths?: number[]) {
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ '': 'No data' }]);
  if (widths) {
    ws['!cols'] = widths.map((w) => ({ wch: w }));
  } else if (rows.length > 0) {
    // Size each column to its header, with a floor and a ceiling so a long
    // sentence in one cell cannot make a column unreadably wide.
    ws['!cols'] = Object.keys(rows[0]).map((k) => ({
      wch: Math.min(48, Math.max(10, k.length + 2)),
    }));
  }
  // Excel truncates sheet names at 31 characters and rejects several symbols.
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
}

const pct = (x: number) => Number((x * 100).toFixed(2));
const r = (x: number, dp = 3) => (Number.isFinite(x) ? Number(x.toFixed(dp)) : 0);

export function buildWorkbook(XLSX: XLSX, input: ExportInput): XLSXNS.WorkBook {
  const { config, simResult, economics, emissions, ports, legs, routeName } = input;
  const wb = XLSX.utils.book_new();
  const sheet = (name: string, rows: Row[], widths?: number[]) =>
    addSheet(XLSX, wb, name, rows, widths);
  const voyageWord = config.voyageMode === 'roundtrip' ? 'roundtrip' : 'one-way voyage';

  // These are the same calls the cards make, so the workbook and the screen can
  // never disagree.
  const tornado = computeTornado(config, ports, legs);
  const speed = sweepSpeed(config, ports, legs);
  const frontier = computeFrontier(config, ports, legs);
  const buildUp = computeChargerBuildUp(config, ports, legs);
  const score = scoreSubmission(config, ports, legs);

  // ── 1. Summary ──
  sheet('Summary', [
    { Section: 'Export', Metric: 'Generated', Value: new Date().toISOString(), Unit: '' },
    { Section: 'Export', Metric: 'Route', Value: routeName, Unit: '' },
    { Section: 'Export', Metric: 'Voyage mode', Value: config.voyageMode, Unit: '' },
    { Section: 'Export', Metric: 'Source case', Value: 'Hurtigruten: Sea Zero (HBS 9-625-100)', Unit: '' },

    { Section: 'Verdict', Metric: 'Feasible', Value: simResult.feasible ? 'YES' : 'NO', Unit: '' },
    { Section: 'Verdict', Metric: 'Reason if not', Value: simResult.infeasibleReason || '—', Unit: '' },
    { Section: 'Verdict', Metric: 'Dead zones', Value: simResult.deadZoneCount, Unit: 'count' },
    { Section: 'Verdict', Metric: 'Worst SoC margin', Value: r(simResult.worstMarginPercent), Unit: '%' },
    { Section: 'Verdict', Metric: 'Energy shortfall', Value: r(simResult.totalEnergyShortfallMWh), Unit: 'MWh' },

    { Section: 'Route', Metric: 'Port calls', Value: simResult.portCallCount, Unit: 'count' },
    { Section: 'Route', Metric: 'Legs simulated', Value: simResult.legs.length, Unit: 'count' },
    { Section: 'Route', Metric: 'Total distance', Value: r(simResult.totalDistanceKm, 1), Unit: 'km' },
    { Section: 'Route', Metric: 'Sailing time', Value: r(simResult.totalSailingHours, 2), Unit: 'h' },
    { Section: 'Route', Metric: 'Scheduled voyage (Exhibit 2)', Value: r(simResult.scheduledVoyageHours, 2), Unit: 'h' },
    { Section: 'Route', Metric: 'Actual voyage', Value: r(simResult.actualVoyageHours, 2), Unit: 'h' },
    { Section: 'Route', Metric: 'Deviation vs timetable', Value: r(simResult.scheduleDeviationHours, 2), Unit: 'h' },
    { Section: 'Route', Metric: 'On schedule', Value: simResult.onSchedule ? 'YES' : 'NO', Unit: '' },

    { Section: 'Energy', Metric: `Delivered per ${voyageWord}`, Value: r(simResult.totalEnergyMWh, 2), Unit: 'MWh' },
    { Section: 'Energy', Metric: 'Bought from grid', Value: r(simResult.totalGridEnergyMWh, 2), Unit: 'MWh' },
    { Section: 'Energy', Metric: 'Battery drawn', Value: r(simResult.totalBatteryDrawMWh, 2), Unit: 'MWh' },
    { Section: 'Energy', Metric: 'Charged at ports', Value: r(simResult.totalChargedMWh, 2), Unit: 'MWh' },
    { Section: 'Energy', Metric: 'Initial fill from grid', Value: r(simResult.initialChargeGridMWh, 2), Unit: 'MWh' },
    { Section: 'Energy', Metric: 'MGO equivalent', Value: r(simResult.totalFuelTonnes, 2), Unit: 't' },

    { Section: 'Charging', Metric: 'Ports with a charger', Value: simResult.chargingPortCount, Unit: 'count' },
    { Section: 'Charging', Metric: 'Ports with buffer battery', Value: simResult.bufferBatteryCount, Unit: 'count' },
    { Section: 'Charging', Metric: 'Grid-throttled calls', Value: simResult.gridThrottledPortCount, Unit: 'count' },
    { Section: 'Charging', Metric: 'Plugged-in window', Value: r(simResult.chargingWindowHours, 2), Unit: 'h' },
    { Section: 'Charging', Metric: 'Theoretical charge capacity', Value: r(simResult.chargingCapacityMWh, 1), Unit: 'MWh' },
    { Section: 'Charging', Metric: 'Energy balance (capacity − demand)', Value: r(simResult.energyBalanceMWh, 1), Unit: 'MWh' },
    { Section: 'Charging', Metric: 'Total schedule slip', Value: r(simResult.totalScheduleSlipMinutes, 0), Unit: 'min' },

    { Section: 'Economics', Metric: 'EV 10-year TCO', Value: r(economics.evTotalTCO, 0), Unit: 'USD' },
    { Section: 'Economics', Metric: 'ICE 10-year TCO', Value: r(economics.iceTotalTCO, 0), Unit: 'USD' },
    { Section: 'Economics', Metric: 'NPV gap (EV − ICE)', Value: r(economics.npvGap, 0), Unit: 'USD' },
    { Section: 'Economics', Metric: 'Cost per tonne CO2 abated', Value: economics.costPerTonCO2Abated === null ? 'n/a' : r(economics.costPerTonCO2Abated, 2), Unit: 'USD/t' },
    { Section: 'Economics', Metric: 'Voyages per year', Value: economics.voyagesPerYear, Unit: 'count' },

    { Section: 'Emissions', Metric: `EV CO2 per ${voyageWord}`, Value: r(emissions.evCO2PerVoyageTons, 2), Unit: 't' },
    { Section: 'Emissions', Metric: `ICE CO2 per ${voyageWord}`, Value: r(emissions.iceCO2PerVoyageTons, 2), Unit: 't' },
    { Section: 'Emissions', Metric: 'EV CO2 per year', Value: r(emissions.evCO2PerYear, 1), Unit: 't' },
    { Section: 'Emissions', Metric: 'ICE CO2 per year', Value: r(emissions.iceCO2PerYear, 1), Unit: 't' },
    { Section: 'Emissions', Metric: '10-year CO2 abated', Value: r(emissions.co2Abated10yr, 0), Unit: 't' },

    { Section: 'Bid score', Metric: 'Total (of 100)', Value: score.totalScore, Unit: 'pts' },
    { Section: 'Bid score', Metric: 'Reliability (of 35)', Value: score.reliability, Unit: 'pts' },
    { Section: 'Bid score', Metric: 'Cost (of 35)', Value: score.cost, Unit: 'pts' },
    { Section: 'Bid score', Metric: 'Climate (of 20)', Value: score.climate, Unit: 'pts' },
    { Section: 'Bid score', Metric: 'Service (of 10)', Value: score.service, Unit: 'pts' },
    { Section: 'Bid score', Metric: 'Operational stresses survived', Value: `${score.operationalPassed} of ${score.operationalTotal}`, Unit: '' },
  ], [14, 34, 30, 10]);

  // ── 2. Configuration ──
  sheet('Configuration', [
    { Setting: 'Vessel type', Value: config.vesselType === 'ev' ? 'Battery electric' : 'Conventional (ICE)', Unit: '' },
    { Setting: 'Voyage mode', Value: config.voyageMode, Unit: '' },
    { Setting: 'Battery capacity', Value: config.batteryMWh, Unit: 'MWh' },
    { Setting: 'Sailing speed', Value: config.speedKnots, Unit: 'knots' },
    { Setting: 'Cargo / passenger load', Value: config.cargoLoadPercent, Unit: '%' },
    { Setting: 'Efficiency package purchased', Value: config.efficiencyPackage ? 'YES' : 'NO', Unit: '' },
    { Setting: 'Battery reserve floor', Value: config.reservePercent, Unit: '%' },
    { Setting: 'Speed exponent (P proportional to v^n)', Value: config.cubeExponent, Unit: '' },
    { Setting: 'Discount rate', Value: pct(config.discountRate), Unit: '%' },
    { Setting: 'Sea / weather margin', Value: config.seaMarginPercent, Unit: '%' },
    { Setting: 'Cable connect-disconnect overhead', Value: config.connectionOverheadMinutes, Unit: 'min' },
    { Setting: 'Battery round-trip efficiency', Value: pct(config.batteryEfficiency), Unit: '%' },
    { Setting: 'Carbon shadow price', Value: config.carbonPricePerTon, Unit: 'USD/t' },
    { Setting: 'Schedule tolerance', Value: config.scheduleToleranceHours, Unit: 'h' },
    { Setting: 'Shore connector rating', Value: config.chargePowerMW, Unit: 'MW' },
    { Setting: 'Ports with a charger', Value: config.portConfigs.filter((p) => p.hasCharger).length, Unit: 'count' },
    { Setting: 'Ports with a buffer battery', Value: config.portConfigs.filter((p) => p.hasBufferBattery).length, Unit: 'count' },
  ], [40, 24, 10]);

  // ── 3. Ports ──
  sheet('Ports', ports.map((p) => {
    const pc = config.portConfigs.find((c) => c.portId === p.id);
    return {
      'Port ID': p.id,
      Name: p.name,
      Latitude: p.lat,
      Longitude: p.lng,
      'Scheduled stay (min)': p.portStayMinutes,
      'Grid tier': pc?.gridTier ?? p.gridTier,
      'Grid headroom (MW)': r(config.chargePowerMW * GRID_HEADROOM_FRACTION[pc?.gridTier ?? p.gridTier], 2),
      Charger: pc?.hasCharger ? 'YES' : 'NO',
      'Buffer battery': pc?.hasBufferBattery ? 'YES' : 'NO',
    };
  }), [9, 16, 11, 11, 20, 11, 19, 10, 15]);

  // ── 4. Route legs (as tabulated, Exhibit 2) ──
  sheet('Route legs (Exhibit 2)', legs.map((l) => ({
    'Leg #': l.index,
    From: ports.find((p) => p.id === l.fromPortId)?.name ?? l.fromPortId,
    To: ports.find((p) => p.id === l.toPortId)?.name ?? l.toPortId,
    'Distance (km)': l.distanceKm,
    'Scheduled sailing (h)': l.baselineSailHours,
    'Port stay at arrival (min)': ports.find((p) => p.id === l.toPortId)?.portStayMinutes ?? 0,
  })), [7, 18, 18, 14, 21, 24]);

  // ── 5. Voyage simulation, leg by leg ──
  sheet('Voyage simulation', simResult.legs.map((l) => ({
    'Voyage #': l.voyageIndex,
    'Leg #': l.legIndex,
    Direction: l.direction,
    From: l.fromPortName,
    To: l.toPortName,
    'Distance (km)': r(l.distanceKm, 1),
    'Scheduled sail (h)': r(l.baselineSailHours, 3),
    'Actual sail (h)': r(l.sailTimeHours, 3),
    'Dwell (min)': l.dwellMinutes,
    'Propulsion (MW)': r(l.propulsionPowerMW, 4),
    'Hotel (MW)': r(l.hotelPowerMW, 4),
    'Sailing energy (MWh)': r(l.sailingEnergyMWh, 3),
    'Port hotel energy (MWh)': r(l.portHotelEnergyMWh, 3),
    'Leg energy (MWh)': r(l.legEnergyMWh, 3),
    'Cumulative energy (MWh)': r(l.cumulativeEnergyMWh, 2),
    'MGO burned (t)': r(l.fuelTonnes, 4),
    'Cumulative MGO (t)': r(l.cumulativeFuelTonnes, 3),
    'ICE CO2 (t)': r(l.iceCO2Tonnes, 4),
    'SoC on departure (MWh)': r(l.socBeforeMWh, 3),
    'Battery draw (MWh)': r(l.batteryDrawMWh, 3),
    'SoC on arrival (MWh)': r(l.socAfterSailingMWh, 3),
    'Charge stored (MWh)': r(l.chargeGainedMWh, 3),
    'Grid energy drawn (MWh)': r(l.chargeGainedRawMWh, 3),
    'SoC leaving port (MWh)': r(l.socAfterPortMWh, 3),
    'Lowest SoC (MWh)': r(l.lowestSocMWh, 3),
    'Margin vs reserve (%)': r(l.marginPercent, 2),
    'Dead zone': l.isDeadZone ? 'YES' : '',
    'Shortfall (MWh)': r(l.energyShortfallMWh, 3),
    'Charge power delivered (MW)': r(l.effectiveChargePowerMW, 2),
    'Charging time (min)': r(l.effectiveChargingMinutes, 1),
    'Share charged at full rate (%)': r(l.ccCvPhaseSplit * 100, 1),
    'Grid throttled': l.isGridThrottled ? 'YES' : '',
    'Schedule slip (min)': r(l.scheduleSlipMinutes, 1),
  })));

  // ── 6. Annual cash flows ──
  sheet('Cash flows', economics.annualCashFlows.map((cf) => ({
    Year: cf.year,
    'EV vessel': r(cf.evVessel, 0),
    'EV battery': r(cf.evBattery, 0),
    'EV efficiency pkg': r(cf.evEfficiency, 0),
    'EV charging infra': r(cf.evChargingInfra, 0),
    'EV energy': r(cf.evEnergy, 0),
    'EV carbon': r(cf.evCarbon, 0),
    'EV total': r(cf.evTotal, 0),
    'ICE vessel': r(cf.iceVessel, 0),
    'ICE efficiency pkg': r(cf.iceEfficiency, 0),
    'ICE fuel': r(cf.iceFuel, 0),
    'ICE carbon': r(cf.iceCarbon, 0),
    'ICE total': r(cf.iceTotal, 0),
    'Delta (EV − ICE)': r(cf.delta, 0),
    'EV discounted': r(cf.evTotalDiscounted, 0),
    'ICE discounted': r(cf.iceTotalDiscounted, 0),
    'Delta discounted': r(cf.deltaDiscounted, 0),
  })));

  // ── 7. Cumulative payback (the crossover chart's data) ──
  let evRun = 0;
  let iceRun = 0;
  sheet('Payback', economics.annualCashFlows.map((cf) => {
    evRun += cf.evTotalDiscounted;
    iceRun += cf.iceTotalDiscounted;
    return {
      Year: cf.year,
      'EV cumulative (USD)': r(evRun, 0),
      'ICE cumulative (USD)': r(iceRun, 0),
      'Cumulative delta (USD)': r(evRun - iceRun, 0),
      'EV ahead': evRun < iceRun ? 'YES' : '',
    };
  }), [6, 22, 22, 24, 10]);

  // ── 8. NPV components ──
  sheet('NPV components', economics.npvComponents.map((c) => ({
    Category: c.category,
    'EV cost (USD)': r(c.evCost, 0),
    'ICE cost (USD)': r(c.iceCost, 0),
    'Delta (EV − ICE)': r(c.delta, 0),
  })), [22, 18, 18, 20]);

  // ── 9. Emissions path ──
  sheet('Emissions', emissions.evCumulativeCO2.map((ev, i) => ({
    Year: i,
    'EV cumulative CO2 (t)': r(ev, 1),
    'ICE cumulative CO2 (t)': r(emissions.iceCumulativeCO2[i], 1),
    'Abated (t)': r(emissions.iceCumulativeCO2[i] - ev, 1),
  })), [6, 24, 24, 14]);

  // ── 10. Sensitivity (tornado) ──
  sheet('Sensitivity (tornado)', tornado.factors.map((f) => ({
    Assumption: f.label,
    'Baseline NPV gap (USD)': r(tornado.baselineNpvGap, 0),
    'Low probe': f.lowLabel,
    'NPV gap at low (USD)': r(f.lowNpv, 0),
    'Change at low (USD)': r(f.lowDelta, 0),
    'High probe': f.highLabel,
    'NPV gap at high (USD)': r(f.highNpv, 0),
    'Change at high (USD)': r(f.highDelta, 0),
    'Total swing (USD)': r(f.swing, 0),
    Source: f.source,
  })), [24, 22, 14, 21, 20, 14, 22, 21, 18, 48]);

  // ── 11. Speed sweep ──
  sheet('Speed sweep', speed.map((p) => ({
    'Speed (kn)': p.speedKnots,
    'Energy index (13.2 kn = 100)': r(p.energyIndex, 1),
    'EV CO2 index': r(p.evCO2Index, 1),
    'EV TCO index': r(p.evTcoIndex, 1),
    'Energy (MWh)': r(p.totalEnergyMWh, 1),
    'EV CO2 per year (t)': r(p.evCO2PerYear, 1),
    'EV 10-year TCO (USD)': r(p.evTotalTCO, 0),
    'Worst margin (%)': r(p.worstMarginPercent, 2),
    'Deviation vs timetable (h)': r(p.scheduleDeviationHours, 2),
    Completes: p.feasible ? 'YES' : 'NO',
    Benchmark: p.isReference ? 'case 13.2 kn' : '',
  })), [11, 28, 14, 14, 14, 20, 21, 17, 26, 11, 15]);

  // ── 12. Feasibility frontier ──
  sheet('Feasibility frontier', frontier.cells.map((c) => ({
    'Battery (MWh)': c.batteryMWh,
    'Connector (MW)': c.chargePowerMW,
    'Worst margin (%)': r(c.worstMarginPercent, 2),
    'Dead zones': c.deadZoneCount,
    Completes: c.feasible ? 'YES' : 'NO',
    'EV 10-year TCO (USD)': r(c.evTotalTCO, 0),
    Marker:
      c.batteryMWh === frontier.currentBatteryMWh && c.chargePowerMW === frontier.currentChargePowerMW
        ? 'current setting'
        : frontier.cheapestFeasible?.batteryMWh === c.batteryMWh
          && frontier.cheapestFeasible?.chargePowerMW === c.chargePowerMW
          ? 'cheapest feasible'
          : '',
  })), [14, 16, 17, 12, 11, 21, 18]);

  // ── 13. Charger build-up ──
  sheet('Charger build-up', buildUp.map((s) => ({
    'Chargers': s.chargerCount,
    'Port added': s.addedPortName ?? '—',
    'Worst margin (%)': r(s.worstMarginPercent, 2),
    'Margin gained': r(s.marginalGain, 2),
    'Dead zones': s.deadZoneCount,
    Completes: s.feasible ? 'YES' : 'NO',
    'Shore capex (USD)': r(s.infraCapex, 0),
  })), [10, 18, 17, 14, 12, 11, 18]);

  // ── 14. Competition stress panel ──
  sheet('Stress panel', score.scenarios.map((sc) => ({
    Scenario: sc.name,
    Tests: sc.kind === 'economic' ? 'Cost' : sc.kind === 'base' ? 'Baseline' : 'Feasibility',
    Outcome: sc.kind === 'economic' ? '—' : sc.feasible ? 'Completes' : 'Fails',
    'Worst margin (%)': r(sc.worstMarginPercent, 2),
    'Dead zones': sc.deadZoneCount,
    'Deviation (h)': r(sc.scheduleDeviationHours, 2),
    'Chosen-vessel 10yr TCO (USD)': r(sc.chosenTCO, 0),
    'Failure reason': sc.infeasibleReason || '',
    Rationale: sc.rationale,
  })), [26, 12, 11, 17, 12, 14, 28, 44, 60]);

  // ── 15. Case constants ──
  // Every figure the model rests on, with where it comes from. A number without
  // a provenance is an opinion; this sheet is what makes the rest auditable.
  sheet('Case constants', [
    { Constant: 'Fleet average sailing speed 2024', Value: REF_SPEED_KNOTS, Unit: 'knots', Source: 'Exhibit 9 benchmark' },
    { Constant: 'Design propulsion power', Value: DESIGN_PROPULSION_MW, Unit: 'MW', Source: 'Case p.5 (efficiency package included)' },
    { Constant: 'Design hotel load', Value: DESIGN_HOTEL_MW, Unit: 'MW', Source: 'Case p.5' },
    { Constant: 'Efficiency package saving', Value: pct(EFFICIENCY_PACKAGE_SAVING), Unit: '%', Source: 'Case p.5' },
    { Constant: 'MGO burn per MWh delivered', Value: r(MGO_TONNES_PER_MWH, 4), Unit: 't/MWh', Source: 'Case p.5 — 0.5 t/h at 2.6 MW' },
    { Constant: 'ICE CO2e per MWh delivered', Value: r(ICE_CO2_TONNES_PER_MWH, 4), Unit: 't/MWh', Source: 'Case p.5 — 1.6 t/h at 2.6 MW' },
    { Constant: 'Norwegian grid intensity', Value: CASE_ASSUMPTIONS.gridCO2gPerKWh, Unit: 'g CO2/kWh', Source: 'Case p.4 (Exhibit 7 for other mixes)' },
    { Constant: 'Marine gas oil price', Value: CASE_ASSUMPTIONS.mgoCostPerTonne, Unit: 'USD/t', Source: 'Case p.4 (Exhibit 6 for history)' },
    { Constant: 'Electricity price', Value: CASE_ASSUMPTIONS.electricityCostPerKWh, Unit: 'USD/kWh', Source: 'Case p.4 — 75 oere/kWh' },
    { Constant: 'EV vessel total cost', Value: EV_TOTAL_COST, Unit: 'USD', Source: 'Case p.5' },
    { Constant: 'Battery share of EV cost', Value: pct(EV_BATTERY_COST_SHARE), Unit: '%', Source: 'Case p.5' },
    { Constant: 'Implied battery cost', Value: r(BATTERY_COST_PER_MWH, 0), Unit: 'USD/MWh', Source: 'Derived — 22.5% of $250M over 70 MWh (cf. Exhibit 8)' },
    { Constant: 'ICE propulsion share of vessel cost', Value: pct(ICE_PROPULSION_COST_SHARE), Unit: '%', Source: 'Case p.5' },
    { Constant: 'Efficiency package cost', Value: EFFICIENCY_PACKAGE_COST, Unit: 'USD', Source: 'Case p.5' },
    { Constant: 'Common vessel cost (hull, hotel, outfit)', Value: r(COMMON_VESSEL_COST, 0), Unit: 'USD', Source: 'Derived from the $250M total' },
    { Constant: 'ICE vessel total (with efficiency pkg)', Value: r(iceVesselTotalCost(true), 0), Unit: 'USD', Source: 'Derived' },
    { Constant: 'Shore charging cost per port', Value: CHARGING_INFRA_PER_PORT, Unit: 'USD', Source: 'Case p.7 — at the 12 MW design point' },
    { Constant: 'Design shore connector rating', Value: DESIGN_CHARGE_POWER_MW, Unit: 'MW', Source: 'Case p.6 (Cavotec / Plug)' },
    { Constant: 'Roundtrips per vessel per year', Value: ROUNDTRIPS_PER_YEAR, Unit: 'count', Source: 'Case p.5' },
    { Constant: 'Analysis horizon', Value: ANALYSIS_YEARS, Unit: 'years', Source: 'Modelling choice' },
    { Constant: 'Speed exponent (default)', Value: DEFAULT_CUBE_EXPONENT, Unit: '', Source: 'Least-squares fit to the four Exhibit 9 points' },
    { Constant: 'Terminal turnaround', Value: TERMINAL_TURNAROUND_MINUTES, Unit: 'min', Source: 'ASSUMPTION — mirrors the Kirkenes call' },
    { Constant: 'CC-to-CV changeover', Value: pct(CC_CV_THRESHOLD), Unit: '% SoC', Source: 'ASSUMPTION' },
    { Constant: 'Grid headroom — strong tier', Value: pct(GRID_HEADROOM_FRACTION.strong), Unit: '% of connector', Source: 'ASSUMPTION — case gives no per-port capacity' },
    { Constant: 'Grid headroom — medium tier', Value: pct(GRID_HEADROOM_FRACTION.medium), Unit: '% of connector', Source: 'ASSUMPTION' },
    { Constant: 'Grid headroom — weak tier', Value: r(pct(GRID_HEADROOM_FRACTION.weak), 1), Unit: '% of connector', Source: 'ASSUMPTION' },
  ], [40, 18, 16, 52]);

  return wb;
}

/**
 * Build the workbook and hand it to the browser as a download.
 *
 * Async purely because SheetJS is code-split — the await resolves the chunk,
 * not any real I/O.
 */
export async function downloadWorkbook(input: ExportInput) {
  const XLSX = await import('xlsx');
  const wb = buildWorkbook(XLSX, input);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const safeRoute = input.routeName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  XLSX.writeFile(wb, `sea-zero-${safeRoute || 'export'}-${stamp}.xlsx`);
}
