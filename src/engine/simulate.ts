// Sea Zero — Physics simulation engine
//
// Two things happen here, and they are deliberately kept apart:
//
//   1. The VOYAGE ENERGY PROFILE — how much energy the ship needs, leg by leg.
//      This depends on speed, load and the efficiency package, not on whether
//      the ship is battery or diesel powered. Both vessel options are costed
//      from this same profile so the comparison is apples-to-apples.
//
//   2. The BATTERY SIMULATION — whether an EV can actually deliver that profile
//      given the battery size, the charger network and the Exhibit 2 timetable.
//
// Timing comes from Exhibit 2 rather than distance ÷ speed, so at the default
// 13.2 knots the simulated schedule reproduces the case exactly.

import { PORTS as DEFAULT_PORTS, Port } from '@/data/ports';
import { LEGS as DEFAULT_LEGS, Leg } from '@/data/legs';
import { SimulationConfig, LegResult, SimulationResult, PortConfig } from './types';
import { buildVoyage, countPortCalls, VoyageLeg } from './voyage';
import {
  REF_SPEED_KNOTS,
  DESIGN_PROPULSION_MW,
  DESIGN_HOTEL_MW,
  NO_EFFICIENCY_PENALTY,
  MGO_TONNES_PER_MWH,
  ICE_CO2_TONNES_PER_MWH,
  CARGO_LOAD_POWER_SENSITIVITY,
  REF_CARGO_LOAD_PERCENT,
  REF_SEA_MARGIN_PERCENT,
  gridHeadroomMW,
  CC_CV_THRESHOLD,
} from './constants';

/**
 * CC-CV charge model: compute energy stored in the battery over a time window.
 *
 * Phase 1 (CC): constant-current charging at full power up to CC_CV_THRESHOLD.
 * Phase 2 (CV): power tapers exponentially from there to 100% SoC.
 *
 * Returns { stored, drawn, ccFraction, hoursUsed } where:
 *   stored     = MWh added to the battery (after charge efficiency)
 *   drawn      = MWh drawn from the grid (before efficiency)
 *   ccFraction = fraction of stored energy that came from the CC phase
 *   hoursUsed  = time actually spent charging (< availableHours if it filled up)
 */
function ccCvCharge(
  socMWh: number,
  socMaxMWh: number,
  chargePowerMW: number,
  availableHours: number,
  chargeEfficiency: number,
): { stored: number; drawn: number; ccFraction: number; hoursUsed: number } {
  if (chargePowerMW <= 0 || availableHours <= 0 || socMaxMWh <= 0) {
    return { stored: 0, drawn: 0, ccFraction: 0, hoursUsed: 0 };
  }

  const dt = 1 / 60; // 1-minute time steps (in hours)
  let soc = Math.min(Math.max(0, socMWh), socMaxMWh);
  let totalDrawn = 0;
  let ccEnergy = 0;
  let cvEnergy = 0;
  let t = 0;

  while (t < availableHours && soc < socMaxMWh - 1e-9) {
    const socFraction = soc / socMaxMWh;

    // Instantaneous charge power: full rate, then an exponential taper that
    // reaches ~5% of full power at 100% SoC.
    const instantPower =
      socFraction < CC_CV_THRESHOLD
        ? chargePowerMW
        : chargePowerMW * Math.exp(-3 * ((socFraction - CC_CV_THRESHOLD) / (1 - CC_CV_THRESHOLD)));

    const step = Math.min(dt, availableHours - t);
    const storedEnergy = instantPower * step * chargeEfficiency;
    const newSoc = Math.min(socMaxMWh, soc + storedEnergy);
    const actualStored = newSoc - soc;

    totalDrawn += actualStored / chargeEfficiency;
    if (socFraction < CC_CV_THRESHOLD) ccEnergy += actualStored;
    else cvEnergy += actualStored;

    soc = newSoc;
    t += step;
  }

  const totalStored = ccEnergy + cvEnergy;
  return {
    stored: totalStored,
    drawn: totalDrawn,
    ccFraction: totalStored > 0 ? ccEnergy / totalStored : 1,
    hoursUsed: t,
  };
}

/** Minutes of charging needed to add `targetMWh` to the battery from `socMWh`. */
function minutesToCharge(
  socMWh: number,
  socMaxMWh: number,
  targetMWh: number,
  chargePowerMW: number,
  chargeEfficiency: number,
): number {
  if (targetMWh <= 0) return 0;
  if (chargePowerMW <= 0) return Infinity;
  // Walk the same taper forward until we have stored enough.
  const dt = 1 / 60;
  let soc = Math.min(Math.max(0, socMWh), socMaxMWh);
  let stored = 0;
  let minutes = 0;
  const cap = 24 * 60; // don't search past a full day
  while (stored < targetMWh - 1e-9 && minutes < cap) {
    if (soc >= socMaxMWh - 1e-9) return Infinity; // battery full, target unreachable
    const socFraction = soc / socMaxMWh;
    const instantPower =
      socFraction < CC_CV_THRESHOLD
        ? chargePowerMW
        : chargePowerMW * Math.exp(-3 * ((socFraction - CC_CV_THRESHOLD) / (1 - CC_CV_THRESHOLD)));
    const added = Math.min(socMaxMWh - soc, instantPower * dt * chargeEfficiency);
    soc += added;
    stored += added;
    minutes += 1;
  }
  return stored >= targetMWh - 1e-9 ? minutes : Infinity;
}

/** Index ports and port configs by id — ids are not guaranteed to equal array positions. */
function indexById<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}
function indexPortConfigs(configs: PortConfig[]): Map<number, PortConfig> {
  return new Map(configs.map((c) => [c.portId, c]));
}

/**
 * Run the full voyage simulation.
 *
 * The energy profile is always computed. The battery trace is always computed
 * too (so the EV column of the comparison stays populated even when the user is
 * looking at the ICE option), but only constrains feasibility for `vesselType: 'ev'`.
 */
export function simulate(
  config: SimulationConfig,
  ports: Port[] = DEFAULT_PORTS,
  legs: Leg[] = DEFAULT_LEGS,
): SimulationResult {
  const {
    vesselType,
    batteryMWh,
    speedKnots,
    cargoLoadPercent,
    efficiencyPackage,
    reservePercent,
    cubeExponent,
    portConfigs,
    seaMarginPercent,
    connectionOverheadMinutes,
    batteryEfficiency,
    scheduleToleranceHours,
    chargePowerMW,
    voyageMode,
  } = config;

  // Expand the tabulated northbound legs into the voyage actually sailed. For a
  // roundtrip this appends the reversed legs, so every port after the first is
  // visited twice and carries its own dwell in each direction.
  const voyageLegs: VoyageLeg[] = buildVoyage(ports, legs, voyageMode);

  const portById = indexById(ports);
  const configById = indexPortConfigs(portConfigs);

  const socMax = batteryMWh;
  const reserveFloor = socMax * (reservePercent / 100);

  // Round-trip efficiency split evenly between charging and discharging.
  const chargeEfficiency = Math.sqrt(batteryEfficiency);
  const dischargeEfficiency = Math.sqrt(batteryEfficiency);

  // ── Power model ──
  // DESIGN_PROPULSION_MW / DESIGN_HOTEL_MW describe the efficiency-upgraded
  // vessel at REF_SPEED_KNOTS, at a representative load and weather margin.
  // A ship without the package draws more; the cargo and sea-margin factors are
  // normalised so they cancel at the reference values, which makes the default
  // configuration reproduce the case's stated 2.0 MW / 0.6 MW exactly.
  const efficiencyMultiplier = efficiencyPackage ? 1.0 : NO_EFFICIENCY_PENALTY;
  const loadFactor =
    (1.0 + CARGO_LOAD_POWER_SENSITIVITY * (cargoLoadPercent / 100)) /
    (1.0 + CARGO_LOAD_POWER_SENSITIVITY * (REF_CARGO_LOAD_PERCENT / 100));
  const seaMarginMultiplier =
    (1.0 + seaMarginPercent / 100) / (1.0 + REF_SEA_MARGIN_PERCENT / 100);

  const propulsionPowerMW =
    DESIGN_PROPULSION_MW *
    Math.pow(speedKnots / REF_SPEED_KNOTS, cubeExponent) *
    loadFactor *
    seaMarginMultiplier *
    efficiencyMultiplier;

  const hotelPowerMW = DESIGN_HOTEL_MW * efficiencyMultiplier;

  // Running the timetable faster or slower scales every scheduled leg time.
  const timeScale = REF_SPEED_KNOTS / speedKnots;

  // ── Origin ──
  // Departing "fully charged" is not free, and it is only possible if the
  // origin actually has a charger.
  const originPort = portById.get(voyageLegs[0]?.fromPortId ?? ports[0]?.id ?? 0) ?? ports[0];
  const originConfig = originPort ? configById.get(originPort.id) : undefined;
  const originHasCharger = Boolean(originConfig?.hasCharger);
  const initialChargeGridMWh = socMax / chargeEfficiency;

  // The battery trace only constrains an EV. For the ICE option we still want
  // the energy profile, but a state of charge would be meaningless.
  const trackBattery = vesselType === 'ev';

  let soc = originHasCharger || !trackBattery ? socMax : 0;

  const legResults: LegResult[] = [];
  let totalEnergy = 0;
  let totalBatteryDraw = 0;
  let totalSailing = 0;
  let totalDistance = 0;
  let totalCharged = 0;
  let totalFuel = 0;
  let deadZoneCount = 0;
  let totalShortfall = 0;
  let worstMargin = Infinity;
  let totalSlip = 0;
  let gridThrottledCount = 0;
  let scheduledHours = 0;
  let actualHours = 0;
  let chargingWindowHours = 0;
  let cumulativeEnergy = 0;
  let cumulativeFuel = 0;

  for (let i = 0; i < voyageLegs.length; i++) {
    const leg = voyageLegs[i];
    const fromPort = portById.get(leg.fromPortId);
    const toPort = portById.get(leg.toPortId);
    if (!fromPort || !toPort) continue; // malformed route — skip rather than crash

    const portConfig = configById.get(toPort.id);

    // ── SAILING ──
    // Exhibit 2 gives the scheduled time; the speed slider scales it.
    const sailTimeHours = leg.baselineSailHours * timeScale;
    const dwellMinutes = leg.dwellMinutes;
    const dwellHours = dwellMinutes / 60;

    const sailingEnergyMWh = (propulsionPowerMW + hotelPowerMW) * sailTimeHours;
    const portHotelEnergyMWh = hotelPowerMW * dwellHours;
    const legEnergyMWh = sailingEnergyMWh + portHotelEnergyMWh;

    cumulativeEnergy += legEnergyMWh;
    const fuelTonnes = legEnergyMWh * MGO_TONNES_PER_MWH;
    const iceCO2Tonnes = legEnergyMWh * ICE_CO2_TONNES_PER_MWH;
    cumulativeFuel += fuelTonnes;

    // ── BATTERY: sailing discharge ──
    const socBeforeMWh = soc;
    const sailingDraw = sailingEnergyMWh / dischargeEfficiency;

    // The battery cannot go below empty. Anything it could not supply is a
    // real, quantified shortfall rather than a negative state of charge.
    let shortfall = 0;
    let socAfterSailing = soc - sailingDraw;
    if (socAfterSailing < 0) {
      shortfall += -socAfterSailing;
      socAfterSailing = 0;
    }
    soc = socAfterSailing;

    // ── PORT STAY & CHARGING ──
    const hotelDrawAtPort = portHotelEnergyMWh / dischargeEfficiency;

    let chargeGained = 0;
    let chargeGainedRaw = 0;
    let effectiveChargePower = 0;
    let isGridThrottled = false;
    let scheduleSlipMinutes = 0;
    let effectiveChargingMinutes = 0;
    let ccCvPhaseSplit = 1;

    if (portConfig?.hasCharger && dwellMinutes > 0) {
      const chargingMinutes = Math.max(0, dwellMinutes - connectionOverheadMinutes);
      effectiveChargingMinutes = chargingMinutes;
      chargingWindowHours += chargingMinutes / 60;

      const gridHeadroom = gridHeadroomMW(portConfig.gridTier, chargePowerMW);
      // A buffer battery is charged slowly off a weak grid between calls, then
      // dumped into the ship at the full 12 MW connector rating.
      effectiveChargePower = portConfig.hasBufferBattery
        ? chargePowerMW
        : Math.min(chargePowerMW, gridHeadroom);

      const result = ccCvCharge(
        soc,
        socMax,
        effectiveChargePower,
        chargingMinutes / 60,
        chargeEfficiency,
      );

      chargeGained = result.stored;
      chargeGainedRaw = result.drawn;
      ccCvPhaseSplit = result.ccFraction;

      // Throttled = the local grid, not the connector, was the binding limit
      // while the battery still had room to accept charge.
      if (effectiveChargePower < chargePowerMW && soc + chargeGained < socMax - 1e-6) {
        const unthrottled = ccCvCharge(
          soc, socMax, chargePowerMW, chargingMinutes / 60, chargeEfficiency,
        );
        if (unthrottled.stored > chargeGained + 1e-6) {
          isGridThrottled = true;
          gridThrottledCount++;
        }
      }
    }

    // Hotel load keeps running while docked.
    let socAfterPort = soc + chargeGained - hotelDrawAtPort;
    if (socAfterPort < 0) {
      shortfall += -socAfterPort;
      socAfterPort = 0;
    }

    // ── Schedule slip ──
    // How much longer would this port call have to be for the ship to leave
    // with enough charge to clear the *next* leg and still hold its reserve?
    // This is a diagnostic: the simulated ship holds the timetable and goes
    // flat instead, so slip and dead zones are two views of the same shortfall.
    //
    // Only an EV can incur it. A conventional vessel has no battery to top up,
    // so charging never delays its departure — without the trackBattery guard
    // the ICE option inherited the EV's charging delays and could be judged
    // late against a timetable it would actually have held.
    const nextLeg = voyageLegs[i + 1];
    if (trackBattery && nextLeg && portConfig?.hasCharger && effectiveChargePower > 0) {
      const nextSailHours = nextLeg.baselineSailHours * timeScale;
      const nextDwellHours = nextLeg.dwellMinutes / 60;
      const nextDraw =
        ((propulsionPowerMW + hotelPowerMW) * nextSailHours + hotelPowerMW * nextDwellHours) /
        dischargeEfficiency;
      const requiredDeparture = Math.min(socMax, nextDraw + reserveFloor);
      const deficit = requiredDeparture - socAfterPort;
      if (deficit > 1e-6) {
        const extra = minutesToCharge(
          socAfterPort, socMax, deficit, effectiveChargePower, chargeEfficiency,
        );
        scheduleSlipMinutes = Number.isFinite(extra) ? extra : 0;
      }
    }

    soc = socAfterPort;

    // ── Diagnostics ──
    const lowestSoc = Math.min(socAfterSailing, socAfterPort);
    const isDeadZone = trackBattery && lowestSoc < reserveFloor;
    if (isDeadZone) deadZoneCount++;
    const marginPercent = ((lowestSoc - reserveFloor) / socMax) * 100;
    if (trackBattery && marginPercent < worstMargin) worstMargin = marginPercent;

    totalEnergy += legEnergyMWh;
    totalBatteryDraw += sailingDraw + hotelDrawAtPort;
    totalSailing += sailTimeHours;
    totalDistance += leg.distanceKm;
    totalCharged += chargeGained;
    totalFuel += fuelTonnes;
    if (trackBattery) totalShortfall += shortfall;
    totalSlip += scheduleSlipMinutes;
    scheduledHours += leg.baselineSailHours + dwellHours;
    actualHours += sailTimeHours + dwellHours + scheduleSlipMinutes / 60;

    legResults.push({
      legIndex: leg.index,
      voyageIndex: leg.voyageIndex,
      direction: leg.direction,
      fromPortId: leg.fromPortId,
      toPortId: leg.toPortId,
      fromPortName: fromPort.name,
      toPortName: toPort.name,
      distanceKm: leg.distanceKm,

      baselineSailHours: leg.baselineSailHours,
      sailTimeHours,
      dwellMinutes,

      propulsionPowerMW,
      hotelPowerMW,
      sailingEnergyMWh,
      portHotelEnergyMWh,
      legEnergyMWh,
      cumulativeEnergyMWh: cumulativeEnergy,

      fuelTonnes,
      iceCO2Tonnes,
      cumulativeFuelTonnes: cumulativeFuel,

      batteryDrawMWh: sailingDraw + hotelDrawAtPort,
      socBeforeMWh,
      socAfterSailingMWh: socAfterSailing,
      chargeGainedMWh: chargeGained,
      chargeGainedRawMWh: chargeGainedRaw,
      socAfterPortMWh: socAfterPort,
      lowestSocMWh: lowestSoc,
      marginPercent,

      isDeadZone,
      energyShortfallMWh: shortfall,
      isGridThrottled,
      scheduleSlipMinutes,
      effectiveChargePowerMW: effectiveChargePower,
      effectiveChargingMinutes,
      ccCvPhaseSplit,
    });
  }

  const scheduleDeviationHours = actualHours - scheduledHours;
  const onSchedule = scheduleDeviationHours <= scheduleToleranceHours + 1e-9;

  // Grid energy follows from the energy balance, not from where the chargers
  // happen to be: every MWh delivered to the loads had to pass through the
  // battery, so it was bought with the full round-trip loss on top. Charger
  // placement decides *whether* the voyage is possible, not how much energy it
  // consumes — which keeps the EV cost column well-defined even for scenarios
  // with sparse or no charging infrastructure.
  const totalGridEnergy = totalEnergy / batteryEfficiency;

  // Upper bound on what the timetable could deliver: every charging minute at
  // the full connector rating, ignoring taper and battery-full stalls. If the
  // voyage fails this test it cannot be rescued by moving chargers around —
  // the schedule itself has to change, or the connector, or the ship.
  const chargingCapacityMWh = chargingWindowHours * chargePowerMW;
  const energyBalanceMWh = chargingCapacityMWh + initialChargeGridMWh - totalGridEnergy;

  const chargingPortCount = portConfigs.filter((p) => p.hasCharger).length;
  const bufferBatteryCount = portConfigs.filter((p) => p.hasCharger && p.hasBufferBattery).length;

  // ── Verdict ──
  // The ICE option has no battery to strand; only the timetable can break it.
  const reasons: string[] = [];

  if (!onSchedule) {
    const late = scheduleDeviationHours;
    reasons.push(
      late > 0
        ? `Voyage runs ${late.toFixed(1)} h behind the Exhibit 2 timetable (${scheduledHours.toFixed(1)} h) — the Kystruten contract requires daily calls at every port`
        : `Voyage deviates ${Math.abs(late).toFixed(1)} h from the Exhibit 2 timetable`,
    );
  }

  if (trackBattery) {
    if (!originHasCharger && originPort) {
      reasons.push(`No charger at ${originPort.name} — the ship cannot depart fully charged`);
    }
    if (deadZoneCount > 0) {
      const firstDead = legResults.find((l) => l.isDeadZone);
      reasons.push(
        `Battery drops below the ${reservePercent}% reserve on ${firstDead?.fromPortName} → ${firstDead?.toPortName} (${deadZoneCount} dead zone${deadZoneCount > 1 ? 's' : ''} total)`,
      );
    }
    if (totalShortfall > 0.01) {
      reasons.push(`${totalShortfall.toFixed(1)} MWh of demand the battery could not supply`);
    }
    if (energyBalanceMWh < 0) {
      reasons.push(
        `Timetable offers only ${chargingCapacityMWh.toFixed(0)} MWh of charging window against ${totalGridEnergy.toFixed(0)} MWh of demand — ${Math.abs(energyBalanceMWh).toFixed(0)} MWh short even with perfect charging`,
      );
    }
  }

  const feasible = reasons.length === 0;

  return {
    vesselType,
    voyageMode,
    legs: legResults,
    portCallCount: countPortCalls(voyageLegs),

    totalDistanceKm: totalDistance,
    totalSailingHours: totalSailing,
    scheduledVoyageHours: scheduledHours,
    actualVoyageHours: actualHours,
    scheduleDeviationHours,
    onSchedule,

    totalEnergyMWh: totalEnergy,
    totalFuelTonnes: totalFuel,

    totalBatteryDrawMWh: totalBatteryDraw,
    totalChargedMWh: totalCharged,
    initialChargeGridMWh,
    totalGridEnergyMWh: totalGridEnergy,
    chargingWindowHours,
    chargingCapacityMWh,
    energyBalanceMWh,
    deadZoneCount,
    totalEnergyShortfallMWh: totalShortfall,
    worstMarginPercent: worstMargin === Infinity ? 100 : worstMargin,
    totalScheduleSlipMinutes: totalSlip,
    gridThrottledPortCount: gridThrottledCount,
    chargingPortCount,
    bufferBatteryCount,

    feasible,
    infeasibleReason: reasons.join(' · '),
  };
}
