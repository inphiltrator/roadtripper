import { config } from '$lib/config/env';
import type { Waypoint } from '$lib/types';

export interface RegionalBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export class RegionalService {
  private readonly southwestBounds: RegionalBounds;
  private readonly maxRouteDistance: number = 5000; // 5000km limit
  private readonly restrictedCountries: string[] = ['MEX', 'CAN'];

  constructor() {
    this.southwestBounds = config.southwest.bounds;
    console.log('🌍 Regional Service initialized for Southwest USA');
  }

  /**
   * Check if coordinates are within Southwest USA region
   */
  isInSouthwestRegion(lat: number, lng: number): boolean {
    return (
      lat >= this.southwestBounds.south &&
      lat <= this.southwestBounds.north &&
      lng >= this.southwestBounds.west &&
      lng <= this.southwestBounds.east
    );
  }

  /**
   * Validate route waypoints for regional compliance
   */
  validateRouteWaypoints(waypoints: Waypoint[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if all waypoints are in Southwest region
    const outsideRegion = waypoints.filter(wp => !this.isInSouthwestRegion(wp.lat, wp.lng));
    if (outsideRegion.length > 0) {
      errors.push(`Route contains waypoints outside Southwest USA region: ${outsideRegion.map(wp => wp.name).join(', ')}`);
    }

    // Calculate total route distance estimate
    const totalDistance = this.estimateRouteDistance(waypoints);
    if (totalDistance > this.maxRouteDistance) {
      errors.push(`Route distance (${Math.round(totalDistance)}km) exceeds maximum limit of ${this.maxRouteDistance}km`);
    }

    // Add warnings for edge cases
    if (totalDistance > this.maxRouteDistance * 0.8) {
      warnings.push('Route is approaching maximum distance limit');
    }

    // Check for proximity to restricted borders
    const nearBorder = waypoints.filter(wp => this.isNearRestrictedBorder(wp.lat, wp.lng));
    if (nearBorder.length > 0) {
      warnings.push('Route passes near Mexico/Canada border - verify border crossing requirements');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get route restrictions for ORS API
   */
  getRouteRestrictions(): {
    avoid_countries: string[];
    maximum_distance: number;
    bounds?: number[];
  } {
    return {
      avoid_countries: this.restrictedCountries,
      maximum_distance: this.maxRouteDistance * 1000, // Convert to meters
      bounds: [
        this.southwestBounds.west,
        this.southwestBounds.south,
        this.southwestBounds.east,
        this.southwestBounds.north
      ]
    };
  }

  /**
   * Check if location is near restricted border (within 50km)
   */
  private isNearRestrictedBorder(lat: number, lng: number): boolean {
    const borderBuffer = 0.45; // ~50km buffer
    
    // Near Mexico border (southern boundary)
    if (lat <= this.southwestBounds.south + borderBuffer) {
      return true;
    }
    
    // Near Canada border (northern boundary - only relevant for northern Utah)
    if (lat >= this.southwestBounds.north - borderBuffer && lng > -114) {
      return true;
    }
    
    return false;
  }

  /**
   * Estimate total route distance using haversine formula
   */
  private estimateRouteDistance(waypoints: Waypoint[]): number {
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const current = waypoints[i];
      const next = waypoints[i + 1];
      totalDistance += this.calculateDistance(current.lat, current.lng, next.lat, next.lng);
    }

    return totalDistance;
  }

  /**
   * Calculate distance between two points in kilometers
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  /**
   * Get sample test routes for Southwest USA
   */
  getTestRoutes(): { name: string; waypoints: Waypoint[] }[] {
    return [
      {
        name: 'Los Angeles → Las Vegas (Classic)',
        waypoints: [
          { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
          { name: 'Las Vegas, NV', lat: 36.1716, lng: -115.1391 }
        ]
      },
      {
        name: 'Phoenix → Grand Canyon (Tourist Route)',
        waypoints: [
          { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
          { name: 'Grand Canyon National Park, AZ', lat: 36.1069, lng: -112.1129 }
        ]
      },
      {
        name: 'San Francisco → Yosemite (Mountain Pass)',
        waypoints: [
          { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
          { name: 'Yosemite National Park, CA', lat: 37.8651, lng: -119.5383 }
        ]
      },
      {
        name: 'Route 66 Segment (Needles → Flagstaff)',
        waypoints: [
          { name: 'Needles, CA', lat: 34.8481, lng: -114.6140 },
          { name: 'Flagstaff, AZ', lat: 35.1983, lng: -111.6513 }
        ]
      }
    ];
  }
}
