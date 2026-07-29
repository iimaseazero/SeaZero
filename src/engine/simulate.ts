// Sea Zero — Physics simulation engine
// Steps the vessel leg by leg, tracking battery SoC
// Enhanced with CC-CV charging, sea margin, connection overhead, battery efficiency

import { PORTS as DEFAULT_PORTS, GRID_HEADROOM, Port } from '@/data/ports';
import { LEGS as DEFAULT_LEGS, Leg } from '@/data/legs';
import { SimulationConfig, LegResult, SimulationResult } from './types';

/**
 * CC-CV charge model: compute energy stored in battery over a time window.
 *
 * Phase 1 (CC): Constant-current charging at full power up to CC_THRESHOLD (80% SoC).
 * Phase 2 (CV): Power tapers exponentially from 80% to 100% SoC.
 *
 * Returns { stored, drawn, ccFraction } where:
 *   stored = MWh added to battery (after charge efficiency)
 *   drawn  = MWh drawn from grid (before efficiency)
 *   ccFraction = fraction of stored energy that came from CC phase
 */
const CC_THRESHOLD = 0.80; // SoC fraction where taper begins

function ccCvCharge(
  socMWh: number,
  socMaxMWh: number,
  chargePowerMW: number,
  availableHours: number,
  chargeEfficiency: number, // sqrt of round-trip efficiency
): { stored: number; drawn: number; ccFraction: number } {
  if (chargePowerMW <= 0 || availableHours <= 0) {
    return { stored: 0, drawn: 0, ccFraction: 0 };
  }

  const dt = 1 / 60; // 1-minute time steps (in hours)
  let soc = Math.max(0, socMWh);
  let totalDrawn = 0;
  let ccEnergy = 0;
  let cvEnergy = 0;
  let t = 0;

  while (t < availableHours && soc < socMaxMWh) {
    const socFraction = soc / socMaxMWh;

    // Determine instantaneous charge power
    let instantPower: number;
    if (socFraction < CC_THRESHOLD) {
      // CC phase: full power
      instantPower = chargePowerMW;
    } else {
      // CV phase: exponential taper
      // At 80% → full power, at 100% → ~5% of full power
      const x = (socFraction - CC_THRESHOLD) / (1 - CC_THRESHOLD); // 0→1 across CV range
      instantPower = chargePowerMW * Math.exp(-3 * x);
    }

    const gridEnergy = instantPower * dt;
    const storedEnergy = gridEnergy * chargeEfficiency;
    const newSoc = Math.min(socMaxMWh, soc + storedEnergy);
    const actualStored = newSoc - soc;
    const actualDrawn = actualStored / chargeEfficiency;

    totalDrawn += actualDrawn;
    if (socFraction < CC_THRESHOLD) {
      ccEnergy += actualStored;
    } else {
      cvEnergy += actualStored;
    }
    soc = newSoc;
    t += dt;
  }

  const totalStored = ccEnergy + cvEnergy;
  const ccFraction = totalStored > 0 ? ccEnergy / totalStored : 1;

  return { stored: totalStored, drawn: totalDrawn, ccFraction };
}

/**
 * Run the full voyage simulation.
 * Steps through all legs, computing energy consumption, charging, and SoC.
 * Accepts optional ports and legs arrays for custom routes.
 */
export function simulate(
  config: SimulationConfig,
  ports: Port[] = DEFAULT_PORTS,
  legs: Leg[] = DEFAULT_LEGS,
): SimulationResult {
  const {
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
  } = config;

  const socMax = batteryMWh;
  const reserveFloor = socMax * (reservePercent / 100);
  let soc = socMax; // start fully charged

  // Battery efficiency: split round-trip into charge and discharge
  const chargeEfficiency = Math.sqrt(batteryEfficiency);
  const dischargeEfficiency = Math.sqrt(batteryEfficiency);

  // Propulsion power: P_prop = 2.0 MW × (speed / 13.2)^n × loadFactor × U × seaMargin
  const loadFactor = 1.0 + 0.10 * (cargoLoadPercent / 100);
  const efficiencyMultiplier = efficiencyPackage ? 0.60 : 1.0;
  const seaMarginMultiplier = 1.0 + seaMarginPercent / 100;
  const propulsionPowerMW =
    2.0 * Math.pow(speedKnots / 13.2, cubeExponent) * loadFactor * efficiencyMultiplier * seaMarginMultiplier;

  // Hotel load: 0.6 MW × (0.75 if efficiency package else 1.0)
  const hotelPowerMW = 0.6 * (efficiencyPackage ? 0.75 : 1.0);

  const legResults: LegResult[] = [];
  let totalEnergy = 0;
  let totalSailing = 0;
  let totalDistance = 0;
  let totalCharged = 0;
  let deadZoneCount = 0;
  let worstMargin = Infinity;
  let totalSlip = 0;
  let gridThrottledCount = 0;

  for (const leg of legs) {
    const fromPort = ports[leg.fromPortId];
    const toPort = ports[leg.toPortId];
    const portConfig = portConfigs[toPort.id];

    // --- SAILING ---
    // Sailing time: t_sail = dist_km / (speed_kn × 1.852)
    const sailTimeHours = leg.distanceKm / (speedKnots * 1.852);

    // Energy consumed during sailing (accounting for discharge efficiency loss)
    const rawSailingEnergy = (propulsionPowerMW + hotelPowerMW) * sailTimeHours;
    const sailingEnergyMWh = rawSailingEnergy / dischargeEfficiency; // more SoC drained due to losses

    const socBeforeMWh = soc;
    soc -= sailingEnergyMWh;

    const socAfterSailing = soc;

    // Check dead zone — SoC below reserve floor during this leg
    const lowestSoc = socAfterSailing;
    const isDeadZone = lowestSoc < reserveFloor;
    if (isDeadZone) deadZoneCount++;

    const marginMWh = lowestSoc - reserveFloor;
    const marginPercent = (marginMWh / socMax) * 100;
    if (marginPercent < worstMargin) worstMargin = marginPercent;

    // --- PORT STAY & CHARGING ---
    const dwellMinutes = toPort.portStayMinutes;
    const dwellHours = dwellMinutes / 60;

    // Hotel energy consumed during port stay (also subject to discharge efficiency)
    const hotelEnergyAtPort = (hotelPowerMW * dwellHours) / dischargeEfficiency;

    // Charging — with connection overhead and CC-CV curve
    let chargeGained = 0;
    let chargeGainedRaw = 0;
    let effectiveChargePower = 0;
    let isGridThrottled = false;
    let scheduleSlipMinutes = 0;
    let effectiveChargingMinutes = 0;
    let ccCvPhaseSplit = 1;

    if (portConfig && portConfig.hasCharger && dwellMinutes > 0) {
      // Subtract connection/disconnection overhead
      const chargingMinutes = Math.max(0, dwellMinutes - connectionOverheadMinutes);
      effectiveChargingMinutes = chargingMinutes;
      const chargingHours = chargingMinutes / 60;

      // Effective charging power
      const gridHeadroom = GRID_HEADROOM[portConfig.gridTier];
      effectiveChargePower = portConfig.hasBufferBattery
        ? 12 // buffer battery lifts to 12 MW
        : Math.min(12, gridHeadroom);

      // CC-CV charge model
      const currentSoc = Math.max(0, soc); // soc could be negative from simulation
      const ccCvResult = ccCvCharge(
        currentSoc,
        socMax,
        effectiveChargePower,
        chargingHours,
        chargeEfficiency,
      );

      chargeGained = ccCvResult.stored;
      chargeGainedRaw = ccCvResult.drawn;
      ccCvPhaseSplit = ccCvResult.ccFraction;

      // Grid throttle check: throttled below 12 MW and couldn't fully recharge
      if (effectiveChargePower < 12) {
        const spaceInBattery = socMax - currentSoc;
        if (chargeGained < spaceInBattery * 0.95) {
          // Check if higher power would have helped
          const hypothetical = ccCvCharge(
            currentSoc, socMax, 12, chargingHours, chargeEfficiency,
          );
          if (hypothetical.stored > chargeGained * 1.05) {
            isGridThrottled = true;
            gridThrottledCount++;
            // Schedule slip: extra time needed to charge the deficit
            const deficit = hypothetical.stored - chargeGained;
            if (deficit > 0 && effectiveChargePower > 0) {
              scheduleSlipMinutes = (deficit / (effectiveChargePower * chargeEfficiency)) * 60;
            }
          }
        }
      }
    }

    // Net SoC after port: charge gained minus hotel at port
    soc = soc + chargeGained - hotelEnergyAtPort;
    const socAfterPort = soc;

    totalEnergy += sailingEnergyMWh;
    totalSailing += sailTimeHours;
    totalDistance += leg.distanceKm;
    totalCharged += chargeGained;
    totalSlip += scheduleSlipMinutes;

    legResults.push({
      legIndex: leg.index,
      fromPortName: fromPort.name,
      toPortName: toPort.name,
      distanceKm: leg.distanceKm,
      sailTimeHours,
      propulsionPowerMW,
      hotelPowerMW,
      energyConsumedMWh: sailingEnergyMWh,
      socBeforeMWh,
      socAfterSailingMWh: socAfterSailing,
      chargeGainedMWh: chargeGained,
      chargeGainedRawMWh: chargeGainedRaw,
      hotelEnergyAtPortMWh: hotelEnergyAtPort,
      socAfterPortMWh: socAfterPort,
      isDeadZone,
      lowestSocMWh: lowestSoc,
      marginPercent,
      isGridThrottled,
      scheduleSlipMinutes,
      dwellMinutes,
      effectiveChargePowerMW: effectiveChargePower,
      effectiveChargingMinutes,
      ccCvPhaseSplit,
    });
  }

  // Feasibility
  const feasible = deadZoneCount === 0;
  let infeasibleReason = '';
  if (!feasible) {
    const firstDead = legResults.find((l) => l.isDeadZone);
    infeasibleReason = `Battery depleted below ${reservePercent}% reserve on ${firstDead?.fromPortName} → ${firstDead?.toPortName} (${deadZoneCount} dead zone${deadZoneCount > 1 ? 's' : ''} total)`;
  }

  const chargingPortCount = portConfigs.filter((p) => p.hasCharger).length;
  const bufferBatteryCount = portConfigs.filter((p) => p.hasBufferBattery).length;

  return {
    legs: legResults,
    totalEnergyMWh: totalEnergy,
    totalSailingHours: totalSailing,
    totalDistanceKm: totalDistance,
    totalChargedMWh: totalCharged,
    deadZoneCount,
    worstMarginPercent: worstMargin === Infinity ? 100 : worstMargin,
    totalScheduleSlipMinutes: totalSlip,
    gridThrottledPortCount: gridThrottledCount,
    feasible,
    infeasibleReason,
    chargingPortCount,
    bufferBatteryCount,
  };
}
