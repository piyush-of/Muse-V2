'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

/**
 * Server Action to register a new user in the PostgreSQL database.
 */
export async function registerUser(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  // Validate inputs
  const validation = signupSchema.safeParse({ email, password, name });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation failed' };
  }

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, error: 'A user with this email already exists' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and style DNA inside a transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
        },
      });

      // Default traits (centered at 0.5) and empty colors list
      await tx.styleProfile.create({
        data: {
          userId: user.id,
          traits: {
            'relaxed-structured': 0.5,
            'neutral-bold': 0.5,
            'minimal-maximal': 0.5,
            'heritage-modern': 0.5,
          },
          topColors: [],
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { success: false, error: error.message || 'Authentication failed' };
  }
}
