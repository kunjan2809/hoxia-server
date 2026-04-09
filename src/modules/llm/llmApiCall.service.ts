// ============================================================================
// IMPORTS
// ============================================================================

// Config
import { prisma } from '../../config/prisma.js';

// Prisma
import { Prisma } from '../../generated/prisma/client.js';
import { LlmCallStatus, LlmProvider } from '../../generated/prisma/enums.js';

// Gemini
import { isGeminiRateLimitError } from '../gemini/gemini.client.js';
import { GEMINI_MODEL_NAME } from '../gemini/config/gemini.config.js';

// Types
import type { RecordGeminiCallFailureInput, RecordGeminiCallSuccessInput } from './types/llmCallContext.types.js';

// Utils
import { createLogger } from '../../utils/helpers/logger.js';
import { computeLlmCreditsFromTokens, getLlmCreditRatesSnapshot } from './config/llmCredits.config.js';
import { extractGroundingSearchUsed, extractTokenUsageFromGenerateContentResponse } from './usageMetadata.util.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('LlmApiCallService');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const errorToMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const mapFailureStatus = (error: unknown): LlmCallStatus => {
  if (isGeminiRateLimitError(error)) {
    return LlmCallStatus.RATE_LIMITED;
  }
  const msg = errorToMessage(error).toLowerCase();
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return LlmCallStatus.TIMEOUT;
  }
  return LlmCallStatus.FAILURE;
};

const extractHttpStatus = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const r = error as Record<string, unknown>;
  const status = r['status'] ?? r['statusCode'];
  if (typeof status === 'number') {
    return String(status);
  }
  if (typeof status === 'string') {
    return status;
  }
  return null;
};

// ============================================================================
// SERVICE
// ============================================================================

export const recordGeminiSuccess = async (input: RecordGeminiCallSuccessInput): Promise<void> => {
  const tokens = extractTokenUsageFromGenerateContentResponse(input.response);
  const rates = getLlmCreditRatesSnapshot();
  const credits = computeLlmCreditsFromTokens(rates, tokens.promptTokenCount, tokens.outputTokenCount);
  const grounding =
    input.groundingSearchUsed || extractGroundingSearchUsed(input.response);

  try {
    await prisma.llmApiCall.create({
      data: {
        userId: input.userId,
        projectId: input.projectId ?? null,
        companyResearchId: input.companyResearchId ?? null,
        researchReportId: input.researchReportId ?? null,
        activationAssetId: input.activationAssetId ?? null,
        strategyId: input.strategyId ?? null,
        companyId: input.companyId ?? null,
        provider: LlmProvider.GOOGLE,
        modelId: GEMINI_MODEL_NAME,
        operationKind: input.operationKind,
        status: LlmCallStatus.SUCCESS,
        promptTokenCount: tokens.promptTokenCount,
        outputTokenCount: tokens.outputTokenCount,
        totalTokenCount: tokens.totalTokenCount,
        thoughtsTokenCount: tokens.thoughtsTokenCount,
        creditConversionRate: rates.creditConversionRate,
        inputCredits: credits.inputCredits,
        outputCredits: credits.outputCredits,
        additionalCredits: credits.additionalCredits,
        inputCreditMarginRate: rates.inputCreditMarginRate,
        outputCreditMarginRate: rates.outputCreditMarginRate,
        additionalCreditMarginRate: rates.additionalCreditMarginRate,
        totalCredits: credits.totalCredits,
        latencyMs: input.latencyMs,
        groundingSearchUsed: grounding,
        clientRequestId: input.clientRequestId ?? null,
        correlationId: input.correlationId ?? null,
        retryAttempt: input.retryAttempt ?? 0,
        metadata: Prisma.JsonNull,
      },
    });
  } catch (err) {
    logger.error(`Failed to persist LlmApiCall success row: ${errorToMessage(err)}`);
  }
};

export const recordGeminiFailure = async (input: RecordGeminiCallFailureInput): Promise<void> => {
  const rates = getLlmCreditRatesSnapshot();
  const status = mapFailureStatus(input.error);

  try {
    await prisma.llmApiCall.create({
      data: {
        userId: input.userId,
        projectId: input.projectId ?? null,
        companyResearchId: input.companyResearchId ?? null,
        researchReportId: input.researchReportId ?? null,
        activationAssetId: input.activationAssetId ?? null,
        strategyId: input.strategyId ?? null,
        companyId: input.companyId ?? null,
        provider: LlmProvider.GOOGLE,
        modelId: GEMINI_MODEL_NAME,
        operationKind: input.operationKind,
        status,
        promptTokenCount: null,
        outputTokenCount: null,
        totalTokenCount: null,
        thoughtsTokenCount: null,
        creditConversionRate: rates.creditConversionRate,
        inputCredits: 0,
        outputCredits: 0,
        additionalCredits: 0,
        inputCreditMarginRate: rates.inputCreditMarginRate,
        outputCreditMarginRate: rates.outputCreditMarginRate,
        additionalCreditMarginRate: rates.additionalCreditMarginRate,
        totalCredits: 0,
        latencyMs: input.latencyMs,
        groundingSearchUsed: input.groundingSearchUsed,
        clientRequestId: input.clientRequestId ?? null,
        correlationId: input.correlationId ?? null,
        retryAttempt: input.retryAttempt ?? 0,
        httpStatusCode: extractHttpStatus(input.error),
        errorMessage: errorToMessage(input.error),
        metadata: Prisma.JsonNull,
      },
    });
  } catch (err) {
    logger.error(`Failed to persist LlmApiCall failure row: ${errorToMessage(err)}`);
  }
};
