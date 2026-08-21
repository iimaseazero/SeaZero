// Sea Zero — Voyage construction
//
// Exhibit 2 tabulates only the northbound Bergen → Kirkenes legs. The service
// Hurtigruten actually operates is a roundtrip, so the southbound half is built
// by reversing those legs.
//
// Port-call arithmetic, from footnote c on p.5 of the case:
//   "The route between Bergen to Kirkenes included 34 port stops on the
//    northbound route and 33 on the southbound route."
//   34 + 33 = 67, matching "calls at 67 ports" on the same page.
//
// Northbound: depart Bergen, then 33 arrivals ending at Kirkenes = 34 stops.
// Southbound: depart Kirkenes, then 33 arrivals ending at Bergen = 33 stops.
//
// Dwell time moves from the port record onto the leg, because the same port has
// different stops in each direction — most visibly Bergen, which is a zero-dwell
// origin northbound and a turnaround on arrival southbound.

import { Port } from '@/data/ports';
import { Leg } from '@/data/legs';
import { TERMINAL_TURNAROUND_MINUTES } from './constants';

export type VoyageMode = 'one-way' | 'roundtrip';
export type LegDirection = 'north' | 'south';

/** A leg as actually sailed, with its arrival dwell resolved. */
export interface VoyageLeg extends Leg {
  /** Scheduled stop at the destination port, in minutes. */
  dwellMinutes: number;
  direction: LegDirection;
  /** Position in the full voyage, unique even when a port is visited twice. */
  voyageIndex: number;
}

/**
 * Build the sailed leg sequence for a voyage.
 *
 * The southbound half mirrors the northbound distances and scheduled times.
 * [ASSUMPTION] Southbound dwell times are assumed to mirror the northbound
 * ones — the case gives no southbound timetable. The one deliberate exception
 * is the arrival back at the origin, which gets a terminal turnaround equal to
 * the one already scheduled at the far terminus.
 */
export function buildVoyage(
  ports: Port[],
  legs: Leg[],
  mode: VoyageMode,
): VoyageLeg[] {
  const portById = new Map(ports.map((p) => [p.id, p]));
  const dwellOf = (portId: number) => portById.get(portId)?.portStayMinutes ?? 0;

  const northbound: VoyageLeg[] = legs.map((leg, i) => ({
    ...leg,
    dwellMinutes: dwellOf(leg.toPortId),
    direction: 'north' as const,
    voyageIndex: i,
  }));

  if (mode === 'one-way') return northbound;

  const originId = legs[0]?.fromPortId;

  // Walk the northbound legs backwards, swapping each one end for end.
  const southbound: VoyageLeg[] = [];
  for (let i = legs.length - 1; i >= 0; i--) {
    const leg = legs[i];
    const arrivalId = leg.fromPortId;
    southbound.push({
      index: leg.index,
      fromPortId: leg.toPortId,
      toPortId: arrivalId,
      distanceKm: leg.distanceKm,
      baselineSailHours: leg.baselineSailHours,
      // The origin has no scheduled northbound stop, so it would otherwise come
      // back as a zero-minute call — and the ship would have no opportunity to
      // recharge before the next departure.
      dwellMinutes: arrivalId === originId
        ? TERMINAL_TURNAROUND_MINUTES
        : dwellOf(arrivalId),
      direction: 'south',
      voyageIndex: northbound.length + (legs.length - 1 - i),
    });
  }

  return [...northbound, ...southbound];
}

/** Port calls made over the voyage — one per leg, plus the initial departure. */
export function countPortCalls(voyageLegs: VoyageLeg[]): number {
  return voyageLegs.length > 0 ? voyageLegs.length + 1 : 0;
}
