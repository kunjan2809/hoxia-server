// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { z } from 'zod';

// Config
import { PAGINATION } from '../../../config/pagination.js';

// Prisma enums
import { ResearchRowStatus, StrategicAngle } from '../../../generated/prisma/enums.js';

// Utils
import { jsonValueSchema } from '../../../utils/validation/jsonValue.schema.js';

// ============================================================================
// PARAMS
// ============================================================================

export const CompanyResearchIdParamDto = z.object({
  projectId: z
    .string()
    .uuid('projectId must be a valid UUID'),
  companyResearchId: z
    .string()
    .uuid('companyResearchId must be a valid UUID'),
});

export type CompanyResearchIdParamDtoType = z.infer<typeof CompanyResearchIdParamDto>;

export const ResearchReportIdParamDto = z.object({
  projectId: z
    .string()
    .uuid('projectId must be a valid UUID'),
  reportId: z
    .string()
    .uuid('reportId must be a valid UUID'),
});

export type ResearchReportIdParamDtoType = z.infer<typeof ResearchReportIdParamDto>;

export const ProjectScopedParamsDto = z.object({
  projectId: z
    .string()
    .uuid('projectId must be a valid UUID'),
});

export type ProjectScopedParamsDtoType = z.infer<typeof ProjectScopedParamsDto>;

// ============================================================================
// QUERY
// ============================================================================

export const CompanyResearchListQueryDto = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  q: z
    .string()
    .trim()
    .max(200)
    .optional(),
  researchStatus: z.nativeEnum(ResearchRowStatus).optional(),
  companyId: z
    .string()
    .uuid()
    .optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'researchStatus', 'sortOrder'])
    .default('updatedAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

export type CompanyResearchListQueryDtoType = z.infer<typeof CompanyResearchListQueryDto>;

export const ResearchReportListQueryDto = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  q: z
    .string()
    .trim()
    .max(200)
    .optional(),
  companyResearchId: z
    .string()
    .uuid()
    .optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'formalCompanyName'])
    .default('updatedAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

export type ResearchReportListQueryDtoType = z.infer<typeof ResearchReportListQueryDto>;

// ============================================================================
// BODY
// ============================================================================

export const CreateCompanyResearchDto = z.object({
  companyId: z
    .string()
    .uuid(),
  originalData: jsonValueSchema,
  sortOrder: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .nullable(),
  metadata: jsonValueSchema.optional().nullable(),
});

export type CreateCompanyResearchDtoType = z.infer<typeof CreateCompanyResearchDto>;

export const UpdateCompanyResearchDto = z
  .object({
    originalData: jsonValueSchema.optional(),
    sortOrder: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
      .nullable(),
    activeStrategy: z.nativeEnum(StrategicAngle).optional().nullable(),
    metadata: jsonValueSchema.optional().nullable(),
  })
  .refine(
    (data) =>
      data.originalData !== undefined ||
      data.sortOrder !== undefined ||
      data.activeStrategy !== undefined ||
      data.metadata !== undefined,
    { message: 'At least one field must be provided for update' }
  );

export type UpdateCompanyResearchDtoType = z.infer<typeof UpdateCompanyResearchDto>;

export const CreateResearchReportDto = z.object({
  companyResearchId: z
    .string()
    .uuid(),
});

export type CreateResearchReportDtoType = z.infer<typeof CreateResearchReportDto>;

export const UpdateResearchReportDto = z
  .object({
    formalCompanyName: z.string().max(500).optional().nullable(),
    industry: z.string().max(500).optional().nullable(),
    headquarters: z.string().max(500).optional().nullable(),
    strategicSummary: z.string().optional().nullable(),
    strategicVelocity: z.string().optional().nullable(),
    growthSignals: z.string().optional().nullable(),
    hiringSignals: z.string().optional().nullable(),
    securityRiskSignals: z.string().optional().nullable(),
    leadershipSignals: z.string().optional().nullable(),
    keyHeadwinds: z.string().optional().nullable(),
    interpretation: z.string().optional().nullable(),
    researchSources: jsonValueSchema.optional().nullable(),
    activeStrategy: z.nativeEnum(StrategicAngle).optional().nullable(),
    metadata: jsonValueSchema.optional().nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided for update',
  });

export type UpdateResearchReportDtoType = z.infer<typeof UpdateResearchReportDto>;
