// Sea Zero — Case-derived constants
//
// Every value here traces back to "Hurtigruten: Sea Zero" (HBS 9-625-100).
// Values that are NOT in the case are marked [ASSUMPTION] and should be
// treated as modelling choices, not facts.

// ─── Route reference ───

/** Fleet average sailing speed as of 2024 — the 100% benchmark in Exhibit 9. */
export const REF_SPEED_KNOTS = 13.2;

/** Nautical mile in km, for knots → km/h conversion. */
export const KM_PER_NAUTICAL_MILE = 1.852;

// ─── Vessel power (case p.5) ───
//
// "Based on their simulations and tests, the newly designed vessel would use
//  about 2 MW of power for propulsion and 0.6 MW (600KW) for the hotel system."
//
// IMPORTANT: this 2.0 / 0.6 figure describes the vessel *with* the Sintef
// efficiency work already incorporated — the preceding paragraph explains the
// work packages reduce total energy ~40%, and the following sentence sizes the
// 70 MWh battery off the back of it. So these are the EFFICIENT numbers, and a
// vessel without the package consumes more, not less.

/** Propulsion demand at REF_SPEED_KNOTS, efficiency package included (MW). */
export const DESIGN_PROPULSION_MW = 2.0;

/** Hotel (passenger-facing) load, efficiency package included (MW). */
export const DESIGN_HOTEL_MW = 0.6;

/** "would reduce the total energy used by an estimated 40%" (case p.5). */
export const EFFICIENCY_PACKAGE_SAVING = 0.40;

/**
 * Multiplier applied to design power when the efficiency package is NOT bought.
 * 2.0 MW is the post-upgrade figure, so the un-upgraded ship draws 1 / (1 - 0.40).
 */
export const NO_EFFICIENCY_PENALTY = 1 / (1 - EFFICIENCY_PACKAGE_SAVING); // 1.667

// ─── Fuel and emissions (case p.5) ───
//
// "this amount of power would require burning approximately 0.5 tons of marine
//  gas oil per hour, which would emit 1.6 tons of CO2e"
//
// "this amount of power" = 2.0 + 0.6 = 2.6 MW. Normalising by that gives an
// intensity that scales correctly with load — which is what Exhibit 9 shows
// (emissions rise with speed). Using a flat tonnes-per-hour instead inverts it.

/** Total shaft + hotel power the 0.5 t/hr and 1.6 t/hr figures refer to (MW). */
export const FUEL_REFERENCE_POWER_MW = DESIGN_PROPULSION_MW + DESIGN_HOTEL_MW; // 2.6

/** Marine gas oil burn per MWh of delivered energy (tonnes). */
export const MGO_TONNES_PER_MWH = 0.5 / FUEL_REFERENCE_POWER_MW; // 0.1923

/** CO2e per MWh of delivered energy on marine gas oil (tonnes). */
export const ICE_CO2_TONNES_PER_MWH = 1.6 / FUEL_REFERENCE_POWER_MW; // 0.6154

/** Norwegian grid intensity, g CO2/kWh (case p.4). */
export const GRID_CO2_G_PER_KWH = 30;

// ─── Prices (case p.4, p.6) ───

/** Marine gas oil at Kystruten ports, $/tonne (case p.4). */
export const MGO_COST_PER_TONNE = 1200;

/** Norwegian electricity, 75 øre/kWh ≈ $0.07/kWh (case p.4). */
export const ELECTRICITY_COST_PER_KWH = 0.07;

/**
 * $190/ton CO2. In the case this is the penalty for breaching the 2021–2030
 * tender's fleet-wide emissions target — NOT a blanket tax on every tonne.
 * We use it as a carbon *shadow price* so the comparison has a carbon signal,
 * and expose it as a slider so its influence is visible rather than baked in.
 * [ASSUMPTION: applying it per-tonne overstates ICE's exposure.]
 */
export const DEFAULT_CARBON_PRICE_PER_TON = 190;

// ─── Capital costs (case p.5, p.7) ───

/** "the EV ship's total cost that they estimated to be $250 million" (p.5). */
export const EV_TOTAL_COST = 250_000_000;

/** "the battery alone would still account for about 22.5% of the EV ship's total cost" (p.5). */
export const EV_BATTERY_COST_SHARE = 0.225;

/** Battery cost at the 70 MWh design point. */
export const BATTERY_COST_70MWH = EV_TOTAL_COST * EV_BATTERY_COST_SHARE; // $56.25M

/** Reference battery size the 22.5% share was quoted against (MWh). */
export const REFERENCE_BATTERY_MWH = 70;

/** Linear battery cost, $/MWh. */
export const BATTERY_COST_PER_MWH = BATTERY_COST_70MWH / REFERENCE_BATTERY_MWH; // $803.6k

/**
 * "the conventional propulsion system on the prior vessel they commissioned
 *  accounted for 12% of its total cost" (p.5).
 */
export const ICE_PROPULSION_COST_SHARE = 0.12;

/** "combined efficiency upgrades would cost $30 million, excluding the propulsion systems" (p.5). */
export const EFFICIENCY_PACKAGE_COST = 30_000_000;

/**
 * Everything that is neither propulsion nor the efficiency package.
 * The $250M EV total is inclusive of both, so back them out to get the
 * common hull/hotel/outfit cost shared by the EV and ICE designs.
 */
export const COMMON_VESSEL_COST =
  EV_TOTAL_COST * (1 - EV_BATTERY_COST_SHARE) - EFFICIENCY_PACKAGE_COST; // $163.75M

/**
 * ICE vessel total, derived rather than invented: same hull and (optionally)
 * the same efficiency package, but a conventional propulsion system costing
 * 12% of that vessel's own total.
 *   total = (common + efficiency) / (1 - 0.12)
 */
export function iceVesselTotalCost(withEfficiencyPackage: boolean): number {
  const nonPropulsion = COMMON_VESSEL_COST + (withEfficiencyPackage ? EFFICIENCY_PACKAGE_COST : 0);
  return nonPropulsion / (1 - ICE_PROPULSION_COST_SHARE);
}

/** "$1 million per port, but if grid upgrades were required the total cost could be substantially higher" (p.7). */
export const CHARGING_INFRA_PER_PORT = 1_000_000;

/** Shore charging system rating Hurtigruten is planning with Cavotec and Plug (p.6). */
export const DESIGN_CHARGE_POWER_MW = 12;

/**
 * [ASSUMPTION] Per-port infrastructure cost scales linearly with connector
 * rating above the 12 MW design point. The case only says grid upgrades could
 * make the $1M/port "substantially higher" without quantifying it.
 */
export function chargingInfraCostPerPort(chargePowerMW: number): number {
  return CHARGING_INFRA_PER_PORT * (chargePowerMW / DESIGN_CHARGE_POWER_MW);
}

/**
 * [ASSUMPTION] Turnaround at the voyage origin before the next departure.
 *
 * Exhibit 2 gives the far terminus (Kirkenes) a 210-minute call but the origin
 * no call at all, since northbound is where the tabulated route starts. Mirroring
 * the terminus figure at the origin makes the roundtrip come out at 258.5 h,
 * which matches the case's "flagship 11-night journey Bergen-to-Bergen roundtrip"
 * (p.3) — and it gives the ship somewhere to recharge between runs.
 */
export const TERMINAL_TURNAROUND_MINUTES = 210;

// ─── Voyage cadence (case p.5) ───
//
// "the Kystruten, a much longer 12-day roundtrip voyage with calls at 67 ports"
// "Approximately 30 times per year, each ship in the Kystruten fleet completed
//  this journey"
//
// The simulator models ONE-WAY Bergen → Kirkenes (Exhibit 2 only tabulates the
// northbound legs), so a roundtrip is two simulated voyages.

/** Roundtrips per vessel per year (case p.5). */
export const ROUNDTRIPS_PER_YEAR = 30;

/** One-way voyages per vessel per year. */
export const ONE_WAY_VOYAGES_PER_YEAR = ROUNDTRIPS_PER_YEAR * 2; // 60

/** How many simulated voyages a vessel completes per year, by mode. */
export function voyagesPerYear(mode: 'one-way' | 'roundtrip'): number {
  return mode === 'roundtrip' ? ROUNDTRIPS_PER_YEAR : ONE_WAY_VOYAGES_PER_YEAR;
}

// ─── Modelling assumptions (NOT from the case) ───

/**
 * [ASSUMPTION] Extra propulsion demand at full cargo/passenger load.
 * The case gives no load-vs-power relationship.
 */
export const CARGO_LOAD_POWER_SENSITIVITY = 0.10;

// The case's 2 MW / 0.6 MW figure comes from Hurtigruten's own simulations of
// the vessel in service — it already reflects a representative cargo load and a
// working allowance for weather. So the cargo and sea-margin sliders are
// normalised against these reference values: at the defaults below they cancel
// to 1.0 and the model reproduces the case exactly, and moving either slider
// shows the effect of departing from the case's operating assumptions.

/** [ASSUMPTION] Cargo/passenger load implicit in the case's 2 MW figure. */
export const REF_CARGO_LOAD_PERCENT = 70;

/** [ASSUMPTION] Weather/sea margin implicit in the case's 2 MW figure. */
export const REF_SEA_MARGIN_PERCENT = 15;

/**
 * [ASSUMPTION] Grid headroom by tier, as a fraction of the shore connector
 * rating. The case says only that grid access is better in the south and that
 * northern ports "would require additional infrastructure investments" — the
 * tiers and numbers here are ours.
 *
 * Expressed as fractions rather than absolute MW so that raising the connector
 * rating (a grid upgrade) lifts every port proportionally. At the 12 MW design
 * point these give the familiar 12 / 6 / 2 MW.
 */
export const GRID_HEADROOM_FRACTION = {
  strong: 1,
  medium: 0.5,
  weak: 1 / 6,
} as const;

/** Grid headroom in MW for a given tier at a given connector rating. */
export function gridHeadroomMW(
  tier: keyof typeof GRID_HEADROOM_FRACTION,
  chargePowerMW: number,
): number {
  return chargePowerMW * GRID_HEADROOM_FRACTION[tier];
}

/** Headroom at the case's 12 MW design point — kept for display purposes. */
export const GRID_HEADROOM_MW = {
  strong: DESIGN_CHARGE_POWER_MW * GRID_HEADROOM_FRACTION.strong,
  medium: DESIGN_CHARGE_POWER_MW * GRID_HEADROOM_FRACTION.medium,
  weak: DESIGN_CHARGE_POWER_MW * GRID_HEADROOM_FRACTION.weak,
} as const;

/**
 * Speed exponent in the propulsion power law, P ∝ v^n.
 *
 * Textbook resistance gives n = 3, but least-squares fitting the four points in
 * Exhibit 9 (75% at 10.7 kn, 85% at 11.8, 100% at 13.2, 120% at 14.8) puts the
 * best fit at n ≈ 3.45 — steeper, as expected once wave-making resistance
 * dominates. At the 13.2 kn reference speed n has no effect, so this only
 * changes off-design behaviour, where the case's own data is the better guide.
 */
export const DEFAULT_CUBE_EXPONENT = 3.45;
export const MIN_CUBE_EXPONENT = 2.7;
export const MAX_CUBE_EXPONENT = 3.6;

/** [ASSUMPTION] SoC fraction at which CC charging gives way to CV taper. */
export const CC_CV_THRESHOLD = 0.80;

/** [ASSUMPTION] Default schedule slack before the timetable is considered broken (hours). */
export const DEFAULT_SCHEDULE_TOLERANCE_HOURS = 2;

/** Analysis horizon in years. */
export const ANALYSIS_YEARS = 10;
