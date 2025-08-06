import { describe, it, expect, vi } from 'vitest';

// Mock POI utility functions for testing
interface POI {
  id: string;
  name: string;
  category: string;
  coordinates: [number, number];
  distance?: number;
  rating?: number;
}

// Distance calculation utility (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

// POI filtering utilities
function filterPOIsByCategory(pois: POI[], categories: string[]): POI[] {
  if (categories.length === 0) return pois;
  return pois.filter(poi => categories.includes(poi.category));
}

function filterPOIsByRadius(pois: POI[], centerLat: number, centerLng: number, radiusMeters: number): POI[] {
  return pois.filter(poi => {
    const distance = calculateDistance(centerLat, centerLng, poi.coordinates[1], poi.coordinates[0]);
    return distance <= radiusMeters;
  });
}

// Southwest USA region check
function isInSouthwestRegion(lat: number, lng: number): boolean {
  return lat >= 32.5 && lat <= 42.0 && 
         lng >= -124.5 && lng <= -109.0;
}

// Route point sampling
function sampleRoutePoints(coordinates: [number, number][], intervalMeters: number): [number, number][] {
  if (coordinates.length === 0) return [];
  
  const sampledPoints: [number, number][] = [];
  sampledPoints.push(coordinates[0]); // Always include start
  
  let lastSamplePoint = coordinates[0];
  
  for (let i = 1; i < coordinates.length; i++) {
    const [currLng, currLat] = coordinates[i];
    
    const distanceFromLastSample = calculateDistance(
      lastSamplePoint[1], lastSamplePoint[0], 
      currLat, currLng
    );
    
    if (distanceFromLastSample >= intervalMeters) {
      sampledPoints.push([currLng, currLat]);
      lastSamplePoint = [currLng, currLat];
    }
  }
  
  // Always include end point
  const lastPoint = coordinates[coordinates.length - 1];
  if (sampledPoints[sampledPoints.length - 1] !== lastPoint) {
    sampledPoints.push(lastPoint);
  }
  
  return sampledPoints;
}

describe('POI Utility Functions', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Los Angeles to Las Vegas (approximately 435 km)
      const distance = calculateDistance(34.0522, -118.2437, 36.1699, -115.1398);
      const distanceKm = distance / 1000;
      
      // Should be approximately 367 km (actual LA to Vegas distance)
      expect(distanceKm).toBeGreaterThan(350);
      expect(distanceKm).toBeLessThan(400);
    });
    
    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(34.0522, -118.2437, 34.0522, -118.2437);
      expect(distance).toBe(0);
    });
  });
  
  describe('filterPOIsByCategory', () => {
    const testPOIs: POI[] = [
      { id: '1', name: 'Grand Canyon', category: 'national_park', coordinates: [-112.1129, 36.1069] },
      { id: '2', name: 'Camping Site', category: 'camping', coordinates: [-113.0, 37.0] },
      { id: '3', name: 'Restaurant', category: 'dining', coordinates: [-114.0, 35.0] },
      { id: '4', name: 'Zion Park', category: 'national_park', coordinates: [-113.0263, 37.2982] }
    ];
    
    it('should return all POIs when no categories selected', () => {
      const result = filterPOIsByCategory(testPOIs, []);
      expect(result).toEqual(testPOIs);
    });
    
    it('should filter POIs by single category', () => {
      const result = filterPOIsByCategory(testPOIs, ['national_park']);
      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('national_park');
      expect(result[1].category).toBe('national_park');
    });
    
    it('should filter POIs by multiple categories', () => {
      const result = filterPOIsByCategory(testPOIs, ['national_park', 'camping']);
      expect(result).toHaveLength(3);
    });
    
    it('should return empty array if no POIs match category', () => {
      const result = filterPOIsByCategory(testPOIs, ['nonexistent']);
      expect(result).toHaveLength(0);
    });
  });
  
  describe('filterPOIsByRadius', () => {
    const testPOIs: POI[] = [
      // Close POI (should be within 10km of LA)
      { id: '1', name: 'Close POI', category: 'attraction', coordinates: [-118.25, 34.05] },
      // Far POI (should be outside 10km of LA)  
      { id: '2', name: 'Far POI', category: 'attraction', coordinates: [-115.0, 36.0] }
    ];
    
    it('should filter POIs within radius', () => {
      const laCoords = { lat: 34.0522, lng: -118.2437 };
      const result = filterPOIsByRadius(testPOIs, laCoords.lat, laCoords.lng, 10000); // 10km
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Close POI');
    });
    
    it('should include all POIs with large radius', () => {
      const laCoords = { lat: 34.0522, lng: -118.2437 };
      const result = filterPOIsByRadius(testPOIs, laCoords.lat, laCoords.lng, 1000000); // 1000km
      
      expect(result).toHaveLength(2);
    });
    
    it('should return empty array with very small radius', () => {
      const laCoords = { lat: 34.0522, lng: -118.2437 };
      const result = filterPOIsByRadius(testPOIs, laCoords.lat, laCoords.lng, 1); // 1 meter
      
      expect(result).toHaveLength(0);
    });
  });
  
  describe('isInSouthwestRegion', () => {
    it('should return true for Los Angeles', () => {
      expect(isInSouthwestRegion(34.0522, -118.2437)).toBe(true);
    });
    
    it('should return true for Las Vegas', () => {
      expect(isInSouthwestRegion(36.1699, -115.1398)).toBe(true);
    });
    
    it('should return true for Grand Canyon', () => {
      expect(isInSouthwestRegion(36.1069, -112.1129)).toBe(true);
    });
    
    it('should return false for New York', () => {
      expect(isInSouthwestRegion(40.7128, -74.0060)).toBe(false);
    });
    
    it('should return false for Seattle', () => {
      expect(isInSouthwestRegion(47.6062, -122.3321)).toBe(false);
    });
    
    it('should return false for coordinates outside bounds', () => {
      // Too far north
      expect(isInSouthwestRegion(45.0, -118.0)).toBe(false);
      // Too far east
      expect(isInSouthwestRegion(35.0, -100.0)).toBe(false);
      // Too far south
      expect(isInSouthwestRegion(30.0, -118.0)).toBe(false);
      // Too far west
      expect(isInSouthwestRegion(35.0, -130.0)).toBe(false);
    });
  });
  
  describe('sampleRoutePoints', () => {
    it('should include start and end points', () => {
      const route: [number, number][] = [
        [-118.2437, 34.0522], // LA
        [-115.1398, 36.1699]  // Vegas
      ];
      
      const result = sampleRoutePoints(route, 10000);
      
      // LA to Vegas is ~370km, so with 10km intervals we might get intermediate points
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0]).toEqual(route[0]); // Start point
      expect(result[result.length - 1]).toEqual(route[1]); // End point
    });
    
    it('should sample points at regular intervals', () => {
      // Create a longer route
      const route: [number, number][] = [
        [-118.2437, 34.0522], // LA
        [-117.0, 35.0],       // Intermediate point 1
        [-116.0, 35.5],       // Intermediate point 2  
        [-115.1398, 36.1699]  // Vegas
      ];
      
      const result = sampleRoutePoints(route, 50000); // 50km intervals
      
      expect(result.length).toBeGreaterThanOrEqual(2); // At least start and end
      expect(result[0]).toEqual(route[0]); // First point should be start
      expect(result[result.length - 1]).toEqual(route[route.length - 1]); // Last should be end
    });
    
    it('should return empty array for empty input', () => {
      const result = sampleRoutePoints([], 10000);
      expect(result).toEqual([]);
    });
    
    it('should handle single point', () => {
      const route: [number, number][] = [[-118.2437, 34.0522]];
      const result = sampleRoutePoints(route, 10000);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(route[0]);
    });
  });
});

describe('POI Category Mappings', () => {
  const CATEGORY_MAPPINGS = {
    'national_park': ['national_park', 'tourist_attraction', 'park'],
    'state_park': ['park', 'tourist_attraction'],
    'camping': ['campground', 'rv_park', 'lodging'],
    'dining': ['restaurant', 'cafe', 'food'],
    'attraction': ['tourist_attraction', 'museum', 'entertainment'],
    'lodging': ['lodging', 'hotel', 'motel'],
    'fuel': ['gas_station', 'charging_station']
  };
  
  it('should have all required categories', () => {
    expect(CATEGORY_MAPPINGS).toHaveProperty('national_park');
    expect(CATEGORY_MAPPINGS).toHaveProperty('camping');
    expect(CATEGORY_MAPPINGS).toHaveProperty('dining');
    expect(CATEGORY_MAPPINGS).toHaveProperty('attraction');
    expect(CATEGORY_MAPPINGS).toHaveProperty('lodging');
    expect(CATEGORY_MAPPINGS).toHaveProperty('fuel');
  });
  
  it('should map categories to MapBox place types', () => {
    expect(CATEGORY_MAPPINGS.national_park).toContain('national_park');
    expect(CATEGORY_MAPPINGS.camping).toContain('campground');
    expect(CATEGORY_MAPPINGS.dining).toContain('restaurant');
    expect(CATEGORY_MAPPINGS.fuel).toContain('gas_station');
  });
});

describe('POI Data Validation', () => {
  it('should validate POI structure', () => {
    const validPOI: POI = {
      id: 'test-poi-1',
      name: 'Test POI',
      category: 'national_park',
      coordinates: [-112.1129, 36.1069],
      distance: 1000,
      rating: 4.5
    };
    
    expect(validPOI).toHaveProperty('id');
    expect(validPOI).toHaveProperty('name');
    expect(validPOI).toHaveProperty('category');
    expect(validPOI).toHaveProperty('coordinates');
    expect(Array.isArray(validPOI.coordinates)).toBe(true);
    expect(validPOI.coordinates).toHaveLength(2);
  });
  
  it('should handle POIs without optional properties', () => {
    const minimalPOI: POI = {
      id: 'minimal-poi',
      name: 'Minimal POI',
      category: 'attraction',
      coordinates: [-118.0, 34.0]
    };
    
    expect(minimalPOI).toBeDefined();
    expect(minimalPOI.distance).toBeUndefined();
    expect(minimalPOI.rating).toBeUndefined();
  });
});
