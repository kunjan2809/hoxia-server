// ============================================================================
// IMPORTS
// ============================================================================

// Types
import type { MagicLinkTemplateVariables } from '../types/mail.types.js';

// ============================================================================
// TEMPLATES
// ============================================================================

export const getMagicLinkTemplate = (variables: MagicLinkTemplateVariables): string => {
  const { userName, magicLinkUrl, expiresInMinutes, year } = variables;

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Sign in</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding:28px 28px 18px 28px;">
                <h1 style="margin:0;font-size:20px;line-height:1.3;color:#111827;">Sign in to your account</h1>
                <p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;color:#374151;">
                  Hi ${userName}, click the button below to sign in. This link expires in ${expiresInMinutes} minutes.
                </p>
                <div style="height:18px;"></div>
                <a href="${magicLinkUrl}" target="_blank" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;">
                  Sign in
                </a>
                <p style="margin:18px 0 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
                  If the button doesn’t work, copy and paste this URL into your browser:
                  <br />
                  <span style="word-break:break-all;">${magicLinkUrl}</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f9fafb;border-top:1px solid #eef2f7;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                  ${year} • If you didn’t request this email, you can ignore it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
};

export const getMagicLinkTextTemplate = (variables: MagicLinkTemplateVariables): string => {
  const { userName, fallbackUrl, expiresInMinutes } = variables;

  return `
Sign in to your account

Hi ${userName},

Use this link to sign in (expires in ${expiresInMinutes} minutes):
${fallbackUrl}
`.trim();
};

