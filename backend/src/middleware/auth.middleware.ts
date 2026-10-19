import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../store/datastore';
import { User, UserRole } from '../types/models';

export const JWT_SECRET = process.env.JWT_SECRET || 'friends-app-super-secret-jwt-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith('friends_session=')) {
        return decodeURIComponent(c.substring('friends_session='.length));
      }
    }
  }
  return null;
}

export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing or invalid session / Authorization token' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.users.get(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'User account not found' });
      return;
    }

    if (user.status === 'BLOCKED') {
      res.status(403).json({
        error: 'Your account has been blocked by the Super Admin.',
        code: 'ACCOUNT_BLOCKED',
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired JWT token' });
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
      return;
    }
    next();
  };
}
