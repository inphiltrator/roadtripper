// Central type definitions for Southwest USA Roadtripper
// Based on Google Maps Routes API v2 response format

export interface Waypoint {
  name: string;
  lat: number;
  lng: number;
  elevation?: number;
  address?: string;
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat] pairs
}

export interface RouteElevation {
  gain: number;  // in feet
  loss: number;  // in feet  
  max: number;   // in feet
  min: number;   // in feet
}

export interface RouteInstruction {
  text: string;
  distance: number; // in miles
  duration: number; // in minutes
  maneuver?: string;
}

export interface Route {
  id: string;
  name: string;
  distance: number;     // in miles
  duration: number;     // in minutes
  waypoints: Waypoint[];
  geometry: RouteGeometry;
  instructions: RouteInstruction[];
  warnings: string[];
  routeType: 'interstate' | 'scenic' | 'backcountry';
  difficulty: 'easy' | 'moderate' | 'challenging';
  elevation?: RouteElevation;
}

export interface RoutingOptions {
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  computeAlternativeRoutes?: boolean;
}

// Google Maps Routes API v2 Response Types
export interface GoogleMapsRoute {
  distanceMeters: number;
  duration: string;       // e.g. "3600s"
  polyline: {
    encodedPolyline: string;
  };
  legs?: Array<{
    distanceMeters: number;
    duration: string;
    startLocation: {
      latLng: {
        latitude: number;
        longitude: number;
      };
    };
    endLocation: {
      latLng: {
        latitude: number;
        longitude: number;
      };
    };
  }>;
}

export interface GoogleMapsRoutesResponse {
  routes: GoogleMapsRoute[];
}

// POI and Geographic Types
export interface POI {
  id: string;
  name: string;
  category: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  rating?: number;
  description?: string;
  photos?: string[];
  website?: string;
  phone?: string;
  address?: string;
}

export interface RegionalBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Scenic Routing Types
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

// Utility Types
export type LatLng = {
  lat: number;
  lng: number;
};

export type Coordinates = [number, number]; // [lng, lat]
