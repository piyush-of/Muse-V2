'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Returns today's calendar-note context for the signed-in user, creating an
 * empty one if it doesn't exist yet.
 */
export async function getTodayContext() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  const userId = session.user.id;
  const date = todayStr();

  try {
    const context = await prisma.dailyContext.upsert({
      where: { userId_date: { userId, date } },
      update: {},
      create: { userId, date, calendarEvent: '' },
    });

    return { success: true, calendarEvent: context.calendarEvent };
  } catch (error: any) {
    console.error('getTodayContext error:', error);
    return { success: false, error: error.message || "Failed to load today's context" };
  }
}

/**
 * Updates today's calendar-note context. This only affects outfits compiled
 * after this call — use regenerateTodayCapsule() (in actions/capsule.ts) to
 * force a recompile against the new note right away.
 */
export async function updateTodayContext(calendarEvent: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  const userId = session.user.id;
  const date = todayStr();

  try {
    await prisma.dailyContext.upsert({
      where: { userId_date: { userId, date } },
      update: { calendarEvent },
      create: { userId, date, calendarEvent },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('updateTodayContext error:', error);
    return { success: false, error: error.message || "Failed to save today's context" };
  }
}
