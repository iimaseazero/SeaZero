// Sea Zero — 33 legs of the Hurtigruten route
// All values verbatim from the case data

export interface Leg {
  index: number;
  fromPortId: number;
  toPortId: number;
  distanceKm: number;
  baselineSailHours: number;  // at the implied baseline speed
}

export const LEGS: Leg[] = [
  { index: 0,  fromPortId: 0,  toPortId: 1,  distanceKm: 163, baselineSailHours: 6.00  },
  { index: 1,  fromPortId: 1,  toPortId: 2,  distanceKm: 52,  baselineSailHours: 2.50  },
  { index: 2,  fromPortId: 2,  toPortId: 3,  distanceKm: 72,  baselineSailHours: 3.00  },
  { index: 3,  fromPortId: 3,  toPortId: 4,  distanceKm: 28,  baselineSailHours: 1.25  },
  { index: 4,  fromPortId: 4,  toPortId: 5,  distanceKm: 65,  baselineSailHours: 3.00  },
  { index: 5,  fromPortId: 5,  toPortId: 6,  distanceKm: 89,  baselineSailHours: 3.75  },
  { index: 6,  fromPortId: 6,  toPortId: 7,  distanceKm: 169, baselineSailHours: 7.00  },
  { index: 7,  fromPortId: 7,  toPortId: 8,  distanceKm: 232, baselineSailHours: 8.75  },
  { index: 8,  fromPortId: 8,  toPortId: 9,  distanceKm: 85,  baselineSailHours: 3.50  },
  { index: 9,  fromPortId: 9,  toPortId: 10, distanceKm: 67,  baselineSailHours: 3.75  },
  { index: 10, fromPortId: 10, toPortId: 11, distanceKm: 28,  baselineSailHours: 1.16  },
  { index: 11, fromPortId: 11, toPortId: 12, distanceKm: 94,  baselineSailHours: 3.75  },
  { index: 12, fromPortId: 12, toPortId: 13, distanceKm: 72,  baselineSailHours: 3.00  },
  { index: 13, fromPortId: 13, toPortId: 14, distanceKm: 102, baselineSailHours: 4.00  },
  { index: 14, fromPortId: 14, toPortId: 15, distanceKm: 37,  baselineSailHours: 1.50  },
  { index: 15, fromPortId: 15, toPortId: 16, distanceKm: 65,  baselineSailHours: 3.00  },
  { index: 16, fromPortId: 16, toPortId: 17, distanceKm: 28,  baselineSailHours: 1.50  },
  { index: 17, fromPortId: 17, toPortId: 18, distanceKm: 33,  baselineSailHours: 1.25  },
  { index: 18, fromPortId: 18, toPortId: 19, distanceKm: 50,  baselineSailHours: 2.25  },
  { index: 19, fromPortId: 19, toPortId: 20, distanceKm: 81,  baselineSailHours: 3.25  },
  { index: 20, fromPortId: 20, toPortId: 21, distanceKm: 69,  baselineSailHours: 2.75  },
  { index: 21, fromPortId: 21, toPortId: 22, distanceKm: 98,  baselineSailHours: 4.00  },
  { index: 22, fromPortId: 22, toPortId: 23, distanceKm: 83,  baselineSailHours: 3.25  },
  { index: 23, fromPortId: 23, toPortId: 24, distanceKm: 76,  baselineSailHours: 3.00  },
  { index: 24, fromPortId: 24, toPortId: 25, distanceKm: 69,  baselineSailHours: 2.75  },
  { index: 25, fromPortId: 25, toPortId: 26, distanceKm: 52,  baselineSailHours: 2.00  },
  { index: 26, fromPortId: 26, toPortId: 27, distanceKm: 54,  baselineSailHours: 2.25  },
  { index: 27, fromPortId: 27, toPortId: 28, distanceKm: 48,  baselineSailHours: 2.00  },
  { index: 28, fromPortId: 28, toPortId: 29, distanceKm: 67,  baselineSailHours: 2.50  },
  { index: 29, fromPortId: 29, toPortId: 30, distanceKm: 43,  baselineSailHours: 1.50  },
  { index: 30, fromPortId: 30, toPortId: 31, distanceKm: 72,  baselineSailHours: 3.00  },
  { index: 31, fromPortId: 31, toPortId: 32, distanceKm: 78,  baselineSailHours: 3.25  },
  { index: 32, fromPortId: 32, toPortId: 33, distanceKm: 44,  baselineSailHours: 1.75  },
];

// Validation constants
export const TOTAL_DISTANCE_KM = LEGS.reduce((s, l) => s + l.distanceKm, 0);       // should be 2465
export const TOTAL_SAILING_HOURS = LEGS.reduce((s, l) => s + l.baselineSailHours, 0); // should be ~101.16
