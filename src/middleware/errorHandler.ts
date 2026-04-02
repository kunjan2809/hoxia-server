// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';

// Project Utilities
import { createLogger } from '../utils/helpers/logger.js';
import { sendError } from '../utils/helpers/response.js';

// Prisma
import { Prisma } from '../generated/prisma/client.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AppError extends Error {
  statusCode?: number;
  errors?: Array<{ field: string; message: string }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('ErrorHandler');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const handlePrismaError = (
  err: unknown
): { statusCode: number; message: string; errors?: Array<{ field: string; message: string }> } => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) {
    return { statusCode: 500, message: 'Database operation failed' };
  }

  if (err.code === 'P2002') {
    const targets = (err.meta?.['target'] ?? []) as unknown;
    const fields = Array.isArray(targets) ? (targets as string[]) : [];
    return {
      statusCode: 409,
      message: 'A record with this value already exists',
      errors: fields.map((field) => ({ field, message: `${field} must be unique` })),
    };
  }

  if (err.code === 'P2025') {
    return { statusCode: 404, message: 'Record not found' };
  }

  logger.error(`Unhandled Prisma error [${err.code}]: ${err.message}`, err);
  return { statusCode: 500, message: 'Database operation failed' };
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

export const errorHandler = (err: AppError, _req: Request, res: Response, _next: NextFunction): void => {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    const prismaError = handlePrismaError(err);
    sendError(res, prismaError.message, prismaError.statusCode, prismaError.errors);
    return;
  }

  logger.error(err.message, err);

  const statusCode = err.statusCode ?? 500;
  const message = err.message || 'Internal server error';

  sendError(res, message, statusCode, err.errors);
};

