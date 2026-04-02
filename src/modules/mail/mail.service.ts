// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { Resend } from 'resend';

// Utils
import { createLogger } from '../../utils/helpers/logger.js';

// Types
import type { MagicLinkEmailData, MagicLinkTemplateVariables, MailResult } from './types/mail.types.js';

// Templates
import { getMagicLinkTemplate, getMagicLinkTextTemplate } from './templates/index.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('MailService');

const mailEnabled = process.env['MAIL_ENABLED'] === 'true';
const resendApiKey = process.env['RESEND_API_KEY'];

const fromEmail = process.env['RESEND_FROM_EMAIL'] || 'no-reply@localhost';
const fromName = process.env['RESEND_FROM_NAME'] || 'Hoxia';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

const shouldDevLog = (): boolean => {
  return process.env['NODE_ENV'] === 'development';
};

// ============================================================================
// CLASS DEFINITIONS
// ============================================================================

export class MailService {
  private handleMailDisabled(message: string): MailResult {
    if (shouldDevLog()) {
      logger.warn(message);
    }

    return {
      success: true,
      messageId: 'dev-mode-no-email-sent',
    };
  }

  private isConfigured(): boolean {
    return mailEnabled && resend !== null;
  }

  async sendMagicLinkEmail(data: MagicLinkEmailData): Promise<MailResult> {
    const { to, magicLinkUrl, fallbackUrl, expiresInMinutes } = data;

    if (!this.isConfigured()) {
      return this.handleMailDisabled(`[MAIL DISABLED] Magic link for ${to.email}: ${fallbackUrl}`);
    }

    try {
      const displayName = to.name || to.email;

      const templateVariables: MagicLinkTemplateVariables = {
        userName: displayName,
        magicLinkUrl,
        fallbackUrl,
        expiresInMinutes,
        year: getCurrentYear(),
      };

      const html = getMagicLinkTemplate(templateVariables);
      const text = getMagicLinkTextTemplate(templateVariables);

      const result = await resend!.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [to.email],
        subject: 'Your sign-in link',
        html,
        text,
      });

      const messageId = result.data?.id ?? 'unknown';
      logger.info(`Magic link email sent to ${to.email}. Message ID: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      logger.error(`Failed to send magic link email to ${to.email}`, error);

      return {
        success: false,
        messageId: 'failed',
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const mailService = new MailService();

