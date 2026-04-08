// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { z } from 'zod';

// Config
import { PAGINATION } from '../../../config/pagination.js';

// Types
import { UserRole } from '../../../generated/prisma/enums.js';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const ListUsersQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  sortBy: z.enum(['createdAt', 'email', 'firstName', 'lastName', 'role']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional().default(''),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
});

export type ListUsersQueryDtoType = z.infer<typeof ListUsersQueryDto>;

export const CreateAdminUserDto = z.object({
  email: z.string().min(1, 'Email is required').email('Email must be valid').transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').transform((v) => v.trim()),
  lastName: z.string().min(1, 'Last name is required').transform((v) => v.trim()),
  role: z.enum([UserRole.USER, UserRole.ADMIN]).default(UserRole.USER),
});

export type CreateAdminUserDtoType = z.infer<typeof CreateAdminUserDto>;

export const UpdateAdminUserDto = z
  .object({
    email: z.string().email('Email must be valid').transform((v) => v.trim().toLowerCase()).optional(),
    firstName: z.string().min(1, 'First name is required').transform((v) => v.trim()).optional(),
    lastName: z.string().min(1, 'Last name is required').transform((v) => v.trim()).optional(),
    role: z.enum([UserRole.USER, UserRole.ADMIN]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export type UpdateAdminUserDtoType = z.infer<typeof UpdateAdminUserDto>;
