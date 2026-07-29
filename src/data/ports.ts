// Sea Zero — 34 Hurtigruten ports, Bergen → Kirkenes
// Coordinates hardcoded from verified Norwegian coastal data

import { GRID_HEADROOM_MW } from '@/engine/constants';

export type GridTier = 'strong' | 'medium' | 'weak';

export interface Port {
  id: number;
  name: string;
  lat: number;
  lng: number;
  gridTier: GridTier;
  portStayMinutes: number; // dwell window at this port (0 for Bergen = origin)
}

/**
 * Grid headroom by tier (MW). Re-exported from the engine constants so the
 * numbers live in exactly one place.
 *
 * [ASSUMPTION] The case does not tabulate per-port grid capacity — it says only
 * that grid access is better in the south and that northern ports would need
 * additional infrastructure investment.
 */
export const GRID_HEADROOM: Record<GridTier, number> = { ...GRID_HEADROOM_MW };

export const PORTS: Port[] = [
  { id: 0,  name: 'Bergen',        lat: 60.391, lng:  5.322, gridTier: 'strong', portStayMinutes: 0   },
  { id: 1,  name: 'Florø',         lat: 61.599, lng:  5.032, gridTier: 'weak',   portStayMinutes: 15  },
  { id: 2,  name: 'Måløy',         lat: 61.936, lng:  5.113, gridTier: 'weak',   portStayMinutes: 15  },
  { id: 3,  name: 'Torvik',        lat: 62.290, lng:  5.870, gridTier: 'weak',   portStayMinutes: 10  },
  { id: 4,  name: 'Ålesund',       lat: 62.472, lng:  6.155, gridTier: 'medium', portStayMinutes: 180 },
  { id: 5,  name: 'Molde',         lat: 62.738, lng:  7.158, gridTier: 'weak',   portStayMinutes: 30  },
  { id: 6,  name: 'Kristiansund',  lat: 63.110, lng:  7.728, gridTier: 'medium', portStayMinutes: 15  },
  { id: 7,  name: 'Trondheim',     lat: 63.430, lng: 10.395, gridTier: 'strong', portStayMinutes: 180 },
  { id: 8,  name: 'Rørvik',        lat: 64.862, lng: 11.236, gridTier: 'weak',   portStayMinutes: 20  },
  { id: 9,  name: 'Brønnøysund',   lat: 65.474, lng: 12.212, gridTier: 'weak',   portStayMinutes: 10  },
  { id: 10, name: 'Sandnessjøen',  lat: 66.022, lng: 12.633, gridTier: 'medium', portStayMinutes: 15  },
  { id: 11, name: 'Nesna',         lat: 66.198, lng: 13.020, gridTier: 'weak',   portStayMinutes: 10  },
  { id: 12, name: 'Ørnes',         lat: 66.868, lng: 13.706, gridTier: 'weak',   portStayMinutes: 10  },
  { id: 13, name: 'Bodø',          lat: 67.280, lng: 14.405, gridTier: 'strong', portStayMinutes: 135 },
  { id: 14, name: 'Stamsund',      lat: 68.126, lng: 13.847, gridTier: 'weak',   portStayMinutes: 25  },
  { id: 15, name: 'Svolvær',       lat: 68.234, lng: 14.567, gridTier: 'medium', portStayMinutes: 55  },
  { id: 16, name: 'Stokmarknes',   lat: 68.564, lng: 14.911, gridTier: 'weak',   portStayMinutes: 10  },
  { id: 17, name: 'Sortland',      lat: 68.696, lng: 15.413, gridTier: 'weak',   portStayMinutes: 15  },
  { id: 18, name: 'Risøyhamn',     lat: 69.000, lng: 15.654, gridTier: 'weak',   portStayMinutes: 15  },
  { id: 19, name: 'Harstad',       lat: 68.799, lng: 16.541, gridTier: 'medium', portStayMinutes: 35  },
  { id: 20, name: 'Finnsnes',      lat: 69.230, lng: 17.984, gridTier: 'weak',   portStayMinutes: 30  },
  { id: 21, name: 'Tromsø',        lat: 69.649, lng: 18.956, gridTier: 'strong', portStayMinutes: 240 },
  { id: 22, name: 'Skjervøy',      lat: 70.032, lng: 20.971, gridTier: 'weak',   portStayMinutes: 15  },
  { id: 23, name: 'Øksfjord',      lat: 70.238, lng: 22.353, gridTier: 'weak',   portStayMinutes: 10  },
  { id: 24, name: 'Hammerfest',    lat: 70.663, lng: 23.682, gridTier: 'medium', portStayMinutes: 40  },
  { id: 25, name: 'Havøysund',     lat: 70.998, lng: 24.660, gridTier: 'weak',   portStayMinutes: 15  },
  { id: 26, name: 'Honningsvåg',   lat: 70.982, lng: 25.970, gridTier: 'medium', portStayMinutes: 215 },
  { id: 27, name: 'Kjøllefjord',   lat: 70.948, lng: 27.348, gridTier: 'weak',   portStayMinutes: 20  },
  { id: 28, name: 'Mehamn',        lat: 71.038, lng: 27.847, gridTier: 'weak',   portStayMinutes: 20  },
  { id: 29, name: 'Berlevåg',      lat: 70.858, lng: 29.090, gridTier: 'weak',   portStayMinutes: 10  },
  { id: 30, name: 'Båtsfjord',     lat: 70.634, lng: 29.717, gridTier: 'weak',   portStayMinutes: 30  },
  { id: 31, name: 'Vardø',         lat: 70.370, lng: 31.107, gridTier: 'weak',   portStayMinutes: 15  },
  { id: 32, name: 'Vadsø',         lat: 70.075, lng: 29.749, gridTier: 'weak',   portStayMinutes: 15  },
  { id: 33, name: 'Kirkenes',      lat: 69.727, lng: 30.045, gridTier: 'strong', portStayMinutes: 210 },
];

/** Arctic Circle latitude for map rendering */
export const ARCTIC_CIRCLE_LAT = 66.5633;
