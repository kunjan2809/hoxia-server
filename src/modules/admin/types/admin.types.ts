// ============================================================================
// IMPORTS
// ============================================================================

// Types
import type { UserRole } from '../../../generated/prisma/enums.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AdminUserSummary {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminCount: number;
}

export interface PaginatedAdminUsers {
  users: AdminUserSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
