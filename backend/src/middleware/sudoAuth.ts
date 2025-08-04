import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SudoAuthRequest extends Request {
  sudoUser?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const sudoAuth = async (req: SudoAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify this is a sudo user
    // @ts-ignore - Prisma client regeneration in progress
    const sudoUser = await prisma.sudoUser.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!sudoUser || !sudoUser.isActive || sudoUser.role !== 'sudo_admin') {
      return res.status(401).json({ error: 'Access denied. Invalid sudo credentials.' });
    }

    req.sudoUser = sudoUser;
    next();
    return;
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

export default sudoAuth;
