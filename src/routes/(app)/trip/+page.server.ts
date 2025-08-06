import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

async function geocode(address: string, fetch: any) {
  const response = await fetch(`/api/proxy/geocoding?q=${encodeURIComponent(address)}`);
  if (!response.ok) {
    throw new Error(`Geocoding failed for ${address}`);
  }
  const data = await response.json();
  const feature = data.features[0];
  if (!feature) {
    throw new Error(`No results found for ${address}`);
  }
  const [lng, lat] = feature.center;
  return { lat, lng };
}

export const actions: Actions = {
  default: async ({ request, fetch }) => {
    const data = await request.formData();
    const startAddress = data.get('start') as string;
    const destinationAddress = data.get('destination') as string;

    if (!startAddress || !destinationAddress) {
      return fail(400, { start: startAddress, destination: destinationAddress, missing: true });
    }

    try {
      const startCoords = await geocode(startAddress, fetch);
      const destinationCoords = await geocode(destinationAddress, fetch);

      const waypoints = [
        { lat: startCoords.lat, lng: startCoords.lng },
        { lat: destinationCoords.lat, lng: destinationCoords.lng }
      ];

      const response = await fetch('/api/proxy/routing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ waypoints, options: {} })
      });

      if (!response.ok) {
        const error = await response.json();
        return fail(response.status, { start: startAddress, destination: destinationAddress, error: error.message });
      }

      const routeData = await response.json();
      
      // TODO: Re-enable POI integration after debugging
      // Temporarily disabled POI loading to isolate server errors
      const pois = [];

      return { success: true, route: routeData, pois };
    } catch (error: any) {
      return fail(500, { start: startAddress, destination: destinationAddress, error: error.message });
    }
  },
};

