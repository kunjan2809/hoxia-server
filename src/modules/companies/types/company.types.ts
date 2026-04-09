// ============================================================================
// IMPORTS
// ============================================================================

// Prisma enums
import type { CompanyType, ProjectStatus } from '../../../generated/prisma/enums.js';
import type { Prisma } from '../../../generated/prisma/client.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CompanyListItem {
  id: string;
  projectId: string;
  createdBy: string;
  name: string;
  rowCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyListResponse extends CompanyListItem {
  headers: Prisma.JsonValue;
  campaignContext: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
}

export interface PaginatedCompanyLists {
  items: CompanyListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CompanyListItemRow {
  id: string;
  projectId: string;
  createdBy: string;
  type: CompanyType;
  companyListId: string | null;
  companyName: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyResponse extends CompanyListItemRow {
  payload: Prisma.JsonValue;
  metadata: Prisma.JsonValue | null;
}

export interface PaginatedCompanies {
  items: CompanyListItemRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface BulkCompaniesResult {
  createdCount: number;
  ids: string[];
}

export interface SaveCampaignContextResult {
  companyList: CompanyListResponse;
  projectCampaignContextSynced: boolean;
  projectStatus: ProjectStatus;
}
