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

const LlmGenerationUserContextDto = z.object({
  campaignGoal: z.string(),
  proposition: z.string(),
  audience: z.string(),
  language: z.string().optional(),
  influenceFocus: z.string().optional(),
  importantConsiderations: z.string().optional(),
  toneOfVoiceContent: z.string().optional(),
});

const LlmGenerationDto = z.object({
  mode: z.enum(['MULTI_TOUCH', 'SINGLE_TOUCH', 'LIBRARY_MISSING_TOUCHPOINTS']),
  userContext: LlmGenerationUserContextDto,
  labels: z.object({
    objective: z.string(),
    tone: z.string(),
    persona: z.string(),
    cadence: z.string().optional(),
    singleOutputType: z.string().optional(),
  }),
  library: z
    .object({
      missingTypes: z.array(z.string().min(1)).default([]),
      stepBlueprints: z.array(
        z.object({
          stepOrder: z.coerce.number().int().min(0),
          day: z.coerce.number().int().min(1),
          role: z.string().min(1).max(200),
          missingType: z.string().optional(),
          existing: z
            .object({
              activationAssetId: z.string().uuid(),
              assetName: z.string().min(1).max(500),
              channel: z.string().min(1).max(200),
              confidence: z.string().min(1).max(100),
              preview: z.string().min(1).max(100_000),
              subjectLine: z.string().max(500).optional().nullable(),
            })
            .optional(),
        })
      ),
    })
    .optional(),
});

export const CreateStrategyDto = z
  .object({
    name: z
      .string()
      .min(1)
      .max(255)
      .transform((v) => v.trim()),
    angle: z.nativeEnum(StrategicAngle),
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
    upsert: z.boolean().optional(),
    llmGeneration: LlmGenerationDto.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.llmGeneration) {
      if (
        data.companyId === undefined ||
        data.companyId === null ||
        data.companyResearchId === undefined ||
        data.companyResearchId === null ||
        data.researchReportId === undefined ||
        data.researchReportId === null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'companyId, companyResearchId, and researchReportId are required when llmGeneration is set',
          path: ['companyId'],
        });
      }
      if (data.llmGeneration.mode === 'MULTI_TOUCH') {
        const c = data.llmGeneration.labels.cadence?.trim();
        if (c === undefined || c.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Cadence is required for multi-touch generation',
            path: ['llmGeneration', 'labels', 'cadence'],
          });
        }
      }
      if (data.llmGeneration.mode === 'SINGLE_TOUCH') {
        const t = data.llmGeneration.labels.singleOutputType?.trim();
        if (t === undefined || t.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'singleOutputType is required for single-touch generation',
            path: ['llmGeneration', 'labels', 'singleOutputType'],
          });
        }
      }
      if (data.llmGeneration.mode === 'LIBRARY_MISSING_TOUCHPOINTS') {
        const c = data.llmGeneration.labels.cadence?.trim();
        if (c === undefined || c.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Cadence is required for library missing touchpoints generation',
            path: ['llmGeneration', 'labels', 'cadence'],
          });
        }
        if (data.llmGeneration.library === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'library payload is required for library missing touchpoints generation',
            path: ['llmGeneration', 'library'],
          });
        }
      }
    } else {
      if (data.objective === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'objective is required when llmGeneration is omitted',
          path: ['objective'],
        });
      }
      if (data.outputType === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'outputType is required when llmGeneration is omitted',
          path: ['outputType'],
        });
      }
      if (data.tone === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'tone is required when llmGeneration is omitted',
          path: ['tone'],
        });
      }
      if (data.senderPersona === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'senderPersona is required when llmGeneration is omitted',
          path: ['senderPersona'],
        });
      }
    }
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
