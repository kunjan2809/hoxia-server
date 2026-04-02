// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { z } from 'zod';
import type { Request, Response } from 'express';

// Utils
import { sendBadRequest } from './response.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type RequestTarget = 'body' | 'query' | 'params';

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false };

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getTargetValue = (req: Request, target: RequestTarget): unknown => {
  switch (target) {
    case 'body':
      return req.body;
    case 'query':
      return req.query;
    case 'params':
      return req.params;
    default:
      return req.body;
  }
};

export const validateRequest = async <T extends z.ZodSchema>(
  schema: T,
  req: Request,
  res: Response,
  target: RequestTarget
): Promise<ValidationResult<z.infer<T>>> => {
  try {
    const validated = await schema.parseAsync(getTargetValue(req, target));

    if (target === 'body') req.body = validated;
    if (target === 'query') req.query = validated as unknown as Request['query'];
    if (target === 'params') req.params = validated as unknown as Request['params'];

    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      sendBadRequest(res, 'Validation failed', errors);
      return { success: false };
    }

    throw error;
  }
};

