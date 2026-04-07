// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { z } from 'zod';

// Config
import { PAGINATION } from '../../../config/pagination.js';

// Prisma enums
import {
  Cadence,
  Objective,
  OutputType,
  StrategicAngle,
  StrategyTone,
  SenderPersona,
} from '../../../generated/prisma/enums.js';

// Utils
import { jsonValueSchema } from '../../../utils/validation/jsonValue.schema.js';

// ============================================================================
// PARAMS
// ============================================================================

export const ProjectScopedParamsDto = z.object({
  projectId: z
    .string()
    .uuid('projectId must be a valid UUID'),
});

export type ProjectScopedParamsDtoType = z.infer<typeof ProjectScopedParamsDto>;

export const StrategyIdParamDto = z.object({
  projectId: z
    .string()
    .uuid('projectId must be a valid UUID'),
  strategyId: z
    .string()
    .uuid('strategyId must be a valid UUID'),
});

export type StrategyIdParamDtoType = z.infer<typeof StrategyIdParamDto>;

export const StrategyStepIdParamDto = z.object({
  projectId: z
    .string()
    .uuid('projectId must be a valid UUID'),
  strategyId: z
    .string()
    .uuid('strategyId must be a valid UUID'),
  stepId: z
    .string()
    .uuid('stepId must be a valid UUID'),
});

export type StrategyStepIdParamDtoType = z.infer<typeof StrategyStepIdParamDto>;

export const ActivationAssetIdParamDto = z.object({
  projectId: z
    .string()
    .uuid('projectId must be a valid UUID'),
  activationAssetId: z
    .string()
    .uuid('activationAssetId must be a valid UUID'),
});

export type ActivationAssetIdParamDtoType = z.infer<typeof ActivationAssetIdParamDto>;

// ============================================================================
// QUERY
// ============================================================================

export const StrategyListQueryDto = z.object({
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
  researchReportId: z
    .string()
    .uuid()
    .optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name'])
    .default('updatedAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

export type StrategyListQueryDtoType = z.infer<typeof StrategyListQueryDto>;

export const StrategyStepListQueryDto = z.object({
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
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'stepOrder', 'day'])
    .default('stepOrder'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc'),
});

export type StrategyStepListQueryDtoType = z.infer<typeof StrategyStepListQueryDto>;

export const ActivationAssetListQueryDto = z.object({
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
  researchReportId: z
    .string()
    .uuid()
    .optional(),
  outputType: z.nativeEnum(OutputType).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'source'])
    .default('updatedAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

export type ActivationAssetListQueryDtoType = z.infer<typeof ActivationAssetListQueryDto>;

// ============================================================================
// BODY
// ============================================================================

export const CreateStrategyDto = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .transform((v) => v.trim()),
  angle: z.nativeEnum(StrategicAngle),
  objective: z.nativeEnum(Objective),
  outputType: z.nativeEnum(OutputType),
  cadence: z.nativeEnum(Cadence).optional().nullable(),
  tone: z.nativeEnum(StrategyTone),
  senderPersona: z.nativeEnum(SenderPersona),
  pacingNotes: z
    .string()
    .max(50_000)
    .optional()
    .nullable(),
  companyId: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  companyResearchId: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  researchReportId: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  metadata: jsonValueSchema.optional().nullable(),
  upsert: z.boolean().optional(),
});

export type CreateStrategyDtoType = z.infer<typeof CreateStrategyDto>;

export const UpdateStrategyDto = z
  .object({
    name: z
      .string()
      .min(1)
      .max(255)
      .transform((v) => v.trim())
      .optional(),
    angle: z.nativeEnum(StrategicAngle).optional(),
    objective: z.nativeEnum(Objective).optional(),
    outputType: z.nativeEnum(OutputType).optional(),
    cadence: z.nativeEnum(Cadence).optional().nullable(),
    tone: z.nativeEnum(StrategyTone).optional(),
    senderPersona: z.nativeEnum(SenderPersona).optional(),
    pacingNotes: z
      .string()
      .max(50_000)
      .optional()
      .nullable(),
    companyId: z
      .string()
      .uuid()
      .optional()
      .nullable(),
    companyResearchId: z
      .string()
      .uuid()
      .optional()
      .nullable(),
    researchReportId: z
      .string()
      .uuid()
      .optional()
      .nullable(),
    metadata: jsonValueSchema.optional().nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided for update',
  });

export type UpdateStrategyDtoType = z.infer<typeof UpdateStrategyDto>;

export const CreateStrategyStepDto = z.object({
  role: z
    .string()
    .min(1)
    .max(200),
  day: z.coerce
    .number()
    .int()
    .min(0),
  stepOrder: z.coerce
    .number()
    .int()
    .min(0),
  assetName: z
    .string()
    .min(1)
    .max(500),
  channel: z
    .string()
    .min(1)
    .max(200),
  strategyAngle: z.nativeEnum(StrategicAngle),
  confidence: z
    .string()
    .min(1)
    .max(100),
  preview: z
    .string()
    .min(1)
    .max(100_000),
  subjectLine: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  companyId: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  companyResearchId: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  researchReportId: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  activationAssetId: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  metadata: jsonValueSchema.optional().nullable(),
});

export type CreateStrategyStepDtoType = z.infer<typeof CreateStrategyStepDto>;

export const UpdateStrategyStepDto = z
  .object({
    role: z.string().min(1).max(200).optional(),
    day: z.coerce.number().int().min(0).optional(),
    stepOrder: z.coerce.number().int().min(0).optional(),
    assetName: z.string().min(1).max(500).optional(),
    channel: z.string().min(1).max(200).optional(),
    strategyAngle: z.nativeEnum(StrategicAngle).optional(),
    confidence: z.string().min(1).max(100).optional(),
    preview: z.string().min(1).max(100_000).optional(),
    subjectLine: z.string().max(500).optional().nullable(),
    companyId: z.string().uuid().optional().nullable(),
    companyResearchId: z.string().uuid().optional().nullable(),
    researchReportId: z.string().uuid().optional().nullable(),
    activationAssetId: z.string().uuid().optional().nullable(),
    metadata: jsonValueSchema.optional().nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided for update',
  });

export type UpdateStrategyStepDtoType = z.infer<typeof UpdateStrategyStepDto>;

export const CreateActivationAssetDto = z.object({
  source: z.string().min(1).max(500),
  angleUsed: z.nativeEnum(StrategicAngle),
  insightClaim: z.string().min(1).max(100_000),
  confidence: z.string().min(1).max(100),
  objective: z.nativeEnum(Objective),
  outputType: z.nativeEnum(OutputType),
  outputPreview: z.string().min(1).max(100_000),
  subjectLine: z.string().max(500).optional().nullable(),
  strategicAngle: z.string().max(100_000).optional().nullable(),
  whyItFits: z.string().max(100_000).optional().nullable(),
  approachGuidance: z.string().max(100_000).optional().nullable(),
  companyResearchId: z.string().uuid().optional().nullable(),
  researchReportId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  metadata: jsonValueSchema.optional().nullable(),
});

export type CreateActivationAssetDtoType = z.infer<typeof CreateActivationAssetDto>;

export const UpdateActivationAssetDto = z
  .object({
    source: z.string().min(1).max(500).optional(),
    angleUsed: z.nativeEnum(StrategicAngle).optional(),
    insightClaim: z.string().min(1).max(100_000).optional(),
    confidence: z.string().min(1).max(100).optional(),
    objective: z.nativeEnum(Objective).optional(),
    outputType: z.nativeEnum(OutputType).optional(),
    outputPreview: z.string().min(1).max(100_000).optional(),
    subjectLine: z.string().max(500).optional().nullable(),
    strategicAngle: z.string().max(100_000).optional().nullable(),
    whyItFits: z.string().max(100_000).optional().nullable(),
    approachGuidance: z.string().max(100_000).optional().nullable(),
    companyResearchId: z.string().uuid().optional().nullable(),
    researchReportId: z.string().uuid().optional().nullable(),
    companyId: z.string().uuid().optional().nullable(),
    metadata: jsonValueSchema.optional().nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided for update',
  });

export type UpdateActivationAssetDtoType = z.infer<typeof UpdateActivationAssetDto>;
