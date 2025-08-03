import { json } from '@sveltejs/kit';
import { EnhancedRoutingService } from '$lib/services/EnhancedRoutingService';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { waypoints, options } = await request.json();

    const routingService = new EnhancedRoutingService();
    const routes = await routingService.getRouteAlternatives(waypoints);

    return json({ routes });
  } catch (error) {
    console.error('Routing API error:', error);
    return json({ error: 'Failed to retrieve routing data' }, { status: 500 });
  }
};

