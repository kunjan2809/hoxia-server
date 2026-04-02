// ============================================================================
// ROUTES
// ============================================================================

export const ROUTES = {
  BASE: '/api',
  HEALTH: '/api/health',
  AUTH: {
    BASE: '/api/auth',
    REGISTER: '/register',
    LOGIN: '/login',
    RESEND_VERIFICATION: '/resend-verification',
    ME: '/me',
    LOGOUT: '/logout',
    REFRESH: '/refresh',
    MAGIC_LINK: {
      REQUEST: '/magic-link/request',
      VERIFY: '/magic-link/verify',
    },
  },
} as const;

