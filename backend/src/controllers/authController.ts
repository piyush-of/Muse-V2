import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../services/db';
import { config } from '../config';

/**
 * POST /auth/signup
 * Registers a new user and returns signed JWT
 */
export async function signup(req: Request, res: Response) {
  const { email, password, timezone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Create user and initialize a default StyleProfile record
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          timezone: timezone || "UTC"
        }
      });

      // Default traits (centered at 0.5) and empty colors list
      await tx.styleProfile.create({
        data: {
          userId: newUser.id,
          traits: {
            "relaxed-structured": 0.5,
            "neutral-bold": 0.5,
            "minimal-maximal": 0.5,
            "heritage-modern": 0.5
          },
          topColors: []
        }
      });

      return newUser;
    });

    // Sign JWT token
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        timezone: user.timezone
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /auth/login
 * Authenticates user credentials and returns JWT
 */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Sign token
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        timezone: user.timezone
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
