import { json } from '@sveltejs/kit';
import { RegionalService } from '$lib/services/RegionalService';
import { ScenicRoutingService } from '$lib/services/ScenicRoutingService';
import { MapBoxGeocodingService } from '$lib/services/MapBoxGeocodingService';
import { EnhancedPOIService } from '$lib/services/EnhancedPOIService';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  console.log('🧪 Running Regional Features Test Suite...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0
    }
  };

  const startTime = Date.now();

  try {
    // Initialize services
    const regionalService = new RegionalService();
    const scenicService = new ScenicRoutingService();
    const geocodingService = new MapBoxGeocodingService();
    const poiService = new EnhancedPOIService();

    // Test 1: Regional bounds checking
    console.log('Testing regional bounds...');
    const testLocations = [
      { name: 'Las Vegas, NV', lat: 36.1716, lng: -115.1391, expected: true },
      { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740, expected: true },
      { name: 'Denver, CO', lat: 39.7392, lng: -104.9903, expected: false }
    ];

    const boundsResults = testLocations.map(location => {
      const result = regionalService.isInSouthwestRegion(location.lat, location.lng);
      const passed = result === location.expected;
      return { ...location, result, passed };
    });

    const boundsTest = {
      name: 'Regional Bounds Checking',
      passed: boundsResults.every(r => r.passed),
      details: boundsResults
    };
    results.tests.push(boundsTest);

    // Test 2: Test routes validation
    console.log('Testing required routes...');
    const testRoutes = regionalService.getTestRoutes();
    
    for (const route of testRoutes) {
      const validation = regionalService.validateRouteWaypoints(route.waypoints);
      const routeTest = {
        name: `Route Test: ${route.name}`,
        passed: validation.valid,
        details: {
          waypoints: route.waypoints.length,
          validation,
          route: route.name
        }
      };
      results.tests.push(routeTest);
    }

    // Test 3: MapBox geocoding
    console.log('Testing MapBox geocoding...');
    const geocodingQueries = ['Las Vegas Strip', 'Grand Canyon', 'Route 66', 'Death Valley'];
    
    for (const query of geocodingQueries) {
      try {
        const searchResults = await geocodingService.searchPlaces(query);
        const geocodingTest = {
          name: `MapBox Geocoding: ${query}`,
          passed: searchResults.length > 0,
          details: {
            query,
            resultCount: searchResults.length,
            topResult: searchResults[0] || null
          }
        };
        results.tests.push(geocodingTest);
      } catch (error) {
        results.tests.push({
          name: `MapBox Geocoding: ${query}`,
          passed: false,
          details: { query, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    // Test 4: Southwest POI categories
    console.log('Testing POI categories...');
    const categories = poiService.getSouthwestCategories();
    const poiTest = {
      name: 'Southwest POI Categories',
      passed: Object.keys(categories).length >= 6,
      details: {
        categoryCount: Object.keys(categories).length,
        categories: Object.keys(categories)
      }
    };
    results.tests.push(poiTest);

    // Test 5: Scenic routing
    console.log('Testing scenic routing...');
    const route66Waypoints = [
      { name: 'Needles, CA', lat: 34.8481, lng: -114.6140 },
      { name: 'Flagstaff, AZ', lat: 35.1983, lng: -111.6513 }
    ];

    try {
      const routes = await scenicService.getScenicRoutes(route66Waypoints, {
        preferRoute66: true,
        photographyFriendly: true
      });

      const scenicTest = {
        name: 'Route 66 Scenic Routing',
        passed: routes.length > 0,
        details: {
          routeCount: routes.length,
          routes: routes.map(r => ({
            name: r.name,
            distance: r.distance,
            duration: r.duration,
            difficulty: r.difficulty,
            routeType: r.routeType
          }))
        }
      };
      results.tests.push(scenicTest);
    } catch (error) {
      results.tests.push({
        name: 'Route 66 Scenic Routing',
        passed: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Test 6: Fuel range calculation
    console.log('Testing fuel range calculation...');
    const lasVegasStart = { name: 'Las Vegas, NV', lat: 36.1716, lng: -115.1391 };
    
    try {
      const fuelRange = scenicService.calculateFuelRange(lasVegasStart, 25, 15, 0.25);
      const fuelTest = {
        name: 'Fuel Range Calculator',
        passed: fuelRange.maxRange > 0 && fuelRange.recommendedRange > 0,
        details: {
          maxRange: fuelRange.maxRange,
          recommendedRange: fuelRange.recommendedRange,
          fuelStopsCount: fuelRange.fuelStops.length
        }
      };
      results.tests.push(fuelTest);
    } catch (error) {
      results.tests.push({
        name: 'Fuel Range Calculator',
        passed: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Test 7: Photography planning
    console.log('Testing photography planning...');
    const grandCanyonLocation = { name: 'Grand Canyon', lat: 36.1069, lng: -112.1129 };
    
    try {
      const sunTimes = scenicService.getSunriseSunsetTimes(grandCanyonLocation);
      const photoTest = {
        name: 'Photography Planning',
        passed: sunTimes.sunrise && sunTimes.sunset,
        details: {
          sunrise: sunTimes.sunrise.toLocaleTimeString(),
          sunset: sunTimes.sunset.toLocaleTimeString(),
          goldenHour: `${sunTimes.goldenHourStart.toLocaleTimeString()} - ${sunTimes.goldenHourEnd.toLocaleTimeString()}`
        }
      };
      results.tests.push(photoTest);
    } catch (error) {
      results.tests.push({
        name: 'Photography Planning',
        passed: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Calculate summary
    results.summary.total = results.tests.length;
    results.summary.passed = results.tests.filter(t => t.passed).length;
    results.summary.failed = results.summary.total - results.summary.passed;
    results.summary.duration = Date.now() - startTime;

    console.log(`\n🧪 Test Results: ${results.summary.passed}/${results.summary.total} passed in ${results.summary.duration}ms`);

    return json({
      success: true,
      message: 'Regional features test completed',
      results
    });

  } catch (error) {
    console.error('Test suite failed:', error);
    return json({
      success: false,
      message: 'Test suite failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 });
  }
};
