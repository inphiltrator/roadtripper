import { json } from '@sveltejs/kit';
import { config } from '$lib/config/env';
import type { RequestHandler } from './$types';
import type { Waypoint, RoutingOptions } from '$lib/types';

// Helper function to build Google Maps Routes API request body
const buildRequestBody = (waypoints: Waypoint[], options: RoutingOptions = {}) => {
  if (waypoints.length < 2) {
    throw new Error('At least 2 waypoints are required');
  }

  return {
    origin: {
      location: {
        latLng: {
          latitude: waypoints[0].lat,
          longitude: waypoints[0].lng
        }
      }
    },
    destination: {
      location: {
        latLng: {
          latitude: waypoints[waypoints.length - 1].lat,
          longitude: waypoints[waypoints.length - 1].lng
        }
      }
    },
    // Add intermediate waypoints if more than 2
    ...(waypoints.length > 2 && {
      intermediates: waypoints.slice(1, -1).map(wp => ({
        location: {
          latLng: {
            latitude: wp.lat,
            longitude: wp.lng
          }
        }
      }))
    }),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: options.computeAlternativeRoutes || false,
    routeModifiers: {
      avoidTolls: options.avoidTolls || false,
      avoidHighways: options.avoidHighways || false,
      avoidFerries: options.avoidFerries || false
    }
  };
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { waypoints, options } = await request.json();

    // Validate API key
    if (!config.google.apiKey || config.google.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.error('Google Maps API key not configured');
      return json({ 
        error: 'Google Maps API key not configured',
        fallback: true,
        routes: [] // Return empty routes for fallback
      }, { status: 200 });
    }

    const requestBody = buildRequestBody(waypoints, options);
    
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': config.google.apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google Maps API error:', response.status, errorBody);
      
      // Return fallback response instead of 500 error
      return json({ 
        error: `Google Maps API error: ${response.status}`,
        fallback: true,
        routes: []
      }, { status: 200 });
    }

    const data = await response.json();
    console.log('Google Maps API success:', data.routes?.length || 0, 'routes returned');
    return json(data);
    
  } catch (error) {
    console.error('Routing API error:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
      routes: []
    }, { status: 200 });
  }
};

