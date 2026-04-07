// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Config
import { prisma } from '../config/prisma.js';

// Utils
import { sendUnauthorized } from '../utils/helpers/response.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getAccessTokenFromRequest = (req: Request): string | undefined => {
  const cookieToken = (req.cookies as Record<string, unknown> | undefined)?.['access_token'] as string | undefined;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  return undefined;
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = getAccessTokenFromRequest(req);
    if (!token) {
      sendUnauthorized(res, 'Unauthorized');
      return;
    }

    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      throw Object.assign(new Error('JWT_SECRET is not configured'), { statusCode: 500 });
    }

    const decoded = jwt.verify(token, secret) as AccessTokenPayload;

    const user = await prisma.user.findFirst({
      where: { id: decoded.sub, isDeleted: false },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      sendUnauthorized(res, 'Unauthorized');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, 'Token expired');
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, 'Invalid or expired token');
      return;
    }
    if (error instanceof jwt.NotBeforeError) {
      sendUnauthorized(res, 'Token not active yet');
      return;
    }
    next(error);
  }
};

