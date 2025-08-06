import { json } from '@sveltejs/kit';
import { MAPBOX_PUBLIC_TOKEN } from '$env/static/private';
import { decodePolyline } from '$lib/utils/polyline';
import { SearchBoxAPIService, type SearchBoxPOI } from '$lib/services/SearchBoxAPIService';
import type { RequestHandler } from './$types';

/**
 * Modern POI API endpoint using MapBox Search Box API
 * Provides better POI data and more comprehensive category support
 */

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { polyline, radius = 10000, categories = ['national_park', 'attraction'] } = await request.json();
    
    // Debug logging
    console.log('🔍 Search Box API Request:', {
      hasToken: !!MAPBOX_PUBLIC_TOKEN,
      tokenLength: MAPBOX_PUBLIC_TOKEN?.length || 0,
      radius,
      categoriesCount: categories.length,
      categories
    });
    
    if (!polyline) {
      return json({ error: 'Polyline is required' }, { status: 400 });
    }
    
    if (!MAPBOX_PUBLIC_TOKEN) {
      console.error('❌ MapBox API token not configured');
      return json({ 
        error: 'POI service not available - Mapbox token missing', 
        pois: [],
        fallback: true 
      }, { status: 200 });
    }
    
    // Decode the polyline to coordinates
    const routeCoordinates = decodePolyline(polyline);
    
    if (routeCoordinates.length === 0) {
      return json({ error: 'Invalid polyline data' }, { status: 400 });
    }
    
    console.log(`🗺️ Decoded ${routeCoordinates.length} route coordinates`);
    
    // Initialize Search Box API Service
    const searchBoxService = new SearchBoxAPIService(MAPBOX_PUBLIC_TOKEN);
    
    // Search for POIs along the route using the modern Search Box API
    const searchStartTime = Date.now();
    const pois: SearchBoxPOI[] = await searchBoxService.searchPOIsByCategory({
      categories,
      routeCoordinates,
      radius,
      limit: 50
    });
    const searchDuration = Date.now() - searchStartTime;
    
    console.log(`🎯 Search Box API completed in ${searchDuration}ms`);
    console.log(`🏞️ Found ${pois.length} POIs along route`);
    
    // Transform Search Box POIs to legacy format for compatibility
    const transformedPOIs = pois.map((poi, index) => ({
      id: poi.id || `searchbox-poi-${index}`,
      name: poi.name,
      description: poi.description || `${poi.category[0]} in Southwest USA`,
      coordinates: poi.coordinates, // [lng, lat]
      category: poi.category[0] || 'attraction', // Use first category for backwards compatibility
      categories: poi.category, // Full category array
      distance: poi.distance || 0,
      rating: poi.rating || 4.0,
      address: poi.address,
      region: poi.region,
      poi_categories: poi.poi_category,
      properties: {
        ...poi.properties,
        isNationalPark: poi.category.includes('national_park'),
        isRoute66: poi.name?.toLowerCase().includes('route 66') || false,
        isLandmark: poi.properties.landmark || false,
        hasExternalData: !!(poi.properties.tel || poi.properties.website),
        maki: poi.properties.maki // MapBox icon ID
      }
    }));
    
    // Additional stats for monitoring
    const stats = {
      apiVersion: 'Search Box API v1',
      searchDuration: `${searchDuration}ms`,
      totalPOIs: transformedPOIs.length,
      radius: radius,
      categories: categories,
      categoriesFound: [...new Set(transformedPOIs.flatMap(poi => poi.categories))],
      regionCoverage: 'Southwest USA',
      hasExternalData: transformedPOIs.filter(poi => poi.properties.hasExternalData).length,
      landmarks: transformedPOIs.filter(poi => poi.properties.isLandmark).length,
      nationalParks: transformedPOIs.filter(poi => poi.properties.isNationalPark).length
    };
    
    console.log('📊 Search Box API Stats:', stats);
    
    return json({
      success: true,
      pois: transformedPOIs,
      stats,
      api_info: {
        service: 'MapBox Search Box API',
        version: 'v1',
        modernFeatures: true,
        enhancedPOIData: true,
        fallback: false
      }
    });
    
  } catch (error) {
    console.error('🚨 Search Box API error:', error);
    
    // Fallback to basic POI data if Search Box API fails
    const fallbackPOIs = [
      {
        id: 'fallback-grand-canyon',
        name: 'Grand Canyon National Park',
        description: 'Iconic natural wonder',
        coordinates: [-112.1129, 36.1069],
        category: 'national_park',
        categories: ['national_park', 'scenic_viewpoint'],
        rating: 4.8,
        address: 'Grand Canyon National Park, AZ',
        region: 'Southwest USA',
        properties: { isNationalPark: true, isLandmark: true }
      },
      {
        id: 'fallback-death-valley',
        name: 'Death Valley National Park', 
        description: 'Hottest, driest national park',
        coordinates: [-117.0794, 36.5054],
        category: 'national_park',
        categories: ['national_park', 'desert'],
        rating: 4.5,
        address: 'Death Valley National Park, CA',
        region: 'Southwest USA',
        properties: { isNationalPark: true, isLandmark: true }
      }
    ];
    
    return json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Search Box API error',
      pois: fallbackPOIs,
      fallback: true,
      api_info: {
        service: 'Fallback POI Data',
        modernFeatures: false,
        enhancedPOIData: false
      }
    }, { status: 200 });
  }
};
