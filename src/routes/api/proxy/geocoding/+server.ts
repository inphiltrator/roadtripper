import { json } from '@sveltejs/kit';
import { MAPBOX_PUBLIC_TOKEN, SOUTHWEST_BBOX } from '$env/static/private';
import type { RequestHandler } from './$types';

// Southwest USA Bounds for regional filtering
const DEFAULT_SOUTHWEST_BBOX = '-124.5,32.5,-109.0,42.0';

// Regional bounds check function
function isInSouthwestRegion(lat: number, lng: number): boolean {
  return lat >= 32.5 && lat <= 42.0 && 
         lng >= -124.5 && lng <= -109.0;
}

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('q');
  
  if (!query) {
    return json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  if (!MAPBOX_PUBLIC_TOKEN) {
    return json({ error: 'MapBox API token not configured' }, { status: 500 });
  }

  try {
    // Use regional bounds for Southwest USA
    const bbox = SOUTHWEST_BBOX || DEFAULT_SOUTHWEST_BBOX;
    
    const fetchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${MAPBOX_PUBLIC_TOKEN}&` +
      `country=us&` +
      `bbox=${bbox}&` +
      `limit=5`;

    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      throw new Error(`MapBox API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Additional regional filtering on the results
    if (data.features) {
      data.features = data.features.filter((feature: any) => {
        const [lng, lat] = feature.geometry.coordinates;
        return isInSouthwestRegion(lat, lng);
      });
      
      // Add regional context to each result
      data.features = data.features.map((feature: any) => {
        const [lng, lat] = feature.geometry.coordinates;
        const state = getStateFromCoordinates(lat, lng);
        
        return {
          ...feature,
          properties: {
            ...feature.properties,
            region: 'Southwest USA',
            state: state,
            isNationalPark: isNationalParkArea(feature.place_name),
            isRoute66: isRoute66Related(feature.place_name)
          }
        };
      });
    }

    return json(data);
    
  } catch (error) {
    console.error('Geocoding API Error:', error);
    return json(
      { error: 'Failed to fetch geocoding results' }, 
      { status: 500 }
    );
  }
};

// Helper function to determine state from coordinates
function getStateFromCoordinates(lat: number, lng: number): string {
  // Approximate state boundaries for Southwest USA
  if (lng >= -124.5 && lng <= -114.0) {
    return lat >= 36.0 ? 'CA' : 'CA'; // California spans both
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

// Helper function to detect National Park areas
function isNationalParkArea(placeName: string): boolean {
  const parkKeywords = [
    'national park', 'yosemite', 'grand canyon', 'zion', 'death valley',
    'joshua tree', 'sequoia', 'kings canyon', 'arches', 'canyonlands',
    'bryce canyon', 'capitol reef'
  ];
  
  return parkKeywords.some(keyword => 
    placeName.toLowerCase().includes(keyword)
  );
}

// Helper function to detect Route 66 related locations
function isRoute66Related(placeName: string): boolean {
  const route66Keywords = [
    'route 66', 'historic route', 'mother road', 'barstow', 'needles',
    'kingman', 'seligman', 'flagstaff', 'williams'
  ];
  
  return route66Keywords.some(keyword => 
    placeName.toLowerCase().includes(keyword)
  );
}
