// ============================================================================
// IMPORTS
// ============================================================================

// Types
import type { CookieOptions as ExpressCookieOptions, Response } from 'express';

// ============================================================================
// CONSTANTS
// ============================================================================

const isProduction = process.env['NODE_ENV'] === 'production';
const allowInsecureCookies = process.env['ALLOW_INSECURE_COOKIES'] === 'true';
const cookieDomain = process.env['COOKIE_DOMAIN'] || undefined;

const useSecureCookies = isProduction && !allowInsecureCookies;
const cookieSameSite: ExpressCookieOptions['sameSite'] = useSecureCookies ? 'none' : 'lax';

const baseCookieOptions: ExpressCookieOptions = {
  httpOnly: true,
  secure: useSecureCookies,
  sameSite: cookieSameSite,
  domain: cookieDomain,
  path: '/',
};

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const parseExpiryToMilliseconds = (expiry: string | undefined, defaultValue: number): number => {
  if (!expiry) return defaultValue;

  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) return defaultValue;

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return defaultValue;
  }
};

export const getAccessTokenCookieOptions = (): ExpressCookieOptions => {
  const expiry = process.env['ACCESS_TOKEN_EXPIRY'] || '15m';
  const defaultMaxAge = 15 * 60 * 1000;

  return {
    ...baseCookieOptions,
    maxAge: parseExpiryToMilliseconds(expiry, defaultMaxAge),
  };
};

export const getRefreshTokenCookieOptions = (): ExpressCookieOptions => {
  const expiry = process.env['REFRESH_TOKEN_EXPIRY'] || '7d';
  const defaultMaxAge = 7 * 24 * 60 * 60 * 1000;

  return {
    ...baseCookieOptions,
    maxAge: parseExpiryToMilliseconds(expiry, defaultMaxAge),
  };
};

// ============================================================================
// CLASS DEFINITIONS
// ============================================================================

export class CookieHelper {
  static setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, getAccessTokenCookieOptions());
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, getRefreshTokenCookieOptions());
  }

  static clearAuthCookies(res: Response): void {
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, baseCookieOptions);
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, baseCookieOptions);
  }

  static setAccessTokenCookie(res: Response, accessToken: string): void {
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, getAccessTokenCookieOptions());
  }

  static setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, getRefreshTokenCookieOptions());
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const setAuthCookies = CookieHelper.setAuthCookies.bind(CookieHelper);
export const clearAuthCookies = CookieHelper.clearAuthCookies.bind(CookieHelper);
export const setAccessTokenCookie = CookieHelper.setAccessTokenCookie.bind(CookieHelper);
export const setRefreshTokenCookie = CookieHelper.setRefreshTokenCookie.bind(CookieHelper);

