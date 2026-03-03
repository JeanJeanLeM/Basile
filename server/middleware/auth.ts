import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!jwtSecret) {
  console.warn('SUPABASE_JWT_SECRET not set');
}

export interface AuthPayload {
  sub: string;
  role?: string;
  email?: string;
}

export function checkJwt(req: Request, res: Response, next: NextFunction): void {
  if (!jwtSecret) {
    res.status(503).json({ error: 'Auth not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
    }) as AuthPayload & { iss?: string; exp?: number };
    (req as Request & { auth?: { payload: AuthPayload } }).auth = { payload: { sub: decoded.sub, role: decoded.role, email: decoded.email } };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function getUserId(req: Request & { auth?: { payload?: AuthPayload } }): string {
  const sub = req.auth?.payload?.sub;
  if (!sub) throw new Error('Unauthorized');
  return sub;
}
