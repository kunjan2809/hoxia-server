// ============================================================================
// GEMINI TYPES
// ============================================================================

export interface UserContext {
  campaignGoal: string;
  proposition: string;
  audience: string;
  language?: string;
  influenceFocus?: string;
  importantConsiderations?: string;
  toneOfVoiceContent?: string;
}

export interface CampaignFoundation {
  trigger: string;
  whyNow: string;
  stakeholder: string;
  posture: string;
  messagingDirection: string;
  confidence: 'High' | 'Medium' | 'Low';
  confidenceReason: string;
  lastUpdated: string;
}

export interface ActivationContext {
  companyName: string;
  angle: string;
  researchData: ResearchResult;
  foundation: CampaignFoundation;
}

export interface ResearchResult {
  formalCompanyName: string;
  summary: string;
  industry: string;
  headquarters: string;
  growthSignals?: string;
  fundingSignals?: string;
  hiringSignals?: string;
  leadershipSignals?: string;
  securitySignals?: string;
  keyRisks?: string;
  internalInterpretation?: string;
  primaryFoundation: CampaignFoundation;
  supportingFoundation: CampaignFoundation;
  contrarianFoundation: CampaignFoundation;
  strategicDirection: string;
  operatingModel: string;
  changeVelocity: string;
}

export interface ResearchResponse {
  data: ResearchResult;
  sources: string[];
}

export interface AssetConfig {
  objective: string;
  type: string;
  tone: string;
  persona: string;
}

export interface GeneratedActivationAsset {
  content: string;
  subject_line?: string;
  strategic_angle: string;
  objective_fit: string;
  approach_guidance: string;
}

export interface BulkActivationAccount {
  company_name: string;
  industry?: string;
  region?: string;
}

export interface BulkResolvedAngle {
  angle_used: string;
  confidence: string;
  campaign_foundation_text: string;
}

export interface BulkOutputConfig {
  objective: string;
  output_type: string;
  tone: string;
  sender_persona: string;
}

export interface BulkActivationPayload {
  accounts: BulkActivationAccount[];
  resolved_angles: BulkResolvedAngle[];
  output_config: BulkOutputConfig;
}

export interface GeneratedBulkActivationAsset {
  company_name: string;
  angle_used: string;
  confidence: string;
  generated_text: string;
  subject_line?: string;
}

export interface SequenceConfig {
  objective: string;
  cadence: string;
  tone: string;
  persona: string;
}

export interface TouchpointConfig {
  objective: string;
  tone: string;
  persona: string;
}

export interface GeneratedSequenceStep {
  output_type: string;
  content: string;
  subject_line?: string;
  strategic_angle: string;
  objective_fit: string;
  approach_guidance: string;
}

export type GeminiApiRequestBody =
  | { action: 'verifyDataStatus'; payload: Record<string, never> }
  | {
      action: 'researchCompany';
      payload: {
        companyName: string;
        url: string;
        linkedinUrl: string;
        extraContext: string;
        userContext: UserContext;
      };
    }
  | {
      action: 'generateCampaignAssets';
      payload: {
        activation: ActivationContext;
        user: UserContext;
        config: AssetConfig;
        numVariants: number;
      };
    }
  | {
      action: 'generateBulkCampaignAssets';
      payload: {
        payload: BulkActivationPayload;
        user: UserContext;
      };
    }
  | {
      action: 'generateMultiTouchSequence';
      payload: {
        activation: ActivationContext;
        user: UserContext;
        config: SequenceConfig;
      };
    }
  | {
      action: 'generateMissingTouchpoints';
      payload: {
        activation: ActivationContext;
        user: UserContext;
        config: TouchpointConfig;
        missingTypes: string[];
      };
    };
