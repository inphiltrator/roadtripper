import { RegionalService } from '../services/RegionalService';
import { ScenicRoutingService } from '../services/ScenicRoutingService';
import { MapBoxGeocodingService } from '../services/MapBoxGeocodingService';
import { EnhancedPOIService } from '../services/EnhancedPOIService';
import type { Waypoint, Route } from '../types';

export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: any;
  error?: string;
}

export class RegionalFeatureTests {
  private regionalService: RegionalService;
  private scenicService: ScenicRoutingService;
  private geocodingService: MapBoxGeocodingService;
  private poiService: EnhancedPOIService;

  constructor() {
    this.regionalService = new RegionalService();
    this.scenicService = new ScenicRoutingService();
    this.geocodingService = new MapBoxGeocodingService();
    this.poiService = new EnhancedPOIService();
  }

  /**
   * Run all regional feature tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Regional Feature Tests for Southwest USA...');
    
    const testResults: TestResult[] = [];

    // Test 1: Regional bounds checking
    testResults.push(await this.testRegionalBounds());

    // Test 2: Required test routes
    testResults.push(...await this.testRequiredRoutes());

    // Test 3: MapBox Geocoding tests
    testResults.push(...await this.testMapBoxGeocoding());

    // Test 4: POI discovery with Southwest categories
    testResults.push(await this.testSouthwestPOICategories());

    // Test 5: Scenic routing with Route 66 preference
    testResults.push(await this.testRoute66Routing());

    // Test 6: Weather-based routing
    testResults.push(await this.testWeatherBasedRouting());

    // Test 7: Fuel range calculation
    testResults.push(await this.testFuelRangeCalculation());

    // Test 8: Elevation profile analysis
    testResults.push(await this.testElevationProfileAnalysis());

    // Print summary
    this.printTestSummary(testResults);

    return testResults;
  }

  private async testRegionalBounds(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testPoints = [
        { name: 'Las Vegas, NV', lat: 36.1716, lng: -115.1391, expected: true },
        { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740, expected: true },
        { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194, expected: true },
        { name: 'Salt Lake City, UT', lat: 40.7608, lng: -111.8910, expected: true },
        { name: 'Denver, CO', lat: 39.7392, lng: -104.9903, expected: false }, // Outside region
        { name: 'Mexico City, MX', lat: 19.4326, lng: -99.1332, expected: false } // Outside region
      ];

      let passedTests = 0;
      const details = [];

      for (const point of testPoints) {
        const result = this.regionalService.isInSouthwestRegion(point.lat, point.lng);
        const passed = result === point.expected;
        
        if (passed) passedTests++;
        
        details.push({
          location: point.name,
          expected: point.expected,
          actual: result,
          passed
        });
      }

      const success = passedTests === testPoints.length;
      
      return {
        testName: 'Regional Bounds Checking',
        success,
        duration: Date.now() - startTime,
        details: {
          passed: passedTests,
          total: testPoints.length,
          results: details
        }
      };
    } catch (error) {
      return {
        testName: 'Regional Bounds Checking',
        success: false,
        duration: Date.now() - startTime,
        details: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testRequiredRoutes(): Promise<TestResult[]> {
    const testRoutes = this.regionalService.getTestRoutes();
    const results: TestResult[] = [];

    for (const testRoute of testRoutes) {
      const startTime = Date.now();
      
      try {
        // Test route validation
        const validation = this.regionalService.validateRouteWaypoints(testRoute.waypoints);
        
        // Test route calculation
        const routes = await this.scenicService.getScenicRoutes(testRoute.waypoints);
        
        const success = validation.valid && routes.length > 0;
        
        results.push({
          testName: `Route Test: ${testRoute.name}`,
          success,
          duration: Date.now() - startTime,
          details: {
            validation,
            routeCount: routes.length,
            routes: routes.map(r => ({
              name: r.name,
              distance: r.distance,
              duration: r.duration,
              difficulty: r.difficulty
            }))
          }
        });
      } catch (error) {
        results.push({
          testName: `Route Test: ${testRoute.name}`,
          success: false,
          duration: Date.now() - startTime,
          details: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private async testMapBoxGeocoding(): Promise<TestResult[]> {
    const testQueries = [
      'Las Vegas Strip',
      'Grand Canyon', 
      'Route 66',
      'Death Valley'
    ];

    const results: TestResult[] = [];

    for (const query of testQueries) {
      const startTime = Date.now();
      
      try {
        const searchResults = await this.geocodingService.searchPlaces(query);
        const responseTime = Date.now() - startTime;
        
        const success = searchResults.length > 0;
        const expectedLocation = this.getExpectedLocationForQuery(query);
        
        results.push({
          testName: `MapBox Geocoding: ${query}`,
          success,
          duration: responseTime,
          details: {
            query,
            resultCount: searchResults.length,
            topResult: searchResults[0] || null,
            expectedLocation,
            responseTime
          }
        });
      } catch (error) {
        results.push({
          testName: `MapBox Geocoding: ${query}`,
          success: false,
          duration: Date.now() - startTime,
          details: { query },
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private async testSouthwestPOICategories(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const categories = this.poiService.getSouthwestCategories();
      const testLocation = { lat: 36.1069, lng: -112.1129 }; // Grand Canyon
      
      // Test POI discovery for national parks category
      const pois = await this.poiService.discoverPOIs(
        testLocation, 
        50000, // 50km radius
        ['national_park', 'attraction']
      );

      const success = Object.keys(categories).length >= 6 && pois.length > 0;
      
      return {
        testName: 'Southwest POI Categories',
        success,
        duration: Date.now() - startTime,
        details: {
          categoryCount: Object.keys(categories).length,
          categories: Object.keys(categories),
          poiCount: pois.length,
          samplePOIs: pois.slice(0, 3).map(poi => ({
            name: poi.name,
            category: poi.category,
            rating: poi.rating
          }))
        }
      };
    } catch (error) {
      return {
        testName: 'Southwest POI Categories',
        success: false,
        duration: Date.now() - startTime,
        details: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testRoute66Routing(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const waypoints: Waypoint[] = [
        { name: 'Needles, CA', lat: 34.8481, lng: -114.6140 },
        { name: 'Flagstaff, AZ', lat: 35.1983, lng: -111.6513 }
      ];

      const routes = await this.scenicService.getScenicRoutes(waypoints, {
        preferRoute66: true,
        photographyFriendly: true
      });

      const route66Route = routes.find(r => r.name.includes('Route 66'));
      const success = routes.length > 0 && route66Route !== undefined;

      return {
        testName: 'Route 66 Scenic Routing',
        success,
        duration: Date.now() - startTime,
        details: {
          routeCount: routes.length,
          hasRoute66Route: !!route66Route,
          route66Details: route66Route ? {
            name: route66Route.name,
            distance: route66Route.distance,
            warnings: route66Route.warnings
          } : null
        }
      };
    } catch (error) {
      return {
        testName: 'Route 66 Scenic Routing',
        success: false,
        duration: Date.now() - startTime,
        details: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testWeatherBasedRouting(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const waypoints: Waypoint[] = [
        { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
        { name: 'Las Vegas, NV', lat: 36.1716, lng: -115.1391 }
      ];

      const extremeHeatWeather = {
        temperature: 115,
        condition: 'extreme_heat' as const,
        season: 'summer' as const
      };

      const routes = await this.scenicService.getWeatherOptimizedRoute(
        waypoints, 
        extremeHeatWeather
      );

      // Should have heat-related warnings
      const hasHeatWarnings = routes.some(route => 
        route.warnings.some(warning => 
          warning.includes('heat') || warning.includes('water')
        )
      );

      const success = routes.length > 0 && hasHeatWarnings;

      return {
        testName: 'Weather-based Re-routing',
        success,
        duration: Date.now() - startTime,
        details: {
          routeCount: routes.length,
          hasHeatWarnings,
          warnings: routes.flatMap(r => r.warnings)
        }
      };
    } catch (error) {
      return {
        testName: 'Weather-based Re-routing',
        success: false,
        duration: Date.now() - startTime,
        details: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testFuelRangeCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const startPoint: Waypoint = { name: 'Las Vegas, NV', lat: 36.1716, lng: -115.1391 };
      
      const fuelRange = this.scenicService.calculateFuelRange(
        startPoint,
        25, // MPG
        15, // tank capacity
        0.25 // safety margin
      );

      const success = fuelRange.maxRange > 0 && 
                     fuelRange.recommendedRange > 0 && 
                     fuelRange.fuelStops.length >= 0;

      return {
        testName: 'Fuel Range Calculator',
        success,
        duration: Date.now() - startTime,
        details: {
          maxRange: fuelRange.maxRange,
          recommendedRange: fuelRange.recommendedRange,
          fuelStopsCount: fuelRange.fuelStops.length,
          fuelStops: fuelRange.fuelStops.map(stop => stop.name)
        }
      };
    } catch (error) {
      return {
        testName: 'Fuel Range Calculator',
        success: false,
        duration: Date.now() - startTime,
        details: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testElevationProfileAnalysis(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const waypoints: Waypoint[] = [
        { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
        { name: 'Yosemite National Park, CA', lat: 37.8651, lng: -119.5383 }
      ];

      const routes = await this.scenicService.getScenicRoutes(waypoints);
      const routeWithElevation = routes.find(r => r.elevation);

      const success = routeWithElevation !== undefined && 
                     routeWithElevation.elevation!.max > routeWithElevation.elevation!.min;

      return {
        testName: 'Elevation Profile Analysis',
        success,
        duration: Date.now() - startTime,
        details: {
          hasElevationData: !!routeWithElevation,
          elevation: routeWithElevation?.elevation || null,
          difficulty: routeWithElevation?.difficulty || null
        }
      };
    } catch (error) {
      return {
        testName: 'Elevation Profile Analysis',
        success: false,
        duration: Date.now() - startTime,
        details: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getExpectedLocationForQuery(query: string): string {
    const expectations: Record<string, string> = {
      'Las Vegas Strip': 'Las Vegas, NV',
      'Grand Canyon': 'Grand Canyon National Park, AZ',
      'Route 66': 'Historic Route 66',
      'Death Valley': 'Death Valley National Park, CA'
    };

    return expectations[query] || 'Southwest USA';
  }

  private printTestSummary(results: TestResult[]): void {
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;

    console.log(`\n🧪 Regional Feature Test Summary:`);
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`⏱️ Average Duration: ${avgDuration.toFixed(0)}ms`);
    console.log(`\nTest Results:`);

    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      console.log(`${status} ${result.testName} (${duration})`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    if (passed === total) {
      console.log(`\n🎉 All regional features working correctly!`);
    } else {
      console.log(`\n⚠️ ${total - passed} tests failed - check implementation`);
    }
  }
}
