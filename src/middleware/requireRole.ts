// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';

// Types
import type { UserRole } from '../generated/prisma/enums.js';

// Utils
import { sendForbidden, sendUnauthorized } from '../utils/helpers/response.js';

// ============================================================================
// FACTORY
// ============================================================================

export const requireRole = (allowedRoles: readonly UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Unauthorized');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendForbidden(res, 'Forbidden');
      return;
    }

    next();
  };
};

