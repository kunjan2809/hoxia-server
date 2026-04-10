// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { z } from 'zod';

// Config
import { PAGINATION } from '../../../config/pagination.js';

// Prisma enums
import { CompanyType } from '../../../generated/prisma/enums.js';

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

export const CompanyListIdParamDto = z.object({
  projectId: z
    .string()
    .uuid('projectId must be a valid UUID'),
  companyListId: z
    .string()
    .uuid('companyListId must be a valid UUID'),
});

export type CompanyListIdParamDtoType = z.infer<typeof CompanyListIdParamDto>;

export const CompanyIdParamDto = z.object({
  projectId: z
    .string()
    .uuid('projectId must be a valid UUID'),
  companyId: z
    .string()
    .uuid('companyId must be a valid UUID'),
});

export type CompanyIdParamDtoType = z.infer<typeof CompanyIdParamDto>;

// ============================================================================
// QUERY
// ============================================================================

export const CompanyListListQueryDto = z.object({
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
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name'])
    .default('updatedAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

export type CompanyListListQueryDtoType = z.infer<typeof CompanyListListQueryDto>;

export const CompanyListQueryDto = z.object({
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
  companyListId: z
    .string()
    .uuid()
    .optional(),
  type: z.nativeEnum(CompanyType).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'companyName', 'type'])
    .default('updatedAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

export type CompanyListQueryDtoType = z.infer<typeof CompanyListQueryDto>;

// ============================================================================
// BODY
// ============================================================================

export const CreateCompanyListDto = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters')
    .transform((value) => value.trim()),
  headers: jsonValueSchema,
  rowCount: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .nullable(),
  campaignContext: jsonValueSchema.optional().nullable(),
  metadata: jsonValueSchema.optional().nullable(),
});

export type CreateCompanyListDtoType = z.infer<typeof CreateCompanyListDto>;

export const UpdateCompanyListDto = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name must be at most 255 characters')
      .transform((value) => value.trim())
      .optional(),
    headers: jsonValueSchema.optional(),
    rowCount: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
      .nullable(),
    campaignContext: jsonValueSchema.optional().nullable(),
    metadata: jsonValueSchema.optional().nullable(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.headers !== undefined ||
      data.rowCount !== undefined ||
      data.campaignContext !== undefined ||
      data.metadata !== undefined,
    { message: 'At least one field must be provided for update' }
  );

export type UpdateCompanyListDtoType = z.infer<typeof UpdateCompanyListDto>;

export const BulkCompaniesBodyDto = z.object({
  rows: z
    .array(
      z.object({
        companyName: z
          .string()
          .min(1)
          .max(500)
          .transform((v) => v.trim()),
        websiteUrl: z
          .string()
          .max(2000)
          .optional()
          .nullable(),
        linkedinUrl: z
          .string()
          .max(2000)
          .optional()
          .nullable(),
        payload: jsonValueSchema.optional().default({}),
      })
    )
    .min(1, 'At least one row is required')
    .max(PAGINATION.BULK_COMPANY_ROWS_MAX, `At most ${PAGINATION.BULK_COMPANY_ROWS_MAX} rows per request`),
});

export type BulkCompaniesBodyDtoType = z.infer<typeof BulkCompaniesBodyDto>;

export const CreateCompanyDto = z.object({
  type: z.nativeEnum(CompanyType),
  companyListId: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  companyName: z
    .string()
    .min(1)
    .max(500)
    .transform((v) => v.trim())
    .optional()
    .nullable(),
  websiteUrl: z
    .string()
    .max(2000)
    .optional()
    .nullable(),
  linkedinUrl: z
    .string()
    .max(2000)
    .optional()
    .nullable(),
  payload: jsonValueSchema,
  metadata: jsonValueSchema.optional().nullable(),
});

export type CreateCompanyDtoType = z.infer<typeof CreateCompanyDto>;

export const UpdateCompanyDto = z
  .object({
    type: z.nativeEnum(CompanyType).optional(),
    companyListId: z
      .string()
      .uuid()
      .optional()
      .nullable(),
    companyName: z
      .string()
      .min(1)
      .max(500)
      .transform((v) => v.trim())
      .optional()
      .nullable(),
    websiteUrl: z
      .string()
      .max(2000)
      .optional()
      .nullable(),
    linkedinUrl: z
      .string()
      .max(2000)
      .optional()
      .nullable(),
    payload: jsonValueSchema.optional(),
    metadata: jsonValueSchema.optional().nullable(),
  })
  .refine(
    (data) =>
      data.type !== undefined ||
      data.companyListId !== undefined ||
      data.companyName !== undefined ||
      data.websiteUrl !== undefined ||
      data.linkedinUrl !== undefined ||
      data.payload !== undefined ||
      data.metadata !== undefined,
    { message: 'At least one field must be provided for update' }
  );

export type UpdateCompanyDtoType = z.infer<typeof UpdateCompanyDto>;
