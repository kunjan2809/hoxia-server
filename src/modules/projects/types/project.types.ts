// ============================================================================
// IMPORTS
// ============================================================================

// Types
import type { ProjectStatus } from '../../../generated/prisma/enums.js';
import type { Prisma } from '../../../generated/prisma/client.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProjectListItem {
  id: string;
  userId: string;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  id: string;
  userId: string;
  name: string;
  status: ProjectStatus;
  defaultHeaders: Prisma.JsonValue;
  campaignContext: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProjectList {
  items: ProjectListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
