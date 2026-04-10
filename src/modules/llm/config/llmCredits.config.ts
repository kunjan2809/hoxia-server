// ============================================================================
// LLM CREDIT / PRICING CONFIG (env-driven; defaults are zero until admin/billing)
// ============================================================================
//
// Override via environment variables. Future: admin UI can write settings and
// this module can read from DB instead—call sites stay the same.

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const parseEnvFloat = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
};

// ============================================================================
// CONFIG
// ============================================================================

/**
 * Global credit conversion rate (tokens → credits). Zero = no token billing yet.
 */
export const LLM_CREDIT_CONVERSION_RATE = parseEnvFloat('LLM_CREDIT_CONVERSION_RATE', 0);

/** Margin applied to input-credit portion (zero = disabled). */
export const LLM_INPUT_CREDIT_MARGIN_RATE = parseEnvFloat('LLM_INPUT_CREDIT_MARGIN_RATE', 0);

/** Margin applied to output-credit portion (zero = disabled). */
export const LLM_OUTPUT_CREDIT_MARGIN_RATE = parseEnvFloat('LLM_OUTPUT_CREDIT_MARGIN_RATE', 0);

/** Margin applied to any additional credit bucket (zero = disabled). */
export const LLM_ADDITIONAL_CREDIT_MARGIN_RATE = parseEnvFloat('LLM_ADDITIONAL_CREDIT_MARGIN_RATE', 0);

export interface LlmCreditRatesSnapshot {
  creditConversionRate: number;
  inputCreditMarginRate: number;
  outputCreditMarginRate: number;
  additionalCreditMarginRate: number;
}

export const getLlmCreditRatesSnapshot = (): LlmCreditRatesSnapshot => ({
  creditConversionRate: LLM_CREDIT_CONVERSION_RATE,
  inputCreditMarginRate: LLM_INPUT_CREDIT_MARGIN_RATE,
  outputCreditMarginRate: LLM_OUTPUT_CREDIT_MARGIN_RATE,
  additionalCreditMarginRate: LLM_ADDITIONAL_CREDIT_MARGIN_RATE,
});

/**
 * Computes billable credits from token counts. With default env (all zeros),
 * returns zeros. When rates are non-zero, extend this formula to match product rules.
 */
export const computeLlmCreditsFromTokens = (
  rates: LlmCreditRatesSnapshot,
  promptTokens: number | null,
  outputTokens: number | null
): { inputCredits: number; outputCredits: number; additionalCredits: number; totalCredits: number } => {
  const p = promptTokens ?? 0;
  const o = outputTokens ?? 0;
  const conv = rates.creditConversionRate;
  if (conv === 0) {
    return { inputCredits: 0, outputCredits: 0, additionalCredits: 0, totalCredits: 0 };
  }
  const rawInput = p * conv;
  const rawOutput = o * conv;
  const inputCredits = rawInput * (1 + rates.inputCreditMarginRate);
  const outputCredits = rawOutput * (1 + rates.outputCreditMarginRate);
  const additionalCredits = 0;
  const totalCredits = inputCredits + outputCredits + additionalCredits * (1 + rates.additionalCreditMarginRate);
  return { inputCredits, outputCredits, additionalCredits, totalCredits };
};
