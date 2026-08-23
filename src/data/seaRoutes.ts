// Sea Zero — Pre-built famous sea routes
//
// Each route defines a realistic port sequence with coordinates, grid tiers,
// dwell times, and inter-port distances. These allow users to explore the
// simulation across different geographies and operating contexts without
// needing to upload a custom Excel file.

import { Port, GridTier } from '@/data/ports';
import { Leg } from '@/data/legs';

export type RouteCategory = 'long-haul' | 'dense-short';

export interface SeaRoute {
  id: string;
  name: string;
  description: string;
  region: string;
  emoji: string;          // visual cue in the selector
  category: RouteCategory; // 'long-haul' = ocean crossings, 'dense-short' = EV-feasible hops
  totalDistanceKm: number; // pre-computed for display
  ports: Port[];
  legs: Leg[];
}

// ─── Helper to build legs from a port list with explicit distances ───

function buildLegs(
  ports: Port[],
  distances: number[],
  sailHours: number[],
): Leg[] {
  return distances.map((distanceKm, i) => ({
    index: i,
    fromPortId: ports[i].id,
    toPortId: ports[i + 1].id,
    distanceKm,
    baselineSailHours: sailHours[i],
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Mediterranean Cruise — Barcelona → Athens (Western Med → Eastern Med)
// ═══════════════════════════════════════════════════════════════════════════

const medPorts: Port[] = [
  { id: 0,  name: 'Barcelona',       lat: 41.375, lng:  2.177, gridTier: 'strong', portStayMinutes: 0   },
  { id: 1,  name: 'Marseille',       lat: 43.296, lng:  5.370, gridTier: 'strong', portStayMinutes: 180 },
  { id: 2,  name: 'Genoa',           lat: 44.407, lng:  8.934, gridTier: 'strong', portStayMinutes: 150 },
  { id: 3,  name: 'Civitavecchia',   lat: 42.093, lng: 11.787, gridTier: 'medium', portStayMinutes: 240 },
  { id: 4,  name: 'Naples',          lat: 40.843, lng: 14.252, gridTier: 'strong', portStayMinutes: 210 },
  { id: 5,  name: 'Messina',         lat: 38.191, lng: 15.555, gridTier: 'weak',   portStayMinutes: 90  },
  { id: 6,  name: 'Corfu',           lat: 39.625, lng: 19.920, gridTier: 'weak',   portStayMinutes: 120 },
  { id: 7,  name: 'Katakolon',       lat: 37.643, lng: 21.319, gridTier: 'weak',   portStayMinutes: 90  },
  { id: 8,  name: 'Piraeus (Athens)', lat: 37.943, lng: 23.647, gridTier: 'strong', portStayMinutes: 240 },
];

const medDistances  = [370, 350, 475, 260, 310, 500, 310, 305];
const medSailHours  = [15.1, 14.3, 19.4, 10.6, 12.7, 20.5, 12.7, 12.5];

const medLegs = buildLegs(medPorts, medDistances, medSailHours);

// ═══════════════════════════════════════════════════════════════════════════
// 2. Baltic Cruise — Copenhagen → St Petersburg
// ═══════════════════════════════════════════════════════════════════════════

const balticPorts: Port[] = [
  { id: 0,  name: 'Copenhagen',      lat: 55.676, lng: 12.568, gridTier: 'strong', portStayMinutes: 0   },
  { id: 1,  name: 'Warnemünde',      lat: 54.170, lng: 12.091, gridTier: 'medium', portStayMinutes: 120 },
  { id: 2,  name: 'Gdańsk',          lat: 54.352, lng: 18.647, gridTier: 'medium', portStayMinutes: 150 },
  { id: 3,  name: 'Klaipeda',        lat: 55.703, lng: 21.125, gridTier: 'weak',   portStayMinutes: 90  },
  { id: 4,  name: 'Riga',            lat: 56.946, lng: 24.106, gridTier: 'medium', portStayMinutes: 150 },
  { id: 5,  name: 'Tallinn',         lat: 59.437, lng: 24.753, gridTier: 'medium', portStayMinutes: 180 },
  { id: 6,  name: 'Helsinki',        lat: 60.167, lng: 24.952, gridTier: 'strong', portStayMinutes: 210 },
  { id: 7,  name: 'St Petersburg',   lat: 59.934, lng: 30.316, gridTier: 'medium', portStayMinutes: 360 },
];

const balticDistances  = [175, 540, 260, 320, 380, 85, 320];
const balticSailHours  = [7.2, 22.1, 10.6, 13.1, 15.5, 3.5, 13.1];

const balticLegs = buildLegs(balticPorts, balticDistances, balticSailHours);

// ═══════════════════════════════════════════════════════════════════════════
// 3. Southeast Asian — Singapore → Hong Kong (South China Sea route)
// ═══════════════════════════════════════════════════════════════════════════

const seaPorts: Port[] = [
  { id: 0,  name: 'Singapore',       lat:  1.264, lng: 103.840, gridTier: 'strong', portStayMinutes: 0   },
  { id: 1,  name: 'Kuala Lumpur (Port Klang)', lat: 3.000, lng: 101.400, gridTier: 'medium', portStayMinutes: 150 },
  { id: 2,  name: 'Penang',          lat:  5.414, lng: 100.340, gridTier: 'weak',   portStayMinutes: 120 },
  { id: 3,  name: 'Phuket',          lat:  7.880, lng:  98.390, gridTier: 'weak',   portStayMinutes: 180 },
  { id: 4,  name: 'Ko Samui',        lat:  9.512, lng: 100.061, gridTier: 'weak',   portStayMinutes: 120 },
  { id: 5,  name: 'Bangkok (Laem Chabang)', lat: 13.082, lng: 100.884, gridTier: 'medium', portStayMinutes: 240 },
  { id: 6,  name: 'Ho Chi Minh City', lat: 10.770, lng: 106.700, gridTier: 'medium', portStayMinutes: 210 },
  { id: 7,  name: 'Da Nang',         lat: 16.068, lng: 108.221, gridTier: 'weak',   portStayMinutes: 120 },
  { id: 8,  name: 'Ha Long Bay',     lat: 20.954, lng: 107.080, gridTier: 'weak',   portStayMinutes: 90  },
  { id: 9,  name: 'Hong Kong',       lat: 22.286, lng: 114.149, gridTier: 'strong', portStayMinutes: 300 },
];

const seaDistances  = [370, 310, 370, 270, 520, 850, 680, 610, 780];
const seaSailHours  = [15.1, 12.7, 15.1, 11.0, 21.3, 34.8, 27.8, 24.9, 31.9];

const seaLegs = buildLegs(seaPorts, seaDistances, seaSailHours);

// ═══════════════════════════════════════════════════════════════════════════
// 4. Caribbean Loop — Miami → Miami (Eastern Caribbean loop)
// ═══════════════════════════════════════════════════════════════════════════

const caribPorts: Port[] = [
  { id: 0,  name: 'Miami',           lat: 25.775, lng: -80.190, gridTier: 'strong', portStayMinutes: 0   },
  { id: 1,  name: 'Nassau',          lat: 25.059, lng: -77.345, gridTier: 'medium', portStayMinutes: 240 },
  { id: 2,  name: 'San Juan',        lat: 18.466, lng: -66.116, gridTier: 'strong', portStayMinutes: 210 },
  { id: 3,  name: 'Charlotte Amalie', lat: 18.342, lng: -64.930, gridTier: 'weak',   portStayMinutes: 180 },
  { id: 4,  name: 'Philipsburg',     lat: 18.026, lng: -63.047, gridTier: 'weak',   portStayMinutes: 150 },
  { id: 5,  name: 'St. John\'s (Antigua)', lat: 17.117, lng: -61.845, gridTier: 'weak', portStayMinutes: 120 },
  { id: 6,  name: 'Bridgetown',      lat: 13.097, lng: -59.612, gridTier: 'medium', portStayMinutes: 180 },
  { id: 7,  name: 'Castries',        lat: 14.010, lng: -60.990, gridTier: 'weak',   portStayMinutes: 120 },
  { id: 8,  name: 'Oranjestad',      lat: 12.509, lng: -70.037, gridTier: 'weak',   portStayMinutes: 150 },
  { id: 9,  name: 'Miami',           lat: 25.775, lng: -80.190, gridTier: 'strong', portStayMinutes: 240 },
];

const caribDistances  = [300, 1530, 130, 200, 155, 500, 180, 1040, 1750];
const caribSailHours  = [12.3, 62.6, 5.3, 8.2, 6.3, 20.5, 7.4, 42.6, 71.6];

const caribLegs = buildLegs(caribPorts, caribDistances, caribSailHours);

// ═══════════════════════════════════════════════════════════════════════════
// 5. East Asian — Shanghai → Tokyo (East China Sea / Yellow Sea route)
// ═══════════════════════════════════════════════════════════════════════════

const eastAsiaPorts: Port[] = [
  { id: 0,  name: 'Shanghai',        lat: 31.230, lng: 121.474, gridTier: 'strong', portStayMinutes: 0   },
  { id: 1,  name: 'Jeju',            lat: 33.499, lng: 126.531, gridTier: 'weak',   portStayMinutes: 120 },
  { id: 2,  name: 'Busan',           lat: 35.179, lng: 129.076, gridTier: 'strong', portStayMinutes: 210 },
  { id: 3,  name: 'Shimonoseki',     lat: 33.950, lng: 130.940, gridTier: 'medium', portStayMinutes: 90  },
  { id: 4,  name: 'Hiroshima',       lat: 34.385, lng: 132.455, gridTier: 'strong', portStayMinutes: 150 },
  { id: 5,  name: 'Kobe',            lat: 34.690, lng: 135.196, gridTier: 'strong', portStayMinutes: 210 },
  { id: 6,  name: 'Nagoya',          lat: 34.974, lng: 136.906, gridTier: 'strong', portStayMinutes: 150 },
  { id: 7,  name: 'Shimizu',         lat: 35.016, lng: 138.490, gridTier: 'medium', portStayMinutes: 90  },
  { id: 8,  name: 'Yokohama (Tokyo)', lat: 35.444, lng: 139.638, gridTier: 'strong', portStayMinutes: 300 },
];

const eastAsiaDistances  = [540, 350, 230, 210, 290, 185, 175, 170];
const eastAsiaSailHours  = [22.1, 14.3, 9.4, 8.6, 11.9, 7.6, 7.2, 6.9];

const eastAsiaLegs = buildLegs(eastAsiaPorts, eastAsiaDistances, eastAsiaSailHours);

// ═══════════════════════════════════════════════════════════════════════════
// DENSE SHORT ROUTES — EV-feasible, many ports at short distances
// ═══════════════════════════════════════════════════════════════════════════

// ─── 6. Seto Inland Sea (Japan) — Osaka → Hiroshima ───
// Japan's busiest domestic ferry corridor, dense port network

const setoPorts: Port[] = [
  { id: 0,  name: 'Osaka',           lat: 34.655, lng: 135.432, gridTier: 'strong', portStayMinutes: 0   },
  { id: 1,  name: 'Kobe',            lat: 34.690, lng: 135.196, gridTier: 'strong', portStayMinutes: 45  },
  { id: 2,  name: 'Akashi',          lat: 34.643, lng: 134.986, gridTier: 'medium', portStayMinutes: 20  },
  { id: 3,  name: 'Takamatsu',       lat: 34.350, lng: 134.046, gridTier: 'strong', portStayMinutes: 60  },
  { id: 4,  name: 'Sakaide',         lat: 34.315, lng: 133.859, gridTier: 'medium', portStayMinutes: 25  },
  { id: 5,  name: 'Marugame',        lat: 34.285, lng: 133.798, gridTier: 'weak',   portStayMinutes: 20  },
  { id: 6,  name: 'Tadotsu',         lat: 34.274, lng: 133.749, gridTier: 'weak',   portStayMinutes: 15  },
  { id: 7,  name: 'Niihama',         lat: 33.960, lng: 133.283, gridTier: 'medium', portStayMinutes: 30  },
  { id: 8,  name: 'Imabari',         lat: 34.066, lng: 132.998, gridTier: 'medium', portStayMinutes: 35  },
  { id: 9,  name: 'Onomichi',        lat: 34.409, lng: 133.205, gridTier: 'medium', portStayMinutes: 30  },
  { id: 10, name: 'Mihara',          lat: 34.398, lng: 133.079, gridTier: 'weak',   portStayMinutes: 20  },
  { id: 11, name: 'Takehara',        lat: 34.342, lng: 132.907, gridTier: 'weak',   portStayMinutes: 20  },
  { id: 12, name: 'Kure',            lat: 34.232, lng: 132.565, gridTier: 'strong', portStayMinutes: 40  },
  { id: 13, name: 'Hiroshima',       lat: 34.385, lng: 132.455, gridTier: 'strong', portStayMinutes: 90  },
];

const setoDistances  = [28, 22, 85, 22, 8, 7, 55, 35, 40, 15, 20, 40, 22];
const setoSailHours  = [1.15, 0.90, 3.48, 0.90, 0.33, 0.29, 2.25, 1.43, 1.64, 0.61, 0.82, 1.64, 0.90];

const setoLegs = buildLegs(setoPorts, setoDistances, setoSailHours);

// ─── 7. Greek Cyclades — Piraeus → Santorini island-hopping ───

const cycladesPorts: Port[] = [
  { id: 0,  name: 'Piraeus (Athens)', lat: 37.943, lng: 23.647, gridTier: 'strong', portStayMinutes: 0   },
  { id: 1,  name: 'Kythnos',         lat: 37.378, lng: 24.436, gridTier: 'weak',   portStayMinutes: 30  },
  { id: 2,  name: 'Serifos',         lat: 37.153, lng: 24.485, gridTier: 'weak',   portStayMinutes: 25  },
  { id: 3,  name: 'Sifnos',          lat: 36.962, lng: 24.713, gridTier: 'weak',   portStayMinutes: 30  },
  { id: 4,  name: 'Milos',           lat: 36.745, lng: 24.425, gridTier: 'weak',   portStayMinutes: 40  },
  { id: 5,  name: 'Folegandros',     lat: 36.625, lng: 24.913, gridTier: 'weak',   portStayMinutes: 25  },
  { id: 6,  name: 'Sikinos',         lat: 36.682, lng: 25.097, gridTier: 'weak',   portStayMinutes: 20  },
  { id: 7,  name: 'Ios',             lat: 36.723, lng: 25.281, gridTier: 'weak',   portStayMinutes: 35  },
  { id: 8,  name: 'Santorini',       lat: 36.393, lng: 25.461, gridTier: 'medium', portStayMinutes: 60  },
  { id: 9,  name: 'Anafi',           lat: 36.356, lng: 25.775, gridTier: 'weak',   portStayMinutes: 25  },
  { id: 10, name: 'Amorgos',         lat: 36.833, lng: 25.890, gridTier: 'weak',   portStayMinutes: 30  },
  { id: 11, name: 'Naxos',           lat: 37.104, lng: 25.374, gridTier: 'medium', portStayMinutes: 45  },
  { id: 12, name: 'Paros',           lat: 37.086, lng: 25.150, gridTier: 'medium', portStayMinutes: 40  },
  { id: 13, name: 'Syros',           lat: 37.443, lng: 24.942, gridTier: 'strong', portStayMinutes: 50  },
  { id: 14, name: 'Mykonos',         lat: 37.446, lng: 25.328, gridTier: 'medium', portStayMinutes: 60  },
];

const cycladesDistances  = [75, 28, 30, 35, 55, 22, 22, 42, 32, 55, 60, 22, 42, 40];
const cycladesSailHours  = [3.07, 1.15, 1.23, 1.43, 2.25, 0.90, 0.90, 1.72, 1.31, 2.25, 2.45, 0.90, 1.72, 1.64];

const cycladesLegs = buildLegs(cycladesPorts, cycladesDistances, cycladesSailHours);

// ─── 8. Puget Sound (USA) — Seattle → Victoria via San Juan Islands ───

const pugetPorts: Port[] = [
  { id: 0,  name: 'Seattle',         lat: 47.606, lng: -122.332, gridTier: 'strong', portStayMinutes: 0   },
  { id: 1,  name: 'Bainbridge Island', lat: 47.624, lng: -122.520, gridTier: 'medium', portStayMinutes: 30  },
  { id: 2,  name: 'Kingston',        lat: 47.799, lng: -122.495, gridTier: 'medium', portStayMinutes: 25  },
  { id: 3,  name: 'Port Townsend',   lat: 48.117, lng: -122.760, gridTier: 'medium', portStayMinutes: 40  },
  { id: 4,  name: 'Coupeville',      lat: 48.221, lng: -122.684, gridTier: 'weak',   portStayMinutes: 20  },
  { id: 5,  name: 'Anacortes',       lat: 48.512, lng: -122.613, gridTier: 'strong', portStayMinutes: 45  },
  { id: 6,  name: 'Lopez Island',    lat: 48.487, lng: -122.884, gridTier: 'weak',   portStayMinutes: 20  },
  { id: 7,  name: 'Shaw Island',     lat: 48.561, lng: -122.926, gridTier: 'weak',   portStayMinutes: 15  },
  { id: 8,  name: 'Orcas Island',    lat: 48.597, lng: -122.903, gridTier: 'weak',   portStayMinutes: 30  },
  { id: 9,  name: 'San Juan Island', lat: 48.533, lng: -123.009, gridTier: 'medium', portStayMinutes: 40  },
  { id: 10, name: 'Sidney',          lat: 48.650, lng: -123.400, gridTier: 'medium', portStayMinutes: 25  },
  { id: 11, name: 'Victoria',        lat: 48.424, lng: -123.369, gridTier: 'strong', portStayMinutes: 90  },
];

const pugetDistances  = [14, 22, 42, 15, 35, 24, 10, 6, 12, 38, 28];
const pugetSailHours  = [0.57, 0.90, 1.72, 0.61, 1.43, 0.98, 0.41, 0.25, 0.49, 1.56, 1.15];

const pugetLegs = buildLegs(pugetPorts, pugetDistances, pugetSailHours);

// ─── 9. Danish Straits — Copenhagen loop through the Danish islands ───

const danishPorts: Port[] = [
  { id: 0,  name: 'Copenhagen',      lat: 55.676, lng: 12.568, gridTier: 'strong', portStayMinutes: 0   },
  { id: 1,  name: 'Malmö',           lat: 55.613, lng: 12.998, gridTier: 'strong', portStayMinutes: 45  },
  { id: 2,  name: 'Helsingborg',     lat: 56.047, lng: 12.694, gridTier: 'strong', portStayMinutes: 30  },
  { id: 3,  name: 'Helsingør',       lat: 56.036, lng: 12.614, gridTier: 'strong', portStayMinutes: 35  },
  { id: 4,  name: 'Roskilde',        lat: 55.642, lng: 12.080, gridTier: 'medium', portStayMinutes: 40  },
  { id: 5,  name: 'Kalundborg',      lat: 55.682, lng: 11.090, gridTier: 'medium', portStayMinutes: 30  },
  { id: 6,  name: 'Samsø',           lat: 55.857, lng: 10.610, gridTier: 'weak',   portStayMinutes: 25  },
  { id: 7,  name: 'Aarhus',          lat: 56.152, lng: 10.215, gridTier: 'strong', portStayMinutes: 60  },
  { id: 8,  name: 'Odden',           lat: 55.968, lng: 11.350, gridTier: 'weak',   portStayMinutes: 20  },
  { id: 9,  name: 'Ebeltoft',        lat: 56.194, lng: 10.683, gridTier: 'weak',   portStayMinutes: 25  },
  { id: 10, name: 'Sjællands Odde',  lat: 55.970, lng: 11.370, gridTier: 'weak',   portStayMinutes: 20  },
  { id: 11, name: 'Odense',          lat: 55.400, lng: 10.388, gridTier: 'strong', portStayMinutes: 50  },
  { id: 12, name: 'Nyborg',          lat: 55.313, lng: 10.790, gridTier: 'medium', portStayMinutes: 25  },
  { id: 13, name: 'Korsør',          lat: 55.331, lng: 11.139, gridTier: 'medium', portStayMinutes: 25  },
  { id: 14, name: 'Copenhagen',      lat: 55.676, lng: 12.568, gridTier: 'strong', portStayMinutes: 60  },
];

const danishDistances  = [35, 52, 7, 55, 72, 40, 50, 85, 42, 50, 80, 35, 28, 110];
const danishSailHours  = [1.43, 2.13, 0.29, 2.25, 2.95, 1.64, 2.05, 3.48, 1.72, 2.05, 3.27, 1.43, 1.15, 4.50];

const danishLegs = buildLegs(danishPorts, danishDistances, danishSailHours);

// ─── 10. Canary Islands — Tenerife loop ───

const canaryPorts: Port[] = [
  { id: 0,  name: 'Santa Cruz de Tenerife', lat: 28.469, lng: -16.248, gridTier: 'strong', portStayMinutes: 0   },
  { id: 1,  name: 'San Sebastián (La Gomera)', lat: 28.092, lng: -17.111, gridTier: 'weak',   portStayMinutes: 40  },
  { id: 2,  name: 'Santa Cruz de La Palma', lat: 28.684, lng: -17.764, gridTier: 'medium', portStayMinutes: 50  },
  { id: 3,  name: 'Valverde (El Hierro)', lat: 27.810, lng: -17.915, gridTier: 'weak',   portStayMinutes: 35  },
  { id: 4,  name: 'San Sebastián (La Gomera)', lat: 28.092, lng: -17.111, gridTier: 'weak',   portStayMinutes: 30  },
  { id: 5,  name: 'Los Cristianos (Tenerife)', lat: 28.052, lng: -16.716, gridTier: 'strong', portStayMinutes: 45  },
  { id: 6,  name: 'Puerto de las Nieves (Gran Canaria)', lat: 28.100, lng: -15.710, gridTier: 'medium', portStayMinutes: 35  },
  { id: 7,  name: 'Las Palmas',      lat: 28.100, lng: -15.413, gridTier: 'strong', portStayMinutes: 60  },
  { id: 8,  name: 'Puerto del Rosario (Fuerteventura)', lat: 28.500, lng: -13.862, gridTier: 'medium', portStayMinutes: 45  },
  { id: 9,  name: 'Arrecife (Lanzarote)', lat: 28.963, lng: -13.545, gridTier: 'medium', portStayMinutes: 50  },
  { id: 10, name: 'Las Palmas',      lat: 28.100, lng: -15.413, gridTier: 'strong', portStayMinutes: 40  },
  { id: 11, name: 'Santa Cruz de Tenerife', lat: 28.469, lng: -16.248, gridTier: 'strong', portStayMinutes: 60  },
];

const canaryDistances  = [65, 85, 110, 100, 48, 55, 30, 175, 60, 200, 82];
const canarySailHours  = [2.66, 3.48, 4.50, 4.09, 1.96, 2.25, 1.23, 7.16, 2.45, 8.19, 3.36];

const canaryLegs = buildLegs(canaryPorts, canaryDistances, canarySailHours);

// ═══════════════════════════════════════════════════════════════════════════
// Route catalogue
// ═══════════════════════════════════════════════════════════════════════════

export const SEA_ROUTES: SeaRoute[] = [
  // ─── Long-haul ocean routes ───
  {
    id: 'mediterranean',
    name: 'Mediterranean Crossing',
    description: 'Barcelona → Athens via the Western and Eastern Mediterranean, calling at Italian and Greek ports',
    region: 'Mediterranean',
    emoji: '🏛️',
    category: 'long-haul',
    totalDistanceKm: medDistances.reduce((a, b) => a + b, 0),
    ports: medPorts,
    legs: medLegs,
  },
  {
    id: 'baltic',
    name: 'Baltic Explorer',
    description: 'Copenhagen → St Petersburg through the Baltic Sea, calling at Hanseatic and Nordic capitals',
    region: 'Baltic Sea',
    emoji: '⚓',
    category: 'long-haul',
    totalDistanceKm: balticDistances.reduce((a, b) => a + b, 0),
    ports: balticPorts,
    legs: balticLegs,
  },
  {
    id: 'southeast-asia',
    name: 'South China Sea Passage',
    description: 'Singapore → Hong Kong through Southeast Asia, stopping at ports across Malaysia, Thailand, and Vietnam',
    region: 'Southeast Asia',
    emoji: '🌏',
    category: 'long-haul',
    totalDistanceKm: seaDistances.reduce((a, b) => a + b, 0),
    ports: seaPorts,
    legs: seaLegs,
  },
  {
    id: 'caribbean',
    name: 'Eastern Caribbean Loop',
    description: 'Miami → Miami roundtrip through the Eastern Caribbean, visiting the Bahamas, Puerto Rico, the Lesser Antilles, and Aruba',
    region: 'Caribbean',
    emoji: '🏝️',
    category: 'long-haul',
    totalDistanceKm: caribDistances.reduce((a, b) => a + b, 0),
    ports: caribPorts,
    legs: caribLegs,
  },
  {
    id: 'east-asia',
    name: 'East Asian Coastal',
    description: 'Shanghai → Tokyo along the East China Sea and Japan\'s Inland Sea, connecting China, Korea, and Japan\'s major ports',
    region: 'East Asia',
    emoji: '🗾',
    category: 'long-haul',
    totalDistanceKm: eastAsiaDistances.reduce((a, b) => a + b, 0),
    ports: eastAsiaPorts,
    legs: eastAsiaLegs,
  },
  // ─── Dense short-hop routes (EV-feasible) ───
  {
    id: 'seto-inland-sea',
    name: 'Seto Inland Sea',
    description: 'Osaka → Hiroshima through the Japanese Inland Sea. 14 ports averaging 30 km apart',
    region: 'Japan',
    emoji: '🛳️',
    category: 'dense-short',
    totalDistanceKm: setoDistances.reduce((a, b) => a + b, 0),
    ports: setoPorts,
    legs: setoLegs,
  },
  {
    id: 'greek-cyclades',
    name: 'Greek Cyclades',
    description: 'Piraeus → Mykonos through 15 Cycladic islands. Short legs, a charging stop at every port',
    region: 'Greece',
    emoji: '🏛️',
    category: 'dense-short',
    totalDistanceKm: cycladesDistances.reduce((a, b) => a + b, 0),
    ports: cycladesPorts,
    legs: cycladesLegs,
  },
  {
    id: 'puget-sound',
    name: 'Puget Sound & San Juan Islands',
    description: 'Seattle → Victoria through the Washington island ferry network. 12 ports, legs as short as 6 km, strong grid throughout',
    region: 'Pacific NW',
    emoji: '🌲',
    category: 'dense-short',
    totalDistanceKm: pugetDistances.reduce((a, b) => a + b, 0),
    ports: pugetPorts,
    legs: pugetLegs,
  },
  {
    id: 'danish-straits',
    name: 'Danish Straits Loop',
    description: 'Copenhagen roundtrip through the Danish islands and Jutland. 15 ports, strong Scandinavian grid',
    region: 'Denmark',
    emoji: '🇩🇰',
    category: 'dense-short',
    totalDistanceKm: danishDistances.reduce((a, b) => a + b, 0),
    ports: danishPorts,
    legs: danishLegs,
  },
  {
    id: 'canary-islands',
    name: 'Canary Islands Loop',
    description: 'Tenerife roundtrip across all 7 Canary Islands. 12 ports, strong grid at the main ones',
    region: 'Canaries',
    emoji: '🌋',
    category: 'dense-short',
    totalDistanceKm: canaryDistances.reduce((a, b) => a + b, 0),
    ports: canaryPorts,
    legs: canaryLegs,
  },
];
