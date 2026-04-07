// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { z } from 'zod';

// Config
import { PAGINATION } from '../../../config/pagination.js';

// Prisma enums
import { ProjectStatus } from '../../../generated/prisma/enums.js';

// Utils
import { jsonValueSchema } from '../../../utils/validation/jsonValue.schema.js';

// ============================================================================
// PARAMS
// ============================================================================

export const ProjectIdParamDto = z.object({
  projectId: z
    .string()
    .uuid('projectId must be a valid UUID'),
});

export type ProjectIdParamDtoType = z.infer<typeof ProjectIdParamDto>;

// ============================================================================
// QUERY — LIST
// ============================================================================

export const ProjectListQueryDto = z.object({
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
  status: z.nativeEnum(ProjectStatus).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'status'])
    .default('updatedAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

export type ProjectListQueryDtoType = z.infer<typeof ProjectListQueryDto>;

// ============================================================================
// BODY — CREATE / UPDATE
// ============================================================================

export const CreateProjectDto = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters')
    .transform((value) => value.trim()),
  status: z.nativeEnum(ProjectStatus).optional(),
  defaultHeaders: jsonValueSchema.optional().default({}),
  campaignContext: jsonValueSchema.optional().nullable(),
  metadata: jsonValueSchema.optional().nullable(),
});

export type CreateProjectDtoType = z.infer<typeof CreateProjectDto>;

export const UpdateProjectDto = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name must be at most 255 characters')
      .transform((value) => value.trim())
      .optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    defaultHeaders: jsonValueSchema.optional(),
    campaignContext: jsonValueSchema.optional().nullable(),
    metadata: jsonValueSchema.optional().nullable(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.status !== undefined ||
      data.defaultHeaders !== undefined ||
      data.campaignContext !== undefined ||
      data.metadata !== undefined,
    { message: 'At least one field must be provided for update' }
  );

export type UpdateProjectDtoType = z.infer<typeof UpdateProjectDto>;
