// ============================================================================
// IMPORTS
// ============================================================================

// Types
import type { Response } from 'express';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiFieldError[];
}

// ============================================================================
// CLASS DEFINITIONS
// ============================================================================

export class ResponseHelper {
  static success<T>(res: Response, message: string, data?: T, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      ...(data !== undefined ? { data } : {}),
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return ResponseHelper.success(res, message, data, 201);
  }

  static error(res: Response, message: string, statusCode: number = 500, errors?: ApiFieldError[]): Response {
    const response: ApiResponse = {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string = 'Bad request', errors?: ApiFieldError[]): Response {
    return ResponseHelper.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return ResponseHelper.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return ResponseHelper.error(res, message, 403);
  }

  static notFound(res: Response, message: string = 'Not found'): Response {
    return ResponseHelper.error(res, message, 404);
  }

  static conflict(res: Response, message: string = 'Conflict'): Response {
    return ResponseHelper.error(res, message, 409);
  }

  static tooManyRequests(res: Response, message: string = 'Too many requests'): Response {
    return ResponseHelper.error(res, message, 429);
  }

  static internalError(res: Response, message: string = 'Internal server error'): Response {
    return ResponseHelper.error(res, message, 500);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const sendSuccess = ResponseHelper.success.bind(ResponseHelper);
export const sendCreated = ResponseHelper.created.bind(ResponseHelper);
export const sendError = ResponseHelper.error.bind(ResponseHelper);
export const sendBadRequest = ResponseHelper.badRequest.bind(ResponseHelper);
export const sendUnauthorized = ResponseHelper.unauthorized.bind(ResponseHelper);
export const sendForbidden = ResponseHelper.forbidden.bind(ResponseHelper);
export const sendNotFound = ResponseHelper.notFound.bind(ResponseHelper);
export const sendConflict = ResponseHelper.conflict.bind(ResponseHelper);
export const sendTooManyRequests = ResponseHelper.tooManyRequests.bind(ResponseHelper);
export const sendInternalError = ResponseHelper.internalError.bind(ResponseHelper);

