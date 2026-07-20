'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Stores the user's coordinates so the capsule compiler can fetch real local
 * weather instead of falling back to the default city. Called once from the
 * client (via the browser Geolocation API) when no location is on file yet.
 */
export async function updateUserLocation(latitude: number, longitude: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { latitude, longitude },
    });
    return { success: true };
  } catch (error: any) {
    console.error('updateUserLocation error:', error);
    return { success: false, error: error.message || 'Failed to save location' };
  }
}
