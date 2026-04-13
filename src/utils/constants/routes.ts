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
  ADMIN: {
    BASE: '/api/admin',
    OVERVIEW: '/overview',
    USERS: {
      OPTIONS: '/users/options',
      LIST: '/users',
      VERIFICATION: '/users/:userId/verification',
      DETAIL: '/users/:userId',
    },
    PROJECTS: {
      OPTIONS: '/projects/options',
      LIST: '/projects',
      COMPANIES: '/projects/:projectId/companies',
      COMPANY_RESEARCH: '/projects/:projectId/company-research',
      NESTED_RESEARCH_REPORTS: '/projects/:projectId/research-reports',
      DETAIL: '/projects/:projectId',
    },
    RESEARCH_REPORTS: {
      LIST: '/research-reports',
      DETAIL: '/research-reports/:reportId',
    },
  },
  PROJECTS: {
    BASE: '/api/projects',
    LIST: '/',
    DETAIL: '/:projectId',
    /** Use with `app.use` + `mergeParams` for nested project resources. */
    SCOPED_MOUNT: '/api/projects/:projectId',
    SCOPE: {
      COMPANY_LISTS: '/company-lists',
      COMPANY_LIST_SAVE_CAMPAIGN_CONTEXT: '/company-lists/save-campaign-context',
      COMPANY_LIST_TONE_DOWNLOAD: '/company-lists/:companyListId/tone-of-voice/download',
      COMPANY_LIST_DETAIL: '/company-lists/:companyListId',
      COMPANIES_BULK: '/company-lists/:companyListId/companies/bulk',
      COMPANIES: '/companies',
      COMPANY_DETAIL: '/companies/:companyId',
      COMPANY_RESEARCH: '/company-research',
      COMPANY_RESEARCH_DETAIL: '/company-research/:companyResearchId',
      COMPANY_RESEARCH_RUN: '/company-research/:companyResearchId/run',
      RESEARCH_REPORTS: '/research-reports',
      RESEARCH_REPORT_DETAIL: '/research-reports/:reportId',
      STRATEGIES: '/strategies',
      STRATEGY_DETAIL: '/strategies/:strategyId',
      STRATEGY_STEPS: '/strategies/:strategyId/steps',
      STRATEGY_STEP_DETAIL: '/strategies/:strategyId/steps/:stepId',
      ACTIVATION_ASSETS: '/activation-assets',
      ACTIVATION_ASSET_DETAIL: '/activation-assets/:activationAssetId',
    },
  },
} as const;

