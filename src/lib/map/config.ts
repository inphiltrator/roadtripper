// Southwest USA Map Configuration
// Optimized for desert and mountain terrain visualization

import type { LngLatBoundsLike, MapOptions } from 'maplibre-gl';
import { SOUTHWEST_REGION } from '$lib/config/region';
import { config } from '$lib/config/env';

// Regional Map Bounds - Southwest USA
export const SOUTHWEST_BOUNDS: LngLatBoundsLike = [
  [-124.5, 32.5], // Southwest corner (San Diego area)
  [-109.0, 42.0]  // Northeast corner (Salt Lake City area)
];

// Default Map Configuration
export const DEFAULT_MAP_CONFIG: MapOptions = {
  center: [-115.0, 36.0], // Near Las Vegas - heart of Southwest
  zoom: 6,
  minZoom: 5,
  maxZoom: 18,
  maxBounds: SOUTHWEST_BOUNDS,
  attributionControl: false,
  logoPosition: 'bottom-right'
};

// Function to get Stadia Maps URL with API key
function getStadiaMapUrl(styleUrl: string): string {
  if (config.stadia.apiKey) {
    const separator = styleUrl.includes('?') ? '&' : '?';
    return `${styleUrl}${separator}api_key=${config.stadia.apiKey}`;
  }
  return styleUrl;
}

// Stadia Maps Configuration for Southwest USA
export const STADIA_MAPS_CONFIG = {
  // Outdoors style optimized for terrain visualization
  outdoors: {
    url: getStadiaMapUrl('https://tiles.stadiamaps.com/styles/outdoors.json'),
    description: 'Terrain-focused style perfect for desert and mountain landscapes'
  },
  
  // Alternative styles for different use cases
  satellite: {
    url: getStadiaMapUrl('https://tiles.stadiamaps.com/styles/satellite.json'),
    description: 'Satellite imagery for detailed terrain inspection'
  },
  
  alidade_smooth: {
    url: getStadiaMapUrl('https://tiles.stadiamaps.com/styles/alidade_smooth.json'),
    description: 'Clean style for urban areas and highways'
  }
};

// Performance Optimization Settings
export const PERFORMANCE_CONFIG = {
  // Cache popular zoom levels for Southwest region
  cacheZoomLevels: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  
  // Cluster POIs when more than this number
  poiClusterThreshold: 20,
  
  // Lazy load elevation profiles
  elevationLazyLoad: true,
  
  // Terrain exaggeration for mountain visibility
  terrainExaggeration: 1.5
};

// Regional Layer Configurations
export const SOUTHWEST_LAYERS = {
  // State boundaries as subtle overlay
  stateBoundaries: {
    id: 'state-boundaries',
    type: 'line' as const,
    paint: {
      'line-color': '#ff6b35',
      'line-width': 2,
      'line-opacity': 0.6,
      'line-dasharray': [2, 4]
    }
  },
  
  // National Parks highlight areas
  nationalParks: {
    id: 'national-parks',
    type: 'fill' as const,
    paint: {
      'fill-color': '#228B22',
      'fill-opacity': 0.3,
      'fill-outline-color': '#006400'
    }
  },
  
  // Route 66 special styling
  route66: {
    id: 'route-66',
    type: 'line' as const,
    paint: {
      'line-color': '#FFD700',
      'line-width': 4,
      'line-opacity': 0.8
    }
  },
  
  // Desert areas styling
  desertAreas: {
    id: 'desert-areas',
    type: 'fill' as const,
    paint: {
      'fill-color': '#DEB887',
      'fill-opacity': 0.2
    }
  }
};

// POI Marker Styles for Southwest theme
export const POI_MARKERS = {
  nationalPark: {
    color: '#228B22',
    icon: '🏜️',
    size: 1.2
  },
  stateParks: {
    color: '#32CD32',
    icon: '🏞️',
    size: 1.0
  },
  route66: {
    color: '#FFD700',
    icon: '🛣️',
    size: 1.1
  },
  viewpoint: {
    color: '#FF6B35',
    icon: '📍',
    size: 0.9
  },
  camping: {
    color: '#8B4513',
    icon: '🏕️',
    size: 1.0
  },
  gasStation: {
    color: '#DC143C',
    icon: '⛽',
    size: 0.8
  }
};

// Elevation Color Scheme for Southwest terrain
export const ELEVATION_COLORS = {
  // Sea level to 1000ft - Desert floors
  seaLevel: '#F4E4C1',
  
  // 1000-3000ft - Desert mesas and valleys
  lowDesert: '#DEB887',
  
  // 3000-5000ft - Foothills and high plains
  foothills: '#CD853F',
  
  // 5000-7000ft - Mountain slopes
  mountains: '#A0522D',
  
  // 7000-10000ft - High peaks
  highPeaks: '#8B4513',
  
  // 10000ft+ - Snow-capped peaks
  snowCapped: '#FFFFFF'
};

// Animation Settings for smooth Southwest experience
export const ANIMATION_CONFIG = {
  // Smooth flyTo for route visualization
  flyToDuration: 2000,
  flyToEasing: (t: number) => t * (2 - t), // ease-out
  
  // POI reveal animation
  poiRevealDelay: 100,
  poiRevealDuration: 300,
  
  // Route drawing animation
  routeDrawDuration: 1500,
  routeDrawEasing: 'ease-in-out'
};

// Mobile Optimization for Southwest travelers
export const MOBILE_CONFIG = {
  // Touch-friendly controls
  touchZoomRotate: true,
  touchPitch: false, // Disable pitch on mobile for better UX
  doubleClickZoom: true,
  
  // Simplified rendering on mobile
  simplifyBelowZoom: 8,
  
  // Battery optimization
  preserveDrawingBuffer: false,
  refreshExpiredTiles: false
};

// Seasonal Adjustments
export function getSeasonalConfig(month: number) {
  // Summer months (May-September) - Heat warnings
  if (month >= 4 && month <= 8) {
    return {
      heatWarningColor: '#FF4500',
      recommendedTravelHours: 'Early morning or evening',
      waterReminder: true
    };
  }
  
  // Winter months (December-March) - Snow conditions
  if (month >= 11 || month <= 2) {
    return {
      snowWarningColor: '#87CEEB',
      chainRequirements: true,
      elevationWarnings: true
    };
  }
  
  // Spring/Fall - Optimal conditions
  return {
    optimalConditions: true,
    wildflowerSeason: month >= 2 && month <= 4
  };
}

// Export default configuration for easy import
export const SOUTHWEST_MAP_CONFIG = {
  bounds: SOUTHWEST_BOUNDS,
  defaults: DEFAULT_MAP_CONFIG,
  stadia: STADIA_MAPS_CONFIG,
  performance: PERFORMANCE_CONFIG,
  layers: SOUTHWEST_LAYERS,
  markers: POI_MARKERS,
  elevation: ELEVATION_COLORS,
  animation: ANIMATION_CONFIG,
  mobile: MOBILE_CONFIG,
  seasonal: getSeasonalConfig
};
