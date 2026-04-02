// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MailResult {
  success: boolean;
  messageId: string;
  error?: string;
}

export interface MagicLinkEmailData {
  to: { email: string; name?: string };
  magicLinkUrl: string;
  fallbackUrl: string;
  expiresInMinutes: number;
}

export interface MagicLinkTemplateVariables {
  userName: string;
  magicLinkUrl: string;
  fallbackUrl: string;
  expiresInMinutes: number;
  year: number;
}

