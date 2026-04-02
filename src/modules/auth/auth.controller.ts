// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';

// Modules
import { AuthService } from './auth.service.js';

// DTO
import { LoginDto, RefreshTokenDto, RegisterDto, RequestMagicLinkDto, ResendVerificationDto, VerifyMagicLinkQueryDto } from './dto/auth.dto.js';
import type { VerifyMagicLinkQueryDtoType } from './dto/auth.dto.js';

// Utils
import { clearAuthCookies, COOKIE_NAMES, setAuthCookies } from '../../utils/helpers/cookie.js';
import { createLogger } from '../../utils/helpers/logger.js';
import { sendBadRequest, sendSuccess } from '../../utils/helpers/response.js';
import { validateRequest } from '../../utils/helpers/validate.js';

// Types
import type { AuthResponse, SessionInfo } from './types/auth.types.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('AuthController');

// ============================================================================
// CONTROLLER
// ============================================================================

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  private getSessionInfo(req: Request): SessionInfo {
    const sessionInfo: SessionInfo = {};

    const userAgent = req.headers['user-agent'];
    if (typeof userAgent === 'string') {
      sessionInfo.userAgent = userAgent;
    }

    const ip = req.ip || req.socket.remoteAddress;
    if (typeof ip === 'string') {
      sessionInfo.ipAddress = ip;
    }

    return sessionInfo;
  }

  private getRefreshTokenFromRequest(req: Request): string | undefined {
    const cookieToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;
    if (cookieToken) return cookieToken;
    return (req.body as { refreshToken?: string } | undefined)?.refreshToken;
  }

  /**
   * Request magic link
   * POST /api/auth/magic-link/request
   */
  requestMagicLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(RequestMagicLinkDto, req, res, 'body');
      if (!dtoResult.success) {
        return;
      }

      const result = await this.authService.requestMagicLink(dtoResult.data.email);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Register with email + password (PHASE1: no verification email; account is usable immediately)
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(RegisterDto, req, res, 'body');
      if (!dtoResult.success) return;

      const result = await this.authService.register(dtoResult.data);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login with email + password (PHASE1: issues tokens without requiring prior email verification)
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(LoginDto, req, res, 'body');
      if (!dtoResult.success) return;

      const sessionInfo = this.getSessionInfo(req);
      const result = await this.authService.login(dtoResult.data, sessionInfo);

      if ('accessToken' in result) {
        setAuthCookies(res, result.accessToken, result.refreshToken);
        sendSuccess<AuthResponse>(res, 'Login successful', result);
        return;
      }

      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resend verification link for unverified accounts
   * POST /api/auth/resend-verification
   */
  resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(ResendVerificationDto, req, res, 'body');
      if (!dtoResult.success) return;

      const result = await this.authService.resendVerification(dtoResult.data.email);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify magic link token
   * GET /api/auth/magic-link/verify?token=...
   */
  verifyMagicLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryToken = req.query['token'];
      const query: VerifyMagicLinkQueryDtoType = { token: typeof queryToken === 'string' ? queryToken : '' };

      req.query = query as unknown as Request['query'];

      const dtoResult = await validateRequest(VerifyMagicLinkQueryDto, req, res, 'query');
      if (!dtoResult.success) {
        return;
      }

      const sessionInfo = this.getSessionInfo(req);
      const result = await this.authService.verifyMagicLinkToken(dtoResult.data.token, sessionInfo);

      setAuthCookies(res, result.accessToken, result.refreshToken);
      logger.info(`Magic link verified: ${result.user.email}`);

      sendSuccess<AuthResponse>(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(RefreshTokenDto, req, res, 'body');
      if (!dtoResult.success) {
        return;
      }

      const refreshToken = this.getRefreshTokenFromRequest(req);
      if (!refreshToken) {
        sendBadRequest(res, 'Refresh token is required');
        return;
      }

      const sessionInfo = this.getSessionInfo(req);
      const result = await this.authService.refreshAccessToken(refreshToken, sessionInfo);

      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendSuccess<AuthResponse>(res, 'Token refreshed successfully', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current authenticated user
   * GET /api/auth/me
   */
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Not authenticated');
        return;
      }

      sendSuccess(res, 'User retrieved successfully', { user: req.user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout (revoke refresh token or all sessions)
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Not authenticated');
        return;
      }

      const refreshToken = this.getRefreshTokenFromRequest(req);
      await this.authService.logout(req.user.id, refreshToken);

      clearAuthCookies(res);
      sendSuccess(res, refreshToken ? 'Logged out from current session' : 'Logged out from all sessions');
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();

