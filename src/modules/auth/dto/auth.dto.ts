// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const RegisterDto = z.object({
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
});

export type RegisterDtoType = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Email must be a valid email address')
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginDtoType = z.infer<typeof LoginDto>;

export const RequestMagicLinkDto = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Email must be a valid email address')
    .transform((value) => value.trim().toLowerCase()),
});

export type RequestMagicLinkDtoType = z.infer<typeof RequestMagicLinkDto>;

export const ResendVerificationDto = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Email must be a valid email address')
    .transform((value) => value.trim().toLowerCase()),
});

export type ResendVerificationDtoType = z.infer<typeof ResendVerificationDto>;

export const VerifyMagicLinkQueryDto = z.object({
  token: z
    .string()
    .min(1, 'Token is required'),
});

export type VerifyMagicLinkQueryDtoType = z.infer<typeof VerifyMagicLinkQueryDto>;

export const RefreshTokenDto = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required')
    .optional(),
});

export type RefreshTokenDtoType = z.infer<typeof RefreshTokenDto>;

