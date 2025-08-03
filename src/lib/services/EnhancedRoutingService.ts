import { config } from '$lib/config/env';
import type { Route, Waypoint } from '$lib/types';

/**
 * A service class to interact with the Google Maps Routes API.
 */
export class EnhancedRoutingService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.google.apiKey;
    if (!this.apiKey) {
      console.error('Google Maps API key is not configured!');
    }
    console.log('🗺️ Google Maps Routing Service configured.');
  }

  /**
   * Fetches route alternatives from the backend proxy which calls the Google Maps Routes API.
   * @param waypoints An array of waypoints to calculate routes for.
   * @param options Routing options like avoiding tolls or highways.
   * @returns A promise that resolves to an array of routes.
   */
  async getRouteAlternatives(waypoints: Waypoint[], options: { avoidTolls?: boolean; avoidHighways?: boolean; avoidFerries?: boolean } = {}): Promise<Route[]> {
    if (waypoints.length < 2) {
      throw new Error('At least two waypoints are required for routing.');
    }

    try {
      const response = await fetch('/api/proxy/routing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ waypoints, options }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch route from proxy: ${response.statusText}`, errorText);
        return [];
      }

      const data = await response.json();
      return this.processRouteResponse(data, waypoints);
    } catch (error) {
      console.error('Error fetching route alternatives:', error);
      return [];
    }
  }

  /**
   * Processes the raw response from the Google Maps Routes API into the application's Route format.
   * @param data The raw data from the API.
   * @param waypoints The original waypoints for context.
   * @returns An array of processed routes.
   */
  private processRouteResponse(data: any, waypoints: Waypoint[]): Route[] {
    if (!data.routes || !Array.isArray(data.routes)) {
      return [];
    }

    return data.routes.map((route: any, index: number) => {
      const newRoute: Route = {
        id: `google_route_${index}`,
        name: `Route ${index + 1}`,
        distance: route.distanceMeters / 1609.34, // Convert meters to miles
        duration: parseInt(route.duration.slice(0, -1)) / 60, // Convert seconds string to minutes
        waypoints: waypoints,
        geometry: {
          type: 'LineString',
          coordinates: route.polyline.geoJsonLinestring.coordinates,
        },
        instructions: [], // Google Routes API does not provide instructions in this basic response
        warnings: [],     // Or warnings
        routeType: 'interstate', // Default type
        difficulty: 'moderate',  // Default difficulty
      };
      return newRoute;
    });
  }
}
