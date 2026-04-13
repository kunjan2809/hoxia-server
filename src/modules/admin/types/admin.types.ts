// ============================================================================
// IMPORTS
// ============================================================================

// Types
import type { Prisma } from '../../../generated/prisma/client.js';
import type { ProjectStatus, ResearchRowStatus, UserRole, UserVerificationStatus } from '../../../generated/prisma/enums.js';

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
  verificationStatus: UserVerificationStatus;
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

export interface AdminUserOption {
  value: string;
  label: string;
}

export interface PaginatedAdminUserOptions {
  options: AdminUserOption[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminProjectSummary {
  id: string;
  userId: string;
  name: string;
  status: ProjectStatus;
  ownerEmail: string;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminProjects {
  projects: AdminProjectSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminProjectOption {
  value: string;
  label: string;
}

export interface PaginatedAdminProjectOptions {
  options: AdminProjectOption[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminResearchReportSummary {
  id: string;
  projectId: string;
  projectName: string;
  createdBy: string;
  ownerEmail: string;
  formalCompanyName: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminResearchReports {
  reports: AdminResearchReportSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminProjectDetail {
  id: string;
  userId: string;
  name: string;
  status: ProjectStatus;
  defaultHeaders: Prisma.JsonValue;
  campaignContext: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  createdAt: string;
  updatedAt: string;
  ownerEmail: string;
  ownerFirstName: string | null;
  ownerLastName: string | null;
}

export interface AdminCompanyRow {
  id: string;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminProjectCompanies {
  companies: AdminCompanyRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminCompanyResearchRow {
  id: string;
  companyId: string;
  companyName: string | null;
  researchStatus: ResearchRowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminProjectCompanyResearch {
  rows: AdminCompanyResearchRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminNestedResearchReportRow {
  id: string;
  formalCompanyName: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminNestedResearchReports {
  reports: AdminNestedResearchReportRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminResearchReportDetail {
  id: string;
  projectId: string;
  projectName: string;
  createdBy: string;
  ownerEmail: string;
  formalCompanyName: string | null;
  status: string | null;
  strategicSummary: string | null;
  growthSignals: string | null;
  hiringSignals: string | null;
  securityRiskSignals: string | null;
  leadershipSignals: string | null;
  keyHeadwinds: string | null;
  interpretation: string | null;
  createdAt: string;
  updatedAt: string;
  /** Hydration for the same deep-dive view as the product UI */
  companyId: string | null;
  companyResearchId: string | null;
  websiteUrl: string | null;
  inputCompanyName: string | null;
  researchData: Prisma.JsonValue | null;
  sources: Prisma.JsonValue | null;
  originalData: Prisma.JsonValue | null;
}
