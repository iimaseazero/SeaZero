// Sea Zero — Excel port parser
// Client-side Excel file parsing for custom route import

import * as XLSX from 'xlsx';
import { Port, GridTier } from '@/data/ports';
import { Leg } from '@/data/legs';

export interface ParseResult {
  success: boolean;
  ports: Port[];
  legs: Leg[];
  routeName: string;
  errors: string[];
  warnings: string[];
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length < 2) {
      errors.push('Excel file must have at least 2 ports (rows) to define a route.');
      return { success: false, ports: [], legs: [], routeName: fileName, errors, warnings };
    }

    if (rows.length > 100) {
      warnings.push(`Large route detected: ${rows.length} ports. Performance may be affected.`);
    }

    // Validate required columns
    const firstRow = rows[0];
    const hasName = 'name' in firstRow;
    const hasLat = 'lat' in firstRow;
    const hasLng = 'lng' in firstRow;

    if (!hasName || !hasLat || !hasLng) {
      const missing = [];
      if (!hasName) missing.push('"name"');
      if (!hasLat) missing.push('"lat"');
      if (!hasLng) missing.push('"lng"');
      errors.push(`Missing required columns: ${missing.join(', ')}. Expected: name, lat, lng.`);
      return { success: false, ports: [], legs: [], routeName: fileName, errors, warnings };
    }

    // Parse each row into a Port
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (header is row 1)

      const name = String(row.name || '').trim();
      if (!name) {
        errors.push(`Row ${rowNum}: Missing port name.`);
        continue;
      }

      const lat = parseFloat(row.lat);
      const lng = parseFloat(row.lng);
      if (isNaN(lat) || isNaN(lng)) {
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

      const gridTier = parseGridTier(row.gridTier) || 'weak';
      if (!row.gridTier) {
        warnings.push(`Row ${rowNum} (${name}): No gridTier specified, defaulting to "weak".`);
      } else if (!parseGridTier(row.gridTier)) {
        warnings.push(`Row ${rowNum} (${name}): Invalid gridTier "${row.gridTier}", defaulting to "weak".`);
      }

      const portStayMinutes = row.portStayMinutes !== '' ? parseInt(String(row.portStayMinutes), 10) : 0;
      if (isNaN(portStayMinutes) || portStayMinutes < 0) {
        warnings.push(`Row ${rowNum} (${name}): Invalid portStayMinutes, defaulting to 0.`);
      }

      ports.push({
        id: i,
        name,
        lat,
        lng,
        gridTier,
        portStayMinutes: i === 0 ? 0 : Math.max(0, portStayMinutes || 0), // First port always 0 dwell
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

      // Use provided distance or compute Haversine
      let distance: number;
      const rowDistance = rows[i]?.distanceToNextKm;
      if (rowDistance !== undefined && rowDistance !== '' && !isNaN(parseFloat(String(rowDistance)))) {
        distance = parseFloat(String(rowDistance));
      } else {
        distance = haversineKm(from.lat, from.lng, to.lat, to.lng);
        // Multiply by ~1.3 for coastal route approximation (straight-line → sea route)
        distance = Math.round(distance * 1.3);
        warnings.push(
          `Leg ${i} (${from.name} → ${to.name}): No distance provided, estimated ${distance} km via Haversine × 1.3.`
        );
      }

      // Estimate baseline sail hours at 13.2 knots (24.4 km/h)
      const baselineSailHours = Math.round((distance / (13.2 * 1.852)) * 100) / 100;

      legs.push({
        index: i,
        fromPortId: i,
        toPortId: i + 1,
        distanceKm: distance,
        baselineSailHours,
      });
    }

    // Extract route name from filename
    const routeName = fileName.replace(/\.(xlsx|xls|csv)$/i, '').replace(/[_-]/g, ' ');

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
    const baselineSailHours = Math.round((distance / (13.2 * 1.852)) * 100) / 100;
    legs.push({
      index: i,
      fromPortId: i,
      toPortId: i + 1,
      distanceKm: distance,
      baselineSailHours,
    });
  }
  return legs;
}
