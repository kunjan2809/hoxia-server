// ============================================================================
// PAGINATION (LIST ENDPOINTS)
// ============================================================================

/**
 * Hard limits for list endpoints: clients must stay within [MIN_PAGE_SIZE, MAX_PAGE_SIZE].
 * Defaults apply when query params are omitted.
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MIN_PAGE_SIZE: 5,
  MAX_PAGE_SIZE: 100,
  /** Max rows per bulk company create (client-parsed CSV batches). */
  BULK_COMPANY_ROWS_MAX: 500,
} as const;
