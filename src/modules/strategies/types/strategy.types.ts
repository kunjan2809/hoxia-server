// ============================================================================
// IMPORTS
// ============================================================================

import type {
  Cadence,
  Objective,
  OutputType,
  StrategicAngle,
  StrategyTone,
  SenderPersona,
} from '../../../generated/prisma/enums.js';
import type { Prisma } from '../../../generated/prisma/client.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StrategyListItem {
  id: string;
  projectId: string;
  name: string;
  angle: StrategicAngle;
  objective: Objective;
  outputType: OutputType;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyResponse extends StrategyListItem {
  createdBy: string;
  companyId: string | null;
  companyResearchId: string | null;
  researchReportId: string | null;
  cadence: Cadence | null;
  tone: StrategyTone;
  senderPersona: SenderPersona;
  pacingNotes: string | null;
  metadata: Prisma.JsonValue | null;
}

export interface PaginatedStrategies {
  items: StrategyListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface StrategyStepItem {
  id: string;
  strategyId: string;
  role: string;
  day: number;
  stepOrder: number;
  assetName: string;
  channel: string;
  strategyAngle: StrategicAngle;
  confidence: string;
  preview: string;
  subjectLine: string | null;
  activationAssetId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyStepResponse extends StrategyStepItem {
  createdBy: string;
  companyId: string | null;
  companyResearchId: string | null;
  researchReportId: string | null;
  metadata: Prisma.JsonValue | null;
}

export interface PaginatedStrategySteps {
  items: StrategyStepItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ActivationAssetListItem {
  id: string;
  projectId: string;
  source: string;
  objective: Objective;
  outputType: OutputType;
  createdAt: string;
  updatedAt: string;
}

export interface ActivationAssetResponse extends ActivationAssetListItem {
  createdBy: string;
  companyResearchId: string | null;
  researchReportId: string | null;
  companyId: string | null;
  angleUsed: StrategicAngle;
  insightClaim: string;
  confidence: string;
  outputPreview: string;
  subjectLine: string | null;
  strategicAngle: string | null;
  whyItFits: string | null;
  approachGuidance: string | null;
  metadata: Prisma.JsonValue | null;
}

export interface PaginatedActivationAssets {
  items: ActivationAssetListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
