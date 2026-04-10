// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';

// Modules
import { AuthService } from './auth.service.js';

// DTO
import { LoginDto, RefreshTokenDto, RegisterDto, RequestMagicLinkDto, ResendVerificationDto, UpdateProfileDto, VerifyMagicLinkQueryDto } from './dto/auth.dto.js';
import type { VerifyMagicLinkQueryDtoType } from './dto/auth.dto.js';

// Utils
import { clearAuthCookies, COOKIE_NAMES, setAuthCookies } from '../../utils/helpers/cookie.js';
import { createLogger } from '../../utils/helpers/logger.js';
import { sendBadRequest, sendNotFound, sendSuccess } from '../../utils/helpers/response.js';
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
   * @route   POST /api/auth/magic-link/request
   * @desc    Validates the email via RequestMagicLinkDto, then delegates to authService.requestMagicLink.
   *          Returns a message-only success response describing the magic link flow outcome (no cookies set here).
   * @access  Public
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
   * @route   POST /api/auth/register
   * @desc    Validates registration fields via RegisterDto, then delegates to authService.register.
   *          Returns a message-only success response (PHASE1: no verification email; account is usable immediately).
   * @access  Public
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
   * @route   POST /api/auth/login
   * @desc    Validates email and password via LoginDto, then delegates to authService.login with session info.
   *          When tokens are issued (PHASE1: without requiring prior email verification), sets HTTP-only auth cookies and returns AuthResponse.
   *          Otherwise returns a message-only body when an intermediate step is required.
   * @access  Public
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
   * @route   POST /api/auth/resend-verification
   * @desc    Validates the email via ResendVerificationDto, then delegates to authService.resendVerification.
   *          Returns a message-only success response for the verification email flow.
   * @access  Public
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
   * @route   GET /api/auth/magic-link/verify
   * @desc    Validates the token query via VerifyMagicLinkQueryDto (with normalized query), then delegates to authService.verifyMagicLinkToken.
   *          On success, sets HTTP-only auth cookies and returns AuthResponse with the user profile and tokens.
   * @access  Public
   */
  verifyMagicLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryToken = req.query['token'];
      const normalizedQuery: VerifyMagicLinkQueryDtoType = { token: typeof queryToken === 'string' ? queryToken : '' };

      const dtoResult = await validateRequest(VerifyMagicLinkQueryDto, req, res, 'query', normalizedQuery);
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
   * @route   POST /api/auth/refresh
   * @desc    Validates RefreshTokenDto and resolves the refresh token from cookies or body, then delegates to authService.refreshAccessToken.
   *          Returns updated tokens and sets HTTP-only auth cookies on success; responds with 400 when no refresh token is present.
   * @access  Public
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
   * @route   GET /api/auth/me
   * @desc    Requires req.user from the JWT, then delegates to authService.getProfile for that user id.
   *          Returns the full safe profile (including firstName, lastName, avatarUrl) or 404 when the user record is missing.
   * @access  Protected
   */
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Not authenticated');
        return;
      }

      const profile = await this.authService.getProfile(req.user.id);
      if (!profile) {
        sendNotFound(res, 'User not found');
        return;
      }

      sendSuccess(res, 'User retrieved successfully', { user: profile });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route   PATCH /api/auth/me
   * @desc    Requires req.user, validates UpdateProfileDto, then delegates to authService.updateProfile for first and last name only.
   *          Returns the updated user payload; email, password, and role are not changed here (use dedicated auth flows).
   * @access  Protected
   */
  patchMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Not authenticated');
        return;
      }

      const dtoResult = await validateRequest(UpdateProfileDto, req, res, 'body');
      if (!dtoResult.success) {
        return;
      }

      const profile = await this.authService.updateProfile(req.user.id, dtoResult.data);
      sendSuccess(res, 'Profile updated successfully', { user: profile });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route   POST /api/auth/logout
   * @desc    Requires req.user, resolves refresh token from cookies or body, then delegates to authService.logout to revoke the current or all sessions.
   *          Clears auth cookies and returns a message indicating single-session versus all-sessions logout.
   * @access  Protected
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

