import { json, type RequestHandler } from '@sveltejs/kit';
import { SearchBoxAPIService } from '$lib/services/SearchBoxAPIService';
import { MapBoxGeocodingService } from '$lib/services/MapBoxGeocodingService';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { location, radius = 10000, categories = ['restaurant', 'gas_station', 'hotel'], limit = 10 } = body;

    console.log(`🔍 Loading POIs around ${location} with radius ${radius}m and categories:`, categories);

    // Initialize services
    const searchBoxService = new SearchBoxAPIService();
    const geocodingService = new MapBoxGeocodingService();

    // Geocode the location to get coordinates
    const geocodeResult = await geocodingService.geocode(location);
    if (!geocodeResult.success || !geocodeResult.coordinates) {
      return json({ 
        success: false, 
        error: `Could not find coordinates for ${location}`,
        pois: []
      });
    }

    const [lng, lat] = geocodeResult.coordinates;
    console.log(`📍 ${location} coordinates: ${lng}, ${lat}`);

    // Create a small circular route around the point for POI search
    // Generate a few points around the location in a small radius
    const routePoints: [number, number][] = [
      [lng, lat], // Center point
      [lng + 0.01, lat], // East
      [lng, lat + 0.01], // North  
      [lng - 0.01, lat], // West
      [lng, lat - 0.01], // South
      [lng, lat] // Back to center
    ];

    // Search for POIs using the SearchBox API service
    const pois = await searchBoxService.searchPOIsByCategory({
      categories,
      routeCoordinates: routePoints,
      radius,
      limit
    });

    console.log(`🎯 Found ${pois.length} POIs around ${location}`);

    return json({
      success: true,
      pois,
      location: {
        name: location,
        coordinates: [lng, lat]
      }
    });

  } catch (error) {
    console.error('Error loading POIs around location:', error);
    return json({ 
      success: false, 
      error: 'Failed to load POIs around location',
      pois: []
    }, { status: 500 });
  }
};
