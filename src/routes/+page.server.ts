import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { MapBoxGeocodingService } from '$lib/services/MapBoxGeocodingService';
import { decodePolyline, routeToGeoJSON } from '$lib/utils/polyline';

const PERMANENT_USER_EMAIL = 'user@roadtripper.dev';

export const load: PageServerLoad = async () => {
  const user = await prisma.user.findUnique({
    where: { email: PERMANENT_USER_EMAIL },
  });
  return {
    user,
  };
};

export const actions: Actions = {
  calculateRoute: async ({ request, fetch }) => {
    const user = await prisma.user.findUnique({
      where: { email: PERMANENT_USER_EMAIL },
    });

    if (!user) {
      return fail(500, { error: 'Permanent user not found. Please seed the database.' });
    }

    const formData = await request.formData();
    const startLocation = formData.get('start') as string;
    const endLocation = formData.get('end') as string;

    if (!startLocation || !endLocation) {
      return fail(400, { error: 'Start and end locations are required' });
    }

    const geocodingService = new MapBoxGeocodingService();
    const [startResults, endResults] = await Promise.all([
      geocodingService.searchPlaces(startLocation, { limit: 1 }),
      geocodingService.searchPlaces(endLocation, { limit: 1 }),
    ]);

    if (startResults.length === 0 || endResults.length === 0) {
      return fail(400, { error: 'Could not find coordinates for one or both locations' });
    }

    const waypoints = [
      { lat: startResults[0].coordinates[1], lng: startResults[0].coordinates[0], name: startLocation },
      { lat: endResults[0].coordinates[1], lng: endResults[0].coordinates[0], name: endLocation },
    ];

    const routeResponse = await fetch('/api/proxy/routing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waypoints }),
    });

    if (!routeResponse.ok) {
      console.error('Failed to fetch route from proxy');
      return fail(500, { error: 'Failed to calculate route' });
    }

    const routeData = await routeResponse.json();

    if (!routeData.routes || routeData.routes.length === 0) {
        return fail(500, { error: 'No routes found between the specified locations' });
    }

    try {
      const newTrip = await prisma.trip.create({
        data: {
          name: `${startLocation} to ${endLocation}`,
          ownerId: user.id,
        },
      });

      console.log(`Trip saved with ID: ${newTrip.id}`);

      // Convert Google Maps route to GeoJSON format for map display
      const googleRoute = routeData.routes[0];
      console.log('🔍 Google Route structure:', JSON.stringify(googleRoute, null, 2));
      
      const routeGeoJSON = routeToGeoJSON(googleRoute);
      console.log('🗺️ Converted to GeoJSON:', {
        type: routeGeoJSON.type,
        geometryType: routeGeoJSON.geometry.type,
        coordinatesLength: routeGeoJSON.geometry.coordinates.length,
        firstCoordinate: routeGeoJSON.geometry.coordinates[0],
        lastCoordinate: routeGeoJSON.geometry.coordinates[routeGeoJSON.geometry.coordinates.length - 1]
      });

      return {
        success: true,
        route: routeGeoJSON,
        tripId: newTrip.id,
      };
    } catch (error) {
      console.error('Failed to save trip', error);
      return fail(500, { error: 'Failed to save trip to the database' });
    }
  },
};

