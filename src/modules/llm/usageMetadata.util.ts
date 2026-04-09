// ============================================================================
// UTILITY FUNCTIONS — @google/genai generateContent response usage
// ============================================================================

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export interface ExtractedTokenUsage {
  promptTokenCount: number | null;
  outputTokenCount: number | null;
  totalTokenCount: number | null;
  thoughtsTokenCount: number | null;
}

export const extractTokenUsageFromGenerateContentResponse = (response: unknown): ExtractedTokenUsage => {
  if (!isRecord(response)) {
    return { promptTokenCount: null, outputTokenCount: null, totalTokenCount: null, thoughtsTokenCount: null };
  }
  const umRaw = response['usageMetadata'];
  if (!isRecord(umRaw)) {
    return { promptTokenCount: null, outputTokenCount: null, totalTokenCount: null, thoughtsTokenCount: null };
  }
  const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const prompt = num(umRaw['promptTokenCount']);
  const candidates = num(umRaw['candidatesTokenCount']);
  const total = num(umRaw['totalTokenCount']);
  const thoughts = num(umRaw['thoughtsTokenCount']);
  const totalFallback =
    total ?? (prompt !== null && candidates !== null ? prompt + candidates : prompt ?? candidates ?? null);
  return {
    promptTokenCount: prompt,
    outputTokenCount: candidates,
    totalTokenCount: totalFallback,
    thoughtsTokenCount: thoughts,
  };
};

export const extractGroundingSearchUsed = (response: unknown): boolean => {
  if (!isRecord(response)) {
    return false;
  }
  const candidates = response['candidates'];
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return false;
  }
  const first = candidates[0];
  if (!isRecord(first)) {
    return false;
  }
  const gm = first['groundingMetadata'];
  if (!isRecord(gm)) {
    return false;
  }
  const chunks = gm['groundingChunks'];
  return Array.isArray(chunks) && chunks.length > 0;
};
