// Sea Zero — Excel port parser
// Client-side Excel file parsing for custom route import

import * as XLSX from 'xlsx';
import { Port, GridTier } from '@/data/ports';
import { Leg } from '@/data/legs';
import { REF_SPEED_KNOTS, KM_PER_NAUTICAL_MILE } from './constants';

export interface ParseResult {
  success: boolean;
  ports: Port[];
  legs: Leg[];
  routeName: string;
  errors: string[];
  warnings: string[];
}

/** Hard caps so a malformed or hostile workbook cannot hang the tab. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PORTS = 500;

/**
 * Keys that must never be copied off a spreadsheet row.
 *
 * `XLSX.utils.sheet_to_json` builds each row object from the header cells, so
 * a header literally named `__proto__` or `constructor` yields an object whose
 * property reads walk the prototype chain. Reading `row.name` on such an object
 * can return attacker-chosen data, and assigning through it can pollute
 * Object.prototype for the whole page.
 */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Read a column from a sheet row without ever touching the prototype chain. */
function readCell(row: Record<string, unknown>, key: string): unknown {
  if (FORBIDDEN_KEYS.has(key)) return undefined;
  return Object.prototype.hasOwnProperty.call(row, key) ? row[key] : undefined;
}

/** Copy a row into a null-prototype object, dropping any dangerous header names. */
function sanitizeRow(raw: unknown): Record<string, unknown> {
  const safe: Record<string, unknown> = Object.create(null);
  if (!raw || typeof raw !== 'object') return safe;
  for (const key of Object.getOwnPropertyNames(raw)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    safe[key] = (raw as Record<string, unknown>)[key];
  }
  return safe;
}

/** Strip control characters and clamp length — port names are rendered as text. */
function sanitizeName(raw: unknown): string {
  return String(raw ?? '')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim()
    .slice(0, 80);
}

/**
 * Haversine distance between two lat/lng points in kilometers.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validate and normalize a grid tier string.
 */
function parseGridTier(raw: string | undefined | null): GridTier | null {
  if (!raw) return null;
  const normalized = String(raw).toLowerCase().trim();
  if (['strong', 'medium', 'weak'].includes(normalized)) {
    return normalized as GridTier;
  }
  return null;
}

/**
 * Parse an Excel file (ArrayBuffer) into Port[] and Leg[] arrays.
 *
 * Expected sheet name: "Ports" (case-insensitive fallback to first sheet)
 * Expected columns: name, lat, lng, gridTier, portStayMinutes, distanceToNextKm (optional)
 */
export function parseExcelFile(data: ArrayBuffer, fileName: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ports: Port[] = [];
  const legs: Leg[] = [];

  if (data.byteLength > MAX_UPLOAD_BYTES) {
    errors.push(
      `File is ${(data.byteLength / 1024 / 1024).toFixed(1)} MB, above the ${MAX_UPLOAD_BYTES / 1024 / 1024} MB limit.`,
    );
    return { success: false, ports: [], legs: [], routeName: fileName, errors, warnings };
  }

  try {
    const workbook = XLSX.read(data, { type: 'array' });

    // Find the sheet — prefer "Ports", fall back to first sheet
    let sheetName = workbook.SheetNames.find(
      (s) => s.toLowerCase() === 'ports'
    );
    if (!sheetName) {
      sheetName = workbook.SheetNames[0];
      warnings.push(`No sheet named "Ports" found. Using first sheet: "${sheetName}".`);
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows: unknown[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Copy every row into a null-prototype object before reading anything, so
    // a header cell named `__proto__` cannot smuggle values through.
    const rows = rawRows.map(sanitizeRow);

    if (rows.length < 2) {
      errors.push('Excel file must have at least 2 ports (rows) to define a route.');
      return { success: false, ports: [], legs: [], routeName: fileName, errors, warnings };
    }

    if (rows.length > MAX_PORTS) {
      errors.push(`Route has ${rows.length} ports, which exceeds the ${MAX_PORTS}-port limit.`);
      return { success: false, ports: [], legs: [], routeName: fileName, errors, warnings };
    }
    if (rows.length > 100) {
      warnings.push(`Large route detected: ${rows.length} ports. Performance may be affected.`);
    }

    // Validate required columns
    const firstRow = rows[0];
    const missing: string[] = [];
    for (const col of ['name', 'lat', 'lng']) {
      if (!Object.prototype.hasOwnProperty.call(firstRow, col)) missing.push(`"${col}"`);
    }
    if (missing.length > 0) {
      errors.push(`Missing required columns: ${missing.join(', ')}. Expected: name, lat, lng.`);
      return { success: false, ports: [], legs: [], routeName: fileName, errors, warnings };
    }

    // Track which sheet row each accepted port came from, so distances read
    // from `distanceToNextKm` stay aligned when a row is rejected.
    const sourceRowIndex: number[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (header is row 1)

      const name = sanitizeName(readCell(row, 'name'));
      if (!name) {
        errors.push(`Row ${rowNum}: Missing port name.`);
        continue;
      }

      const lat = parseFloat(String(readCell(row, 'lat')));
      const lng = parseFloat(String(readCell(row, 'lng')));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        errors.push(`Row ${rowNum} (${name}): Invalid lat/lng values.`);
        continue;
      }

      if (lat < -90 || lat > 90) {
        errors.push(`Row ${rowNum} (${name}): Latitude ${lat} out of range [-90, 90].`);
        continue;
      }
      if (lng < -180 || lng > 180) {
        errors.push(`Row ${rowNum} (${name}): Longitude ${lng} out of range [-180, 180].`);
        continue;
      }

      const rawTier = readCell(row, 'gridTier');
      const gridTier = parseGridTier(rawTier as string) || 'weak';
      if (!rawTier) {
        warnings.push(`Row ${rowNum} (${name}): No gridTier specified, defaulting to "weak".`);
      } else if (!parseGridTier(rawTier as string)) {
        warnings.push(`Row ${rowNum} (${name}): Invalid gridTier "${sanitizeName(rawTier)}", defaulting to "weak".`);
      }

      const rawStay = readCell(row, 'portStayMinutes');
      const parsedStay = rawStay === '' || rawStay === undefined ? 0 : parseInt(String(rawStay), 10);
      let portStayMinutes = parsedStay;
      if (!Number.isFinite(parsedStay) || parsedStay < 0) {
        warnings.push(`Row ${rowNum} (${name}): Invalid portStayMinutes, defaulting to 0.`);
        portStayMinutes = 0;
      }

      // `id` is the position in the accepted-port list, not the sheet row.
      // The engine indexes ports and legs by id, so a rejected row must not
      // leave a hole in the numbering.
      const id = ports.length;
      sourceRowIndex.push(i);
      ports.push({
        id,
        name,
        lat,
        lng,
        gridTier,
        // The origin is where the voyage starts; it has no scheduled call.
        portStayMinutes: id === 0 ? 0 : Math.min(24 * 60, Math.max(0, portStayMinutes)),
      });
    }

    if (ports.length < 2) {
      errors.push('Need at least 2 valid ports to define a route.');
      return { success: false, ports: [], legs: [], routeName: fileName, errors, warnings };
    }

    // Generate legs from the port sequence
    for (let i = 0; i < ports.length - 1; i++) {
      const from = ports[i];
      const to = ports[i + 1];

      let distance: number;
      const rowDistance = readCell(rows[sourceRowIndex[i]], 'distanceToNextKm');
      const parsedDistance = parseFloat(String(rowDistance));
      if (rowDistance !== undefined && rowDistance !== '' && Number.isFinite(parsedDistance) && parsedDistance > 0) {
        distance = parsedDistance;
      } else {
        distance = haversineKm(from.lat, from.lng, to.lat, to.lng);
        // Multiply by ~1.3 for coastal route approximation (straight-line → sea route)
        distance = Math.round(distance * 1.3);
        warnings.push(
          `Leg ${i} (${from.name} → ${to.name}): No distance provided, estimated ${distance} km via Haversine × 1.3.`
        );
      }

      // Baseline schedule assumes the reference service speed throughout.
      const baselineSailHours =
        Math.round((distance / (REF_SPEED_KNOTS * KM_PER_NAUTICAL_MILE)) * 100) / 100;

      legs.push({
        index: i,
        fromPortId: from.id,
        toPortId: to.id,
        distanceKm: distance,
        baselineSailHours,
      });
    }

    // Extract route name from filename
    const routeName =
      sanitizeName(fileName.replace(/\.(xlsx|xls|csv)$/i, '').replace(/[_-]/g, ' ')) || 'Custom Route';

    return {
      success: errors.length === 0,
      ports,
      legs,
      routeName,
      errors,
      warnings,
    };
  } catch (err) {
    errors.push(`Failed to parse Excel file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return { success: false, ports: [], legs: [], routeName: fileName, errors, warnings };
  }
}

/**
 * Generate legs from an ordered list of ports.
 * Uses Haversine distance × 1.3 for sea route estimation.
 */
export function generateLegsFromPorts(ports: Port[]): Leg[] {
  const legs: Leg[] = [];
  for (let i = 0; i < ports.length - 1; i++) {
    const from = ports[i];
    const to = ports[i + 1];
    const distance = Math.round(haversineKm(from.lat, from.lng, to.lat, to.lng) * 1.3);
    const baselineSailHours =
      Math.round((distance / (REF_SPEED_KNOTS * KM_PER_NAUTICAL_MILE)) * 100) / 100;
    legs.push({
      index: i,
      fromPortId: from.id,
      toPortId: to.id,
      distanceKm: distance,
      baselineSailHours,
    });
  }
  return legs;
}
