import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';

const PERMANENT_USER_EMAIL = 'user@roadtripper.dev';

export const load: PageServerLoad = async () => {
  // Load the permanent user for the page
  const user = await prisma.user.findUnique({
    where: { email: PERMANENT_USER_EMAIL },
  });
  return {
    user,
  };
};

export const actions: Actions = {
  default: async ({ request, fetch }) => {
    // 1. Get the permanent user directly from the database
    const user = await prisma.user.findUnique({
      where: { email: PERMANENT_USER_EMAIL },
    });

    if (!user) {
      return fail(500, { error: 'Permanent user not found. Please seed the database.' });
    }

    const formData = await request.formData();
    const start = formData.get('start') as string;
    const end = formData.get('end') as string;

    if (!start || !end) {
      return fail(400, { error: 'Start and end locations are required' });
    }

    // 2. Fetch the route geometry
    const routeResponse = await fetch('/api/proxy/routing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start, end }),
    });

    if (!routeResponse.ok) {
      console.error('Failed to fetch route from proxy');
      return fail(500, { error: 'Failed to calculate route' });
    }

    const routeData = await routeResponse.json();

    // 3. Save the new trip to the database for the permanent user
    try {
      const newTrip = await prisma.trip.create({
        data: {
          name: `${start} to ${end}`,
          ownerId: user.id,
        },
      });

      console.log(`Trip saved with ID: ${newTrip.id}`);

      // 4. Return the route data to the client
      return {
        success: true,
        route: routeData,
        tripId: newTrip.id,
      };
    } catch (error) {
      console.error('Failed to save trip', error);
      return fail(500, { error: 'Failed to save trip to the database' });
    }
  },
};

