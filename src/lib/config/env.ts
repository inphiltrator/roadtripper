export const config = {
  google: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  },
  mapbox: {
    accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    styleUrl: import.meta.env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/outdoors-v12'
  },
  performance: {
    maxPOIsPerRequest: 50,
    maxRouteAlternatives: 3,
    cacheTimeout: 300000, // 5 minutes
    terrainExaggeration: 1.5
  },
  southwest: {
    // Southwest USA region bounds
    bounds: {
      north: 42.0,
      south: 32.5,
      east: -109.0,  
      west: -124.5
    },
    defaultCenter: {
      lat: 36.1699,
      lng: -115.1398 // Las Vegas
    },
    defaultZoom: 7,
    states: ['CA', 'NV', 'UT', 'AZ']
  }
};

// Environment validation
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.google.apiKey) {
    errors.push('Google Maps API key is required (VITE_GOOGLE_MAPS_API_KEY)');
  }
  
  // Optional validations for enhanced features
  if (!config.mapbox.accessToken) {
    console.warn('Mapbox access token not provided, using fallback maps');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Development vs Production configuration
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Feature flags
export const features = {
  enableRealTimeWeather: import.meta.env.VITE_ENABLE_WEATHER === 'true',
  enablePOICaching: import.meta.env.VITE_ENABLE_POI_CACHE !== 'false', // Default enabled
  enableRouteOptimization: import.meta.env.VITE_ENABLE_ROUTE_OPTIMIZATION !== 'false', // Default enabled
  enableAnalytics: isProduction && import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebugMode: isDevelopment || import.meta.env.VITE_DEBUG_MODE === 'true'
};

// Debug logging
if (features.enableDebugMode) {
  console.log('🔧 Environment Configuration:', {
    isDevelopment,
    isProduction,
    features,
    apis: {
      google: !!config.google.apiKey,
      mapbox: !!config.mapbox.accessToken
    }
  });
}
