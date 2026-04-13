// ============================================================================
// CONSTANTS
// ============================================================================

export const USER_VERIFICATION_ERROR_CODES = {
  PENDING: 'VERIFICATION_PENDING',
  FAILED: 'VERIFICATION_FAILED',
} as const;

export const USER_VERIFICATION_MESSAGES = {
  PENDING:
    'Your account is currently under verification. You will be able to sign in after an administrator approves it.',
  FAILED: 'Your account verification was rejected by an administrator.',
} as const;
