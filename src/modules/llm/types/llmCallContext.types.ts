// ============================================================================
// IMPORTS
// ============================================================================

import type { LlmOperationKind } from '../../../generated/prisma/enums.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Context persisted on each LlmApiCall row. All FKs optional except userId.
 */
export interface GeminiLlmCallContext {
  userId: string;
  projectId?: string | null;
  companyResearchId?: string | null;
  researchReportId?: string | null;
  strategyId?: string | null;
  activationAssetId?: string | null;
  companyId?: string | null;
  clientRequestId?: string | null;
  correlationId?: string | null;
}

export interface RecordGeminiCallBase extends GeminiLlmCallContext {
  operationKind: LlmOperationKind;
  latencyMs: number;
  groundingSearchUsed: boolean;
  retryAttempt?: number;
}

export interface RecordGeminiCallSuccessInput extends RecordGeminiCallBase {
  response: unknown;
}

export interface RecordGeminiCallFailureInput extends RecordGeminiCallBase {
  error: unknown;
}
