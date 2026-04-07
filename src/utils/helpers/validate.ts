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
  target: RequestTarget,
  /** When set, parse this value instead of reading from req (and do not mutate req). Use for Express 5–safe query normalization. */
  sourceOverride?: unknown
): Promise<ValidationResult<z.infer<T>>> => {
  try {
    const raw = sourceOverride !== undefined ? sourceOverride : getTargetValue(req, target);
    const validated = await schema.parseAsync(raw);

    // Express 5: req.query and req.params are getters — assigning throws "Cannot set property query".
    // Callers must use the returned `data` from this helper.
    if (target === 'body' && sourceOverride === undefined) {
      req.body = validated as Request['body'];
    }

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

