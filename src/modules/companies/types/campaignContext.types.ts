// ============================================================================
// CAMPAIGN CONTEXT (CompanyList.campaignContext canonical shape, version 1)
// ============================================================================

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CampaignScope = 'single' | 'list';

export interface ToneOfVoiceAssetV1 {
  originalFileName: string;
  /** Path relative to LOCAL_UPLOAD_ROOT, POSIX-style segments. */
  storedRelativePath: string;
  mimeType: string;
  sizeBytes: number;
}

export interface CampaignContextV1 {
  version: 1;
  scope: CampaignScope;
  targetJobTitles: string;
  productServiceSolution: string;
  importantConsiderations: string;
  outputLanguage: string;
  toneOfVoiceAsset: ToneOfVoiceAssetV1 | null;
}
