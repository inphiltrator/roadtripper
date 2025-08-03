import { json } from '@sveltejs/kit';
import { config } from '$lib/config/env';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { waypoints, options } = await request.json();

    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': config.google.apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
      },
      body: JSON.stringify({
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
              latitude: waypoints[1].lat,
              longitude: waypoints[1].lng
            }
          }
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: true,
        routeModifiers: {
          avoidTolls: options?.avoidTolls || false,
          avoidHighways: options?.avoidHighways || false,
          avoidFerries: options?.avoidFerries || false
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google Maps API error:', errorBody);
      return json({ error: 'Failed to retrieve routing data' }, { status: 500 });
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error('Routing API error:', error);
    return json({ error: 'Failed to retrieve routing data' }, { status: 500 });
  }
};

