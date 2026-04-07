// ============================================================================
// IMPORTS
// ============================================================================

import type { ResearchRowStatus, StrategicAngle } from '../../../generated/prisma/enums.js';
import type { Prisma } from '../../../generated/prisma/client.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CompanyResearchListItem {
  id: string;
  projectId: string;
  companyId: string;
  createdBy: string;
  researchStatus: ResearchRowStatus;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyResearchResponse extends CompanyResearchListItem {
  originalData: Prisma.JsonValue;
  researchData: Prisma.JsonValue | null;
  sources: Prisma.JsonValue | null;
  activeStrategy: StrategicAngle | null;
  researchError: string | null;
  metadata: Prisma.JsonValue | null;
}

export interface PaginatedCompanyResearch {
  items: CompanyResearchListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface FoundationStrategyItem {
  id: string;
  reportId: string;
  angle: StrategicAngle;
  strategicTrigger: string | null;
  whyThisMatters: string | null;
  assetsCreated: number;
  stakeholder: string | null;
  targetRole: string | null;
  strategicPosture: string | null;
  messagingDirection: string | null;
  confidence: string | null;
  confidenceReason: string | null;
  lastUpdated: string | null;
}

export interface ResearchReportListItem {
  id: string;
  projectId: string;
  companyResearchId: string | null;
  formalCompanyName: string | null;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchReportResponse extends ResearchReportListItem {
  createdBy: string;
  companyId: string | null;
  headquarters: string | null;
  strategicSummary: string | null;
  strategicVelocity: string | null;
  growthSignals: string | null;
  hiringSignals: string | null;
  securityRiskSignals: string | null;
  leadershipSignals: string | null;
  keyHeadwinds: string | null;
  interpretation: string | null;
  researchSources: Prisma.JsonValue | null;
  activeStrategy: StrategicAngle | null;
  metadata: Prisma.JsonValue | null;
  foundationStrategies: FoundationStrategyItem[];
}

export interface PaginatedResearchReports {
  items: ResearchReportListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
