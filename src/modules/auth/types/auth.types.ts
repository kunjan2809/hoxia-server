// ============================================================================
// IMPORTS
// ============================================================================

// Types
import type { UserRole, UserVerificationStatus } from '../../../generated/prisma/enums.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SessionInfo {
  userAgent?: string;
  ipAddress?: string;
}

export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  verificationStatus: UserVerificationStatus;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export interface OtpResponse {
  message: string;
}

