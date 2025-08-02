import { EnhancedRoutingService } from './EnhancedRoutingService';
import { RegionalService } from './RegionalService';
import type { Route, Waypoint } from '$lib/types';
import { config } from '$lib/config/env';

export interface ScenicOptions {
  preferRoute66?: boolean;
  includeNationalParks?: boolean;
  avoidExtremeHeat?: boolean;
  photographyFriendly?: boolean;
  allowGravelRoads?: boolean;
}

export interface WeatherCondition {
  temperature: number; // Fahrenheit
  condition: 'extreme_heat' | 'hot' | 'moderate' | 'cold';
  season: 'summer' | 'winter' | 'spring' | 'fall';
}

export class ScenicRoutingService extends EnhancedRoutingService {
  private regionalService: RegionalService;
  private route66Waypoints: Waypoint[];
  private nationalParkLocations: Waypoint[];

  constructor(apiKey?: string) {
    super(apiKey);
    this.regionalService = new RegionalService();
    this.initializeScenicWaypoints();
    console.log('🏜️ Scenic Routing Service initialized for Southwest USA');
  }

  /**
   * Get scenic route alternatives with Southwest-specific preferences
   */
  async getScenicRoutes(
    waypoints: Waypoint[], 
    options: ScenicOptions = {}
  ): Promise<Route[]> {
    // Validate regional compliance first
    const validation = this.regionalService.validateRouteWaypoints(waypoints);
    if (!validation.valid) {
      console.warn('Route validation warnings:', validation.warnings);
      if (validation.errors.length > 0) {
        throw new Error(`Route validation failed: ${validation.errors.join(', ')}`);
      }
    }

    try {
      const routes = await this.getMultipleRouteProfiles(waypoints, options);
      return this.enhanceWithScenicData(routes, options);
    } catch (error) {
      console.error('Scenic routing failed:', error);
      return this.getSampleScenicRoutes(waypoints, options);
    }
  }

  /**
   * Get route with weather-based re-routing
   */
  async getWeatherOptimizedRoute(
    waypoints: Waypoint[],
    currentWeather: WeatherCondition,
    options: ScenicOptions = {}
  ): Promise<Route[]> {
    // Adjust options based on weather
    const weatherAdjustedOptions = this.adjustOptionsForWeather(options, currentWeather);
    
    return this.getScenicRoutes(waypoints, weatherAdjustedOptions);
  }

  /**
   * Calculate fuel range considering Southwest conditions
   */
  calculateFuelRange(
    startPoint: Waypoint,
    vehicleMPG: number = 25,
    tankCapacity: number = 15, // gallons
    safetyMargin: number = 0.25
  ): {
    maxRange: number; // miles
    recommendedRange: number; // miles with safety margin
    fuelStops: Waypoint[];
  } {
    const maxRange = vehicleMPG * tankCapacity;
    const recommendedRange = maxRange * (1 - safetyMargin);

    // Get fuel stops in Southwest region
    const fuelStops = this.getFuelStopsInRange(startPoint, recommendedRange);

    return {
      maxRange,
      recommendedRange,
      fuelStops
    };
  }

  /**
   * Get sunrise/sunset times for photography planning
   */
  getSunriseSunsetTimes(location: Waypoint, date: Date = new Date()): {
    sunrise: Date;
    sunset: Date;
    goldenHourStart: Date;
    goldenHourEnd: Date;
    blueHourStart: Date;
    blueHourEnd: Date;
  } {
    // Simplified calculation - in production, use a proper astronomy library
    const { lat, lng } = location;
    const dayOfYear = this.getDayOfYear(date);
    
    // Approximate sunrise/sunset calculation
    const sunriseHour = 6 + Math.sin((dayOfYear - 81) * 2 * Math.PI / 365) * 1.5;
    const sunsetHour = 18 - Math.sin((dayOfYear - 81) * 2 * Math.PI / 365) * 1.5;
    
    const sunrise = new Date(date);
    sunrise.setHours(Math.floor(sunriseHour), (sunriseHour % 1) * 60);
    
    const sunset = new Date(date);
    sunset.setHours(Math.floor(sunsetHour), (sunsetHour % 1) * 60);
    
    // Golden hour (1 hour after sunrise, 1 hour before sunset)
    const goldenHourStart = new Date(sunrise.getTime() + 60 * 60 * 1000);
    const goldenHourEnd = new Date(sunset.getTime() - 60 * 60 * 1000);
    
    // Blue hour (30 min before sunrise, 30 min after sunset)
    const blueHourStart = new Date(sunrise.getTime() - 30 * 60 * 1000);
    const blueHourEnd = new Date(sunset.getTime() + 30 * 60 * 1000);

    return {
      sunrise,
      sunset,
      goldenHourStart,
      goldenHourEnd,
      blueHourStart,
      blueHourEnd
    };
  }

  private async getMultipleRouteProfiles(waypoints: Waypoint[], options: ScenicOptions): Promise<Route[]> {
    const profiles = this.buildRouteProfiles(options);
    const allRoutes: Route[] = [];

    for (const profile of profiles) {
      try {
        const coordinates = waypoints.map(wp => [wp.lng, wp.lat]);
        const response = await fetch(`${this.baseUrl}/directions/driving-car/geojson`, {
          method: 'POST',
          headers: {
            'Authorization': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/geo+json'
          },
          body: JSON.stringify({
            coordinates,
            ...profile,
            ...this.regionalService.getRouteRestrictions(),
            instructions: true,
            maneuvers: true,
            geometry: true,
            elevation: true,
            extra_info: ['tollways', 'roadaccessrestrictions', 'surface', 'steepness']
          })
        });

        if (response.ok) {
          const data = await response.json();
          const routes = this.processRouteResponse(data, waypoints);
          allRoutes.push(...routes);
        }
      } catch (error) {
        console.warn(`Failed to get route for profile ${profile.profile}:`, error);
      }
    }

    return allRoutes.length > 0 ? allRoutes : await super.getRouteAlternatives(waypoints, 3);
  }

  private buildRouteProfiles(options: ScenicOptions): any[] {
    const profiles = [];

    // Fastest route (baseline)
    profiles.push({
      profile: 'driving-car',
      preference: 'fastest',
      options: {
        avoid_features: options.avoidExtremeHeat ? ['highways'] : []
      }
    });

    // Scenic route
    profiles.push({
      profile: 'driving-car',
      preference: 'recommended',
      options: {
        avoid_features: ['highways'],
        avoid_roads: options.avoidExtremeHeat ? ['trunk'] : []
      }
    });

    // Historic Route 66 preference
    if (options.preferRoute66) {
      profiles.push({
        profile: 'driving-car',
        preference: 'recommended',
        options: {
          avoid_features: ['highways', 'tollways'],
          avoid_roads: ['motorway'],
          // Bias towards historic routes
          route_preference: 'historic'
        }
      });
    }

    // National Parks routing
    if (options.includeNationalParks) {
      profiles.push({
        profile: 'driving-car',
        preference: 'recommended',
        options: {
          avoid_features: ['tollways'],
          avoid_roads: [],
          // Route through scenic areas
          route_preference: 'scenic'
        }
      });
    }

    return profiles;
  }

  private enhanceWithScenicData(routes: Route[], options: ScenicOptions): Route[] {
    return routes.map((route, index) => {
      const enhanced = { ...route };

      // Add scenic-specific naming
      if (options.preferRoute66 && index === 2) {
        enhanced.name = 'Historic Route 66';
        enhanced.routeType = 'scenic';
      } else if (options.includeNationalParks && index === 3) {
        enhanced.name = 'National Parks Route';
        enhanced.routeType = 'scenic';
      }

      // Add Southwest-specific warnings
      enhanced.warnings = [
        ...enhanced.warnings,
        ...this.getSouthwestSpecificWarnings(route, options)
      ];

      // Adjust difficulty for desert conditions
      if (enhanced.elevation?.max && enhanced.elevation.max > 7000) {
        enhanced.warnings.push('High altitude - check vehicle performance');
      }

      return enhanced;
    });
  }

  private getSouthwestSpecificWarnings(route: Route, options: ScenicOptions): string[] {
    const warnings: string[] = [];
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // Summer heat warnings (June-September)
    if (currentMonth >= 6 && currentMonth <= 9 && !options.avoidExtremeHeat) {
      warnings.push('⚠️ Extreme heat conditions - travel early morning or evening');
      warnings.push('Carry extra water and check vehicle cooling system');
    }

    // Winter mountain pass warnings (December-February)
    if (currentMonth >= 12 || currentMonth <= 2) {
      if (route.elevation?.max && route.elevation.max > 5000) {
        warnings.push('❄️ Mountain passes may have snow/ice - check road conditions');
        warnings.push('Carry tire chains and emergency supplies');
      }
    }

    // Desert crossing warnings
    if (route.distance > 100) {
      warnings.push('🏜️ Long desert crossing - ensure adequate fuel and water');
    }

    // Cell coverage warnings for remote areas
    if (route.routeType === 'backcountry') {
      warnings.push('📵 Limited cell coverage in remote desert areas');
    }

    return warnings;
  }

  private adjustOptionsForWeather(options: ScenicOptions, weather: WeatherCondition): ScenicOptions {
    const adjusted = { ...options };

    if (weather.condition === 'extreme_heat') {
      adjusted.avoidExtremeHeat = true;
    }

    if (weather.season === 'winter' && weather.temperature < 40) {
      adjusted.allowGravelRoads = false; // Avoid unpaved roads in winter
    }

    return adjusted;
  }

  private getSampleScenicRoutes(waypoints: Waypoint[], options: ScenicOptions): Route[] {
    if (waypoints.length < 2) return [];
    
    const baseRoutes = this.getSampleRoutes(waypoints);
    
    // Add scenic-specific sample routes
    const scenicRoute: Route = {
      ...baseRoutes[1], // Use scenic sample as base
      id: 'sample_southwest_scenic',
      name: options.preferRoute66 ? 'Historic Route 66 Scenic' : 'Southwest Desert Scenic',
      warnings: [
        'Scenic route with desert views',
        ...this.getSouthwestSpecificWarnings(baseRoutes[1], options)
      ],
      routeType: 'scenic'
    };

    return [baseRoutes[0], scenicRoute];
  }

  private initializeScenicWaypoints(): void {
    // Historic Route 66 key waypoints
    this.route66Waypoints = [
      { name: 'Santa Monica Pier, CA', lat: 34.0085, lng: -118.4987 },
      { name: 'Barstow, CA', lat: 34.8958, lng: -117.0228 },
      { name: 'Needles, CA', lat: 34.8481, lng: -114.6140 },
      { name: 'Kingman, AZ', lat: 35.1894, lng: -114.0530 },
      { name: 'Seligman, AZ', lat: 35.3256, lng: -112.8747 },
      { name: 'Flagstaff, AZ', lat: 35.1983, lng: -111.6513 }
    ];

    // National Parks in Southwest
    this.nationalParkLocations = [
      { name: 'Grand Canyon National Park', lat: 36.1069, lng: -112.1129 },
      { name: 'Zion National Park', lat: 37.2982, lng: -113.0263 },
      { name: 'Bryce Canyon National Park', lat: 37.5930, lng: -112.1871 },
      { name: 'Death Valley National Park', lat: 36.5054, lng: -117.0794 },
      { name: 'Joshua Tree National Park', lat: 33.8734, lng: -115.9010 },
      { name: 'Yosemite National Park', lat: 37.8651, lng: -119.5383 }
    ];
  }

  private getFuelStopsInRange(center: Waypoint, rangeRadius: number): Waypoint[] {
    // Sample fuel stops - in production, query from POI service
    const fuelStops: Waypoint[] = [
      { name: 'Travel Center - Barstow', lat: 34.8958, lng: -117.0228 },
      { name: 'Gas Station - Needles', lat: 34.8481, lng: -114.6140 },
      { name: 'Fuel Depot - Kingman', lat: 35.1894, lng: -114.0530 },
      { name: 'Travel Plaza - Flagstaff', lat: 35.1983, lng: -111.6513 }
    ];

    // Filter by range (simplified - use proper distance calculation in production)
    return fuelStops.filter(stop => {
      const distance = this.regionalService['calculateDistance'](
        center.lat, center.lng, stop.lat, stop.lng
      );
      return distance <= rangeRadius * 1.609; // Convert miles to km
    });
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
