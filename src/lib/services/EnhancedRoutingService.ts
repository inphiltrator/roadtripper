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
   * Processes the response from our proxy routing API which already has the correct Route format.
   * @param data The response data from our proxy API.
   * @param waypoints The original waypoints for context.
   * @returns An array of processed routes.
   */
  private processRouteResponse(data: any, waypoints: Waypoint[]): Route[] {
    // The proxy already returns data in the correct format with routes array
    if (!data.routes || !Array.isArray(data.routes)) {
      console.warn('Invalid response format from routing proxy');
      return [];
    }

    // Validate and return the routes - they're already in our Route format
    return data.routes.map((route: any, index: number) => {
      // Ensure all required fields are present
      const processedRoute: Route = {
        id: route.id || `route_${index}`,
        name: route.name || `Route ${index + 1}`,
        distance: route.distance || 0,
        duration: route.duration || 0,
        waypoints: route.waypoints || waypoints,
        geometry: route.geometry || {
          type: 'LineString',
          coordinates: []
        },
        instructions: route.instructions || [],
        warnings: route.warnings || [],
        routeType: route.routeType || 'interstate',
        difficulty: route.difficulty || 'moderate'
      };
      
      return processedRoute;
    });
  }
}
