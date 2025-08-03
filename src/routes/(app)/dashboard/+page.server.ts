import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

const PERMANENT_USER_EMAIL = 'user@roadtripper.dev';

export const load: PageServerLoad = async () => {
  // 1. Get the permanent user
  const user = await prisma.user.findUnique({
    where: { email: PERMANENT_USER_EMAIL },
    include: {
      // 2. Include all their trips in the query
      trips: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return {
    trips: user?.trips ?? [],
  };
};

