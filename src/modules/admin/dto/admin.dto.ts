// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { z } from 'zod';

// Config
import { PAGINATION } from '../../../config/pagination.js';

// Types
import { ProjectStatus, UserRole, UserVerificationStatus } from '../../../generated/prisma/enums.js';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const ListUsersQueryDto = z.object({
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int('Page size must be an integer')
    .min(PAGINATION.MIN_PAGE_SIZE, `Page size must be at least ${PAGINATION.MIN_PAGE_SIZE}`)
    .max(PAGINATION.MAX_PAGE_SIZE, `Page size must be at most ${PAGINATION.MAX_PAGE_SIZE}`)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  sortBy: z
    .enum(['createdAt', 'email', 'firstName', 'lastName', 'role'], 'Sort by must be createdAt, email, firstName, lastName, or role')
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'], 'Sort order must be asc or desc')
    .default('desc'),
  search: z
    .string()
    .trim()
    .optional()
    .default(''),
  status: z
    .enum(['all', 'active', 'inactive'], 'Status filter must be all, active, or inactive')
    .default('all'),
});

export type ListUsersQueryDtoType = z.infer<typeof ListUsersQueryDto>;

export const CreateAdminUserDto = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Email must be a valid email address')
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .transform((value) => value.trim()),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .transform((value) => value.trim()),
  role: z
    .enum([UserRole.USER, UserRole.ADMIN], 'Role must be user or admin')
    .default(UserRole.USER),
});

export type CreateAdminUserDtoType = z.infer<typeof CreateAdminUserDto>;

export const UpdateAdminUserDto = z
  .object({
    email: z
      .string()
      .email('Email must be a valid email address')
      .transform((value) => value.trim().toLowerCase())
      .optional(),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .transform((value) => value.trim())
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .transform((value) => value.trim())
      .optional(),
    role: z
      .enum([UserRole.USER, UserRole.ADMIN], 'Role must be user or admin')
      .optional(),
    isActive: z
      .boolean()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export type UpdateAdminUserDtoType = z.infer<typeof UpdateAdminUserDto>;

export const UpdateAdminUserVerificationDto = z.object({
  verificationStatus: z.enum(
    [UserVerificationStatus.SUCCESS, UserVerificationStatus.FAILED],
    'Verification status must be success (approved) or failed (rejected)'
  ),
});

export type UpdateAdminUserVerificationDtoType = z.infer<typeof UpdateAdminUserVerificationDto>;

export const ListUserOptionsQueryDto = z.object({
  q: z
    .string()
    .trim()
    .optional()
    .default(''),
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int('Page size must be an integer')
    .min(PAGINATION.MIN_PAGE_SIZE, `Page size must be at least ${PAGINATION.MIN_PAGE_SIZE}`)
    .max(PAGINATION.MAX_PAGE_SIZE, `Page size must be at most ${PAGINATION.MAX_PAGE_SIZE}`)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
});

export type ListUserOptionsQueryDtoType = z.infer<typeof ListUserOptionsQueryDto>;

export const ListAdminProjectsQueryDto = z.object({
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int('Page size must be an integer')
    .min(PAGINATION.MIN_PAGE_SIZE, `Page size must be at least ${PAGINATION.MIN_PAGE_SIZE}`)
    .max(PAGINATION.MAX_PAGE_SIZE, `Page size must be at most ${PAGINATION.MAX_PAGE_SIZE}`)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  sortBy: z
    .enum(['createdAt', 'name', 'status'], 'Sort by must be createdAt, name, or status')
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'], 'Sort order must be asc or desc')
    .default('desc'),
  search: z
    .string()
    .trim()
    .optional()
    .default(''),
  userId: z
    .string()
    .uuid('User id must be a valid UUID')
    .optional(),
});

export type ListAdminProjectsQueryDtoType = z.infer<typeof ListAdminProjectsQueryDto>;

export const ListProjectOptionsQueryDto = z.object({
  q: z
    .string()
    .trim()
    .optional()
    .default(''),
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int('Page size must be an integer')
    .min(PAGINATION.MIN_PAGE_SIZE, `Page size must be at least ${PAGINATION.MIN_PAGE_SIZE}`)
    .max(PAGINATION.MAX_PAGE_SIZE, `Page size must be at most ${PAGINATION.MAX_PAGE_SIZE}`)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  userId: z
    .string()
    .uuid('User id must be a valid UUID')
    .optional(),
});

export type ListProjectOptionsQueryDtoType = z.infer<typeof ListProjectOptionsQueryDto>;

export const CreateAdminProjectDto = z.object({
  userId: z
    .string()
    .uuid('Valid user id is required'),
  name: z
    .string()
    .min(1, 'Name is required')
    .transform((value) => value.trim()),
  status: z
    .enum(
      [ProjectStatus.ACTIVE, ProjectStatus.ARCHIVED, ProjectStatus.DRAFT, ProjectStatus.PAUSED],
      'Status must be active, archived, draft, or paused',
    )
    .default(ProjectStatus.DRAFT),
});

export type CreateAdminProjectDtoType = z.infer<typeof CreateAdminProjectDto>;

export const UpdateAdminProjectDto = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .transform((value) => value.trim())
      .optional(),
    status: z
      .enum(
        [ProjectStatus.ACTIVE, ProjectStatus.ARCHIVED, ProjectStatus.DRAFT, ProjectStatus.PAUSED],
        'Status must be active, archived, draft, or paused',
      )
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.status !== undefined, {
    message: 'At least one field is required',
  });

export type UpdateAdminProjectDtoType = z.infer<typeof UpdateAdminProjectDto>;

export const ListAdminResearchReportsQueryDto = z.object({
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int('Page size must be an integer')
    .min(PAGINATION.MIN_PAGE_SIZE, `Page size must be at least ${PAGINATION.MIN_PAGE_SIZE}`)
    .max(PAGINATION.MAX_PAGE_SIZE, `Page size must be at most ${PAGINATION.MAX_PAGE_SIZE}`)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  sortBy: z
    .enum(['createdAt', 'formalCompanyName'], 'Sort by must be createdAt or formalCompanyName')
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'], 'Sort order must be asc or desc')
    .default('desc'),
  search: z
    .string()
    .trim()
    .optional()
    .default(''),
  userId: z
    .string()
    .uuid('User id must be a valid UUID')
    .optional(),
  projectId: z
    .string()
    .uuid('Project id must be a valid UUID')
    .optional(),
});

export type ListAdminResearchReportsQueryDtoType = z.infer<typeof ListAdminResearchReportsQueryDto>;

export const ListAdminProjectCompaniesQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  sortBy: z.enum(['createdAt', 'companyName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional().default(''),
});

export type ListAdminProjectCompaniesQueryDtoType = z.infer<typeof ListAdminProjectCompaniesQueryDto>;

export const ListAdminProjectCompanyResearchQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  sortBy: z.enum(['createdAt', 'researchStatus']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional().default(''),
});

export type ListAdminProjectCompanyResearchQueryDtoType = z.infer<typeof ListAdminProjectCompanyResearchQueryDto>;

export const ListAdminProjectNestedResearchReportsQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  sortBy: z.enum(['createdAt', 'formalCompanyName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional().default(''),
});

export type ListAdminProjectNestedResearchReportsQueryDtoType = z.infer<typeof ListAdminProjectNestedResearchReportsQueryDto>;
