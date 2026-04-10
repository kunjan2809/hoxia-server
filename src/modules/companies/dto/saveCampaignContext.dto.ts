// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { z } from 'zod';

// ============================================================================
// BODY (multipart form fields; all values arrive as strings)
// ============================================================================

export const SaveCampaignContextFormDto = z.object({
  listName: z
    .string()
    .max(255)
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }),
  scope: z.enum(['single', 'list']),
  targetJobTitles: z
    .string()
    .min(1, 'Target job titles or job functions are required')
    .max(20000),
  productServiceSolution: z
    .string()
    .min(1, 'Product, service or solution description is required')
    .max(20000),
  importantConsiderations: z
    .string()
    .max(20000)
    .optional()
    .default(''),
  outputLanguage: z
    .string()
    .min(1, 'Output language is required')
    .max(100),
  /** Plain-text snapshot from the client (e.g. .md/.txt content); optional for PDF/DOC (metadata-only). */
  toneOfVoicePlainText: z
    .string()
    .max(500_000)
    .optional()
    .default(''),
  syncProjectCampaignContext: z
    .enum(['true', 'false'])
    .optional()
    .default('true'),
});

export type SaveCampaignContextFormDtoType = z.infer<typeof SaveCampaignContextFormDto>;
