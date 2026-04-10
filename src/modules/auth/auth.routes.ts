// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { Router } from 'express';

// Controllers
import { authController } from './auth.controller.js';

// Middleware
import { authenticate } from '../../middleware/auth.js';

// Services
import { authRateLimiter } from '../../services/rate-limit/index.js';

// Constants
import { ROUTES } from '../../utils/constants/routes.js';

// ============================================================================
// ROUTER
// ============================================================================

const router = Router();

// ============================================================================
// Public Routes
// ============================================================================

/**
 * @route   POST /api/auth/register
 * @desc    Register with email/password (PHASE1: no post-signup verification email)
 * @access  Public
 */
router.post(
    ROUTES.AUTH.REGISTER,
    authRateLimiter,
    authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email/password (PHASE1: no verified-email gate)
 * @access  Public
 */
router.post(
    ROUTES.AUTH.LOGIN,
    authRateLimiter,
    authController.login
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification link for unverified accounts
 * @access  Public
 */
router.post(
    ROUTES.AUTH.RESEND_VERIFICATION,
    authRateLimiter,
    authController.resendVerification
);

/**
 * @route   POST /api/auth/magic-link/request
 * @desc    Request a magic link sign-in email
 * @access  Public
 */
router.post(
    ROUTES.AUTH.MAGIC_LINK.REQUEST,
    authRateLimiter,
    authController.requestMagicLink
);

/**
 * @route   GET /api/auth/magic-link/verify
 * @desc    Verify magic link token and sign in
 * @access  Public
 */
router.get(
    ROUTES.AUTH.MAGIC_LINK.VERIFY,
    authRateLimiter,
    authController.verifyMagicLink
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
    ROUTES.AUTH.REFRESH,
    authRateLimiter,
    authController.refreshToken
);

// ============================================================================
// Protected Routes
// ============================================================================

/**
 * @route   GET /api/auth/me
 * @desc    Returns the full safe profile for the current user (id, email, role, firstName, lastName,
 *          avatarUrl, verification flags, timestamps). Use this after login to hydrate client state.
 * @access  Protected
 */
router.get(
    ROUTES.AUTH.ME,
    authenticate,
    authController.me
);

/**
 * @route   PATCH /api/auth/me
 * @desc    Updates firstName and lastName for the authenticated account. Both fields are required in
 *          the JSON body; other profile fields (email, password, avatar) are out of scope for this MVP.
 * @access  Protected
 */
router.patch(
    ROUTES.AUTH.ME,
    authenticate,
    authController.patchMe
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (revoke refresh token)
 * @access  Protected
 */
router.post(
    ROUTES.AUTH.LOGOUT,
    authenticate,
    authController.logout
);

export default router;

