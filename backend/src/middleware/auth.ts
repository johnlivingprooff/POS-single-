import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/authRequest';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('Access denied: No token provided.');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    // Check token expiration
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      console.log('Access denied: Token has expired.');
      return res.status(401).json({ error: 'Access denied. Token has expired.' });
    }

    console.log(`Token validated for user: ${decoded.email}`);
    req.user = decoded;
    return next();
  } catch (error) {
    const err = error as Error;
    console.error('Invalid token:', err.message);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log('Access denied: Not authenticated.');
      return res.status(401).json({ error: 'Access denied. Not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('Access denied: Insufficient permissions.');
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    return next();
  };
};
