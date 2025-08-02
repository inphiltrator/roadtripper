// Southwest USA Regional Configuration
// Optimized for Nevada, California, Utah, Arizona

export const SOUTHWEST_REGION = {
  name: 'Southwest USA',
  states: ['CA', 'NV', 'UT', 'AZ'] as const,
  
  // Geographic bounds
  bounds: {
    southwest: [-124.5, 32.5] as const, // [lng, lat]
    northeast: [-109.0, 42.0] as const,
    bbox: '-124.5,32.5,-109.0,42.0'
  },
  
  // Default map view
  mapDefaults: {
    center: [-115.0, 36.0] as const, // Near Las Vegas
    zoom: 6,
    minZoom: 5,
    maxZoom: 18
  },
  
  // Regional points of interest
  poi: {
    nationalParks: [
      'Grand Canyon', 'Yosemite', 'Death Valley', 'Zion',
      'Joshua Tree', 'Sequoia', 'Kings Canyon', 'Arches',
      'Canyonlands', 'Bryce Canyon', 'Capitol Reef'
    ],
    scenicRoutes: [
      'Route 66', 'Pacific Coast Highway', 'Valley of Fire',
      'Extraterrestrial Highway', 'Scenic Byway 12'
    ],
    majorCities: [
      'Los Angeles', 'Las Vegas', 'Phoenix', 'San Francisco',
      'San Diego', 'Salt Lake City', 'Reno', 'Tucson'
    ]
  },
  
  // State-specific information
  stateInfo: {
    CA: {
      name: 'California',
      timezone: 'America/Los_Angeles',
      highlights: ['Pacific Coast', 'Yosemite', 'Death Valley']
    },
    NV: {
      name: 'Nevada',
      timezone: 'America/Los_Angeles',
      highlights: ['Las Vegas', 'Lake Tahoe', 'Valley of Fire']
    },
    UT: {
      name: 'Utah',
      timezone: 'America/Denver',
      highlights: ['Mighty Five National Parks', 'Salt Lake City']
    },
    AZ: {
      name: 'Arizona',
      timezone: 'America/Phoenix',
      highlights: ['Grand Canyon', 'Sedona', 'Monument Valley']
    }
  }
} as const;

// Validation functions
export function isInSouthwestRegion(lat: number, lng: number): boolean {
  const { bounds } = SOUTHWEST_REGION;
  return lat >= bounds.southwest[1] && lat <= bounds.northeast[1] &&
         lng >= bounds.southwest[0] && lng <= bounds.northeast[0];
}

export function getStateFromCoordinates(lat: number, lng: number): keyof typeof SOUTHWEST_REGION.stateInfo | null {
  if (!isInSouthwestRegion(lat, lng)) return null;
  
  // Simplified state boundary detection
  // In production, you would use more precise polygon data
  if (lng >= -124.5 && lng <= -114.0) {
    return 'CA'; // California (rough approximation)
  }
  if (lng >= -120.0 && lng <= -114.0 && lat >= 35.0 && lat <= 42.0) {
    return 'NV'; // Nevada
  }
  if (lng >= -114.0 && lng <= -109.0 && lat >= 37.0 && lat <= 42.0) {
    return 'UT'; // Utah
  }
  if (lng >= -114.5 && lng <= -109.0 && lat >= 31.3 && lat <= 37.0) {
    return 'AZ'; // Arizona
  }
  
  return 'CA'; // Default fallback
}

// POI category detection
export function categorizePOI(name: string, description?: string): string[] {
  const categories: string[] = [];
  const searchText = `${name} ${description || ''}`.toLowerCase();
  
  if (SOUTHWEST_REGION.poi.nationalParks.some(park => 
    searchText.includes(park.toLowerCase())
  )) {
    categories.push('National Park');
  }
  
  if (SOUTHWEST_REGION.poi.scenicRoutes.some(route => 
    searchText.includes(route.toLowerCase())
  )) {
    categories.push('Scenic Route');
  }
  
  if (searchText.includes('desert') || searchText.includes('canyon')) {
    categories.push('Desert/Canyon');
  }
  
  if (searchText.includes('beach') || searchText.includes('coast')) {
    categories.push('Coastal');
  }
  
  return categories.length > 0 ? categories : ['General'];
}

// Seasonal warnings based on region
export function getSeasonalWarnings(lat: number, lng: number, date: Date): string[] {
  const warnings: string[] = [];
  const month = date.getMonth(); // 0-11
  const state = getStateFromCoordinates(lat, lng);
  
  // Summer heat warnings (May-September)
  if (month >= 4 && month <= 8) {
    if (state === 'AZ' || state === 'NV') {
      warnings.push('Extreme heat warning: Temperatures may exceed 110°F (43°C)');
    }
    if (lat < 36.0) { // Southern areas
      warnings.push('Desert travel: Carry extra water and check vehicle cooling system');
    }
  }
  
  // Winter snow warnings (December-March)
  if (month >= 11 || month <= 2) {
    if (lat > 39.0) { // Northern areas
      warnings.push('Mountain passes may require chains or 4WD');
    }
    if (state === 'UT') {
      warnings.push('Snow conditions likely in higher elevations');
    }
  }
  
  return warnings;
}
