// ============================================================================
// GEMINI SERVICE
// ============================================================================

// External Libraries
import { Type } from '@google/genai';

// Client
import { GeminiClient } from './gemini.client.js';

// Config
import { GEMINI_MODEL_NAME, WRITING_PRINCIPLES } from './config/gemini.config.js';

// Types
import type {
  ActivationContext,
  AssetConfig,
  BulkActivationPayload,
  CampaignFoundation,
  GeneratedActivationAsset,
  GeneratedBulkActivationAsset,
  GeneratedSequenceStep,
  ResearchResponse,
  ResearchResult,
  SequenceConfig,
  TouchpointConfig,
  UserContext,
} from './types/gemini.types.js';

// Utils
import { createLogger } from '../../utils/helpers/logger.js';

const logger = createLogger('GeminiService');

const CADENCE_INSTRUCTIONS: Record<string, string> = {
  'Quick Breakthrough': `
      - Structure: 6-7 total touchpoints delivered across approximately 7-14 days.
      - Spacing between touches should typically be 1–2 days.
      - Use a mix of email, LinkedIn messages, and short sales nudges.
      `,
  'Standard Prospecting': `
      - Structure: 10-12 total touchpoints delivered across approximately 6-8 weeks.
      - Spacing between touches should typically be 3-6 days.
      - Use a mix of email openers, LinkedIn interactions, follow-ups, and insight-driven messages.
      `,
  'Long-Game Nurture': `
      - Structure: 14–16 total touchpoints delivered across approximately 10-12 weeks.
      - Spacing between touches should typically be 5-10 days.
      - Include a variety of content types such as insight emails, LinkedIn engagement, case study references, and soft follow-ups.
      `,
};

const DEFAULT_CADENCE_INSTRUCTION = CADENCE_INSTRUCTIONS['Quick Breakthrough']!;

interface GroundingChunkShape {
  web?: { uri?: string };
  maps?: { uri?: string };
}

const buildFallbackFoundation = (): CampaignFoundation => ({
  trigger: 'Not found',
  whyNow: 'N/A',
  stakeholder: 'N/A',
  posture: 'N/A',
  messagingDirection: 'N/A',
  confidence: 'Low',
  confidenceReason: 'No data available.',
  lastUpdated: new Date().toISOString(),
});

export class GeminiService {
  private static instance: GeminiService | undefined;

  private constructor() {
    logger.info('GeminiService initialised (singleton)');
  }

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private buildToneInstruction(toneOfVoiceContent?: string): string {
    return toneOfVoiceContent ? `USER-PROVIDED TONAL GUIDELINES: "${toneOfVoiceContent}"` : '';
  }

  private parseJSON<T>(text: string | undefined, fallback: T): T {
    try {
      return JSON.parse(text ?? '') as T;
    } catch {
      logger.error('Failed to parse Gemini JSON response');
      return fallback;
    }
  }

  async verifyDataStatus(): Promise<{ ok: true; model: typeof GEMINI_MODEL_NAME; checkedAt: string }> {
    const client = GeminiClient.getInstance();
    await client.call(
      () =>
        client.models.generateContent({
          model: GEMINI_MODEL_NAME,
          contents: 'Reply with OK',
        }),
      'verify',
    );
    return { ok: true, model: GEMINI_MODEL_NAME, checkedAt: new Date().toISOString() };
  }

  async researchCompany(
    companyName: string,
    url: string,
    linkedinUrl: string,
    extraContext: string,
    userContext: UserContext,
  ): Promise<ResearchResponse> {
    const client = GeminiClient.getInstance();
    logger.info(`Researching company: ${companyName}`);

    const prompt = `
    You are an elite corporate intelligence officer and strategic sales consultant.
    Your mission is to perform a deep-dive analysis of the target company using Google Search grounding.
    YOU MUST USE GOOGLE SEARCH to find the most recent, verifiable news, filings, and official announcements.

    **Target Company Profile:**
    - Name: ${companyName || 'Unknown'}
    - Website: ${url || 'Not provided'}
    - LinkedIn: ${linkedinUrl || 'Not provided'}
    - Additional Input Data: ${extraContext}

    **Strategic Lens (Our Business Context):**
    - Campaign Goal: ${userContext.campaignGoal || 'Not specified'}
    - Influence Focus: ${userContext.influenceFocus || 'Not specified'}
    - What we sell (Proposition): ${userContext.proposition}
    - Who we target (Audience): ${userContext.audience}
    - Important Considerations: ${userContext.importantConsiderations || 'None'}
    - OUTPUT LANGUAGE: ${userContext.language || 'English'} (ALL text in the JSON must be in this language)

    --- RESEARCH FRAMEWORK ---

    1. **Identity & Context:**
       - Official, full legal or trade name.
       - Headquarters location and core industry.

    2. **Signals Layer (Hard Evidence):**
       Find events from the last 12 months with verifiable news links.
       - Growth, Funding, Hiring, Leadership, Security, Risks.

    3. **Interpretation Layer:**
       How facts translate to internal leadership pressure. Provide 2-4 professional, strategic bullets.

    4. **Campaign Foundations (Strategic Entry Points):**
       Develop 3 distinct angles for engagement. NO SLOGANS. NO SALES COPY.
       For each angle, provide:
       - Trigger: (A proper summary of the strategic trigger rather than a short statement. A bad summary would be for example "Execution of the Himma Transformation Programme" while a good summary would be "Aggressive scaling of Treasury & Investment digital capabilities under the Himma transformation program led by head of IT John Smith").
       - whyNow: (STRICT RULES: 2-3 sentences referencing specific change/implication).
       - Stakeholder: (Who cares most).
       - Posture: (Strategic entry posture).
       - Messaging Direction: (Advice on positioning).
       - confidence: (High/Medium/Low).
       - confidenceReason: (A summary of the reason for the confidence level. Max 25 words. Describe the precise reason, e.g., widely cited by trusted news sources, reported in annual report, or insight is old/not widely cited).

    5. **Strategic Dimensions:**
       - Strategic Direction, Operating Model, Change Velocity.

    **CRITICAL CONSTRAINTS:**
    - NO URLs inside the JSON string values.
    - ALL JSON CONTENT MUST BE IN ${userContext.language || 'English'}.
    - NO FIRST/SECOND PERSON: Do NOT use "You", "Your", "We", "Our", "I" in 'whyNow', 'trigger', or 'interpretation'. Describe the situation objectively.
    - USE VARIED THIRD-PERSON SUBJECTS: Do not rely solely on "This" or "It". You MUST actively alternate between:
      1. "The company" / "The company's"
      2. "Their" / "Theirs"
      3. The actual Company Name (e.g. "${companyName}'s current architecture..." or "Challenge the sustainability of ${companyName}'s growth...").
`;

    const response = await client.call(
      () =>
        client.models.generateContent({
          model: GEMINI_MODEL_NAME,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                formalCompanyName: { type: Type.STRING },
                summary: { type: Type.STRING },
                industry: { type: Type.STRING },
                headquarters: { type: Type.STRING },
                growthSignals: { type: Type.STRING },
                fundingSignals: { type: Type.STRING },
                hiringSignals: { type: Type.STRING },
                leadershipSignals: { type: Type.STRING },
                securitySignals: { type: Type.STRING },
                keyRisks: { type: Type.STRING },
                internalInterpretation: { type: Type.STRING },
                primaryFoundation: {
                  type: Type.OBJECT,
                  properties: {
                    trigger: { type: Type.STRING },
                    whyNow: { type: Type.STRING },
                    stakeholder: { type: Type.STRING },
                    posture: { type: Type.STRING },
                    messagingDirection: { type: Type.STRING },
                    confidence: { type: Type.STRING },
                    confidenceReason: { type: Type.STRING },
                  },
                  required: [
                    'trigger',
                    'whyNow',
                    'stakeholder',
                    'posture',
                    'messagingDirection',
                    'confidence',
                    'confidenceReason',
                  ],
                },
                supportingFoundation: {
                  type: Type.OBJECT,
                  properties: {
                    trigger: { type: Type.STRING },
                    whyNow: { type: Type.STRING },
                    stakeholder: { type: Type.STRING },
                    posture: { type: Type.STRING },
                    messagingDirection: { type: Type.STRING },
                    confidence: { type: Type.STRING },
                    confidenceReason: { type: Type.STRING },
                  },
                  required: [
                    'trigger',
                    'whyNow',
                    'stakeholder',
                    'posture',
                    'messagingDirection',
                    'confidence',
                    'confidenceReason',
                  ],
                },
                contrarianFoundation: {
                  type: Type.OBJECT,
                  properties: {
                    trigger: { type: Type.STRING },
                    whyNow: { type: Type.STRING },
                    stakeholder: { type: Type.STRING },
                    posture: { type: Type.STRING },
                    messagingDirection: { type: Type.STRING },
                    confidence: { type: Type.STRING },
                    confidenceReason: { type: Type.STRING },
                  },
                  required: [
                    'trigger',
                    'whyNow',
                    'stakeholder',
                    'posture',
                    'messagingDirection',
                    'confidence',
                    'confidenceReason',
                  ],
                },
                strategicDirection: { type: Type.STRING },
                operatingModel: { type: Type.STRING },
                changeVelocity: { type: Type.STRING },
              },
              required: [
                'formalCompanyName',
                'summary',
                'industry',
                'headquarters',
                'primaryFoundation',
                'supportingFoundation',
                'contrarianFoundation',
                'strategicDirection',
                'operatingModel',
                'changeVelocity',
              ],
            },
          },
        }),
      'research',
    );

    const text = response.text ?? '';
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = (rawChunks as GroundingChunkShape[])
      .map((chunk) => chunk.web?.uri ?? chunk.maps?.uri)
      .filter((uri): uri is string => Boolean(uri));

    let parsedData: ResearchResult;
    try {
      parsedData = JSON.parse(text.trim()) as ResearchResult;
    } catch {
      logger.error(`Failed to parse research response for company: ${companyName}`);
      throw new Error('Invalid intelligence structure returned.');
    }

    const now = new Date().toISOString();
    const fallbackFoundation = buildFallbackFoundation();

    parsedData.primaryFoundation = parsedData.primaryFoundation ?? { ...fallbackFoundation };
    parsedData.supportingFoundation = parsedData.supportingFoundation ?? { ...fallbackFoundation };
    parsedData.contrarianFoundation = parsedData.contrarianFoundation ?? { ...fallbackFoundation };
    parsedData.primaryFoundation.lastUpdated = now;
    parsedData.supportingFoundation.lastUpdated = now;
    parsedData.contrarianFoundation.lastUpdated = now;
    if (!parsedData.formalCompanyName) {
      parsedData.formalCompanyName = companyName || 'Unknown Company';
    }

    logger.info(`Research complete for: ${companyName} (${sources.length} sources found)`);

    return { data: parsedData, sources };
  }

  async generateCampaignAssets(
    activation: ActivationContext,
    user: UserContext,
    config: AssetConfig,
    numVariants = 3,
  ): Promise<GeneratedActivationAsset[]> {
    const client = GeminiClient.getInstance();
    const { researchData, foundation, companyName, angle } = activation;
    const isEmail = config.type.toLowerCase().includes('email');

    logger.info(`Generating ${numVariants} campaign asset variants for: ${companyName}`);

    const userToneInstruction = this.buildToneInstruction(user.toneOfVoiceContent);

    const systemInstruction = `
    You are a Strategic Outreach Advisor. 
    Your role is to generate IDEAS for outreach assets derived from a specific Strategic Angle.
    
    CRITICAL: 
    1. You are generating IDEAS and CONCEPTUAL GUIDANCE, not finished copy.
    2. You MUST provide clear, analytical reasoning for the strategy and approach.
    3. Every field in the response object is MANDATORY. Do not leave them empty.
    4. Focus on clarity of thinking. Your job is to guide the user's logic so they can write their own message.

    ${WRITING_PRINCIPLES}

    ALIGN WITH CAMPAIGN GOAL: ${user.campaignGoal}
    CONSIDER THESE CONSTRAINTS: ${user.importantConsiderations || 'None'}
    ${userToneInstruction}
  `;

    const prompt = `
    Company: ${companyName}
    Summary: ${researchData.summary}
    Strategic Angle: ${angle}
    Trigger: ${foundation.trigger}
    Why Now: ${foundation.whyNow}
    Stakeholder: ${foundation.stakeholder}
    Posture: ${foundation.posture}
    Messaging Direction: ${foundation.messagingDirection}
    
    Our Offering: ${user.proposition}
    Target Audience: ${user.audience}
    
    Asset Requirements:
    - Objective: ${config.objective}
    - Output Type: ${config.type}
    - Tone: ${config.tone}
    - Sender Persona: ${config.persona}
    - LANGUAGE: ${user.language || 'English'}
    
    Generate ${numVariants} variants. 
    For each variant, you MUST populate these fields with substantial detail:
    1. content: A draft outreach text (concept). If "LinkedIn connection note", keep under 200 chars.
    2. subject_line: ${isEmail ? 'Generate a subject line following the SUBJECT LINE RULES (Max 60 chars, front-loaded).' : 'Leave empty (not an email).'}
    3. strategic_angle: 2-3 sentences explaining the specific strategic leverage point for this draft.
    4. objective_fit: 2-3 sentences explaining why this specific idea effectively addresses the objective: "${config.objective}".
    5. approach_guidance: Practical advice for the user on how to rewrite or deliver this message (e.g., what to lean into, what to avoid).

    MANDATORY: NO EMPTY VALUES for reasoning. NO PLACEHOLDERS. Each field must contain unique analytical reasoning for that specific variant.
    Return as a JSON array of objects.
  `;

    const response = await client.call(
      () =>
        client.models.generateContent({
          model: GEMINI_MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  content: { type: Type.STRING },
                  subject_line: { type: Type.STRING },
                  strategic_angle: { type: Type.STRING },
                  objective_fit: { type: Type.STRING },
                  approach_guidance: { type: Type.STRING },
                },
                required: ['content', 'strategic_angle', 'objective_fit', 'approach_guidance'],
              },
            },
          },
        }),
      'activation',
    );

    const parsed = this.parseJSON<GeneratedActivationAsset[]>(response.text, []);
    logger.info(`Generated ${parsed.length} campaign assets for: ${companyName}`);
    return parsed.map((item): GeneratedActivationAsset => {
      const base: GeneratedActivationAsset = {
        content: item.content,
        strategic_angle: item.strategic_angle,
        objective_fit: item.objective_fit,
        approach_guidance: item.approach_guidance,
      };
      if (isEmail && item.subject_line !== undefined && item.subject_line !== '') {
        return { ...base, subject_line: item.subject_line };
      }
      return base;
    });
  }

  async generateBulkCampaignAssets(
    payload: BulkActivationPayload,
    user: UserContext,
  ): Promise<GeneratedBulkActivationAsset[]> {
    const client = GeminiClient.getInstance();
    const { accounts, resolved_angles, output_config } = payload;
    const outputType = output_config.output_type.toLowerCase();
    const isSubjectLineOnly = outputType.includes('subject line');
    const isEmailBody = outputType.includes('email') && !isSubjectLineOnly;

    logger.info(`Generating bulk assets for ${accounts.length} companies`);

    const userToneInstruction = this.buildToneInstruction(user.toneOfVoiceContent);

    const systemInstruction = `
    You are HOXIA's Bulk Activation Writer.
    Generate company-specific strategic outputs for MULTIPLE target companies.
    
    ${WRITING_PRINCIPLES}

    ALIGN WITH CAMPAIGN GOAL: ${user.campaignGoal}
    CONSIDER THESE CONSTRAINTS: ${user.importantConsiderations || 'None'}
    ${userToneInstruction}

    STRICT RULES:
    1) ONE output per company.
    2) If Output Type is "LinkedIn connection note", the output MUST be under 200 characters.
    3) If Output Type is "Email subject lines", the 'generated_text' MUST be a single line under 60 characters. DO NOT write body copy.
    4) ${isEmailBody ? 'Generate a SEPARATE subject_line field following the SUBJECT LINE RULES (Max 60 chars, front-loaded).' : 'Include a subject_line field but leave it empty.'}
  `;

    const prompt = `
    Our Offering: ${user.proposition}
    Target Audience: ${user.audience}
    
    Batch Configuration:
    - Objective: ${output_config.objective}
    - Output Type: ${output_config.output_type}
    - Tone: ${output_config.tone}
    - Persona: ${output_config.sender_persona}
    - LANGUAGE: ${user.language || 'English'}

    Batch Data:
    ${accounts
      .map((acc, i) => {
        const angle = resolved_angles[i];
        return `[${i}] ${acc.company_name} | Angle: ${angle?.angle_used ?? 'N/A'} | Foundation: ${angle?.campaign_foundation_text ?? 'N/A'}`;
      })
      .join('\n')}

    Return JSON array of objects with {company_name, angle_used, confidence, generated_text, subject_line}. 
    
    CRITICAL CONSTRAINT CHECK:
    - IF Output Type is "Email subject lines" -> 'generated_text' MUST be < 60 characters.
    - IF Output Type is "LinkedIn connection note" -> 'generated_text' MUST be < 200 characters.
  `;

    const response = await client.call(
      () =>
        client.models.generateContent({
          model: GEMINI_MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company_name: { type: Type.STRING },
                  angle_used: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                  generated_text: { type: Type.STRING },
                  subject_line: { type: Type.STRING },
                },
                required: ['company_name', 'angle_used', 'confidence', 'generated_text'],
              },
            },
          },
        }),
      'activation_bulk',
    );

    const raw = this.parseJSON<GeneratedBulkActivationAsset[]>(response.text, []);
    const result = raw.map((item): GeneratedBulkActivationAsset => {
      const trimmedSubject = item.subject_line?.trim();
      const row: GeneratedBulkActivationAsset = {
        company_name: item.company_name.trim(),
        angle_used: item.angle_used.trim(),
        confidence: item.confidence,
        generated_text: item.generated_text.trim(),
      };
      if (trimmedSubject !== undefined && trimmedSubject !== '') {
        return { ...row, subject_line: trimmedSubject };
      }
      return row;
    });

    logger.info(`Bulk assets generated for ${result.length} companies`);
    return result;
  }

  async generateMultiTouchSequence(
    activation: ActivationContext,
    user: UserContext,
    config: SequenceConfig,
  ): Promise<GeneratedSequenceStep[]> {
    const client = GeminiClient.getInstance();
    const { researchData, foundation, companyName, angle } = activation;
    const cadence = config.cadence;
    const channelInstructions = CADENCE_INSTRUCTIONS[cadence] ?? DEFAULT_CADENCE_INSTRUCTION;

    logger.info(`Generating multi-touch sequence for: ${companyName} (cadence: ${cadence})`);

    const userToneInstruction = this.buildToneInstruction(user.toneOfVoiceContent);

    const systemInstruction = `
    You are a Strategic Campaign Architect.
    Your role is to design a multi-touch outreach sequence based on a specific Strategic Angle and the selected Campaign Cadence: ${cadence}.

    CRITICAL:
    1. You are generating a COHESIVE SEQUENCE. Steps must flow logically (e.g., Opener -> Value Add -> Bump -> Break-up).
    2. You MUST provide clear, analytical reasoning for each step.
    3. Every field in the response object is MANDATORY. Do not leave them empty.
    4. Vary communication channels across the sequence where possible.
    5. Ensure each touchpoint progresses the conversation rather than repeating the same message.
    6. Use insights from the research stage to personalise each message.
    7. Do not generate placeholder text or instructions such as "action required".
    8. All assets must include complete, ready-to-send copy appropriate to the asset type.
    
    ${WRITING_PRINCIPLES}

    ALIGN WITH CAMPAIGN GOAL: ${user.campaignGoal}
    CONSIDER THESE CONSTRAINTS: ${user.importantConsiderations || 'None'}
    ${userToneInstruction}
  `;

    const prompt = `
    Company: ${companyName}
    Summary: ${researchData.summary}
    Strategic Angle: ${angle}
    Trigger: ${foundation.trigger}
    Why Now: ${foundation.whyNow}
    Stakeholder: ${foundation.stakeholder}
    Posture: ${foundation.posture}
    Messaging Direction: ${foundation.messagingDirection}
    
    Our Offering: ${user.proposition}
    Target Audience: ${user.audience}
    
    Sequence Requirements:
    - Objective: ${config.objective}
    - Campaign Cadence: ${cadence}
    - Tone: ${config.tone}
    - Sender Persona: ${config.persona}
    - LANGUAGE: ${user.language || 'English'}
    
    MANDATORY STRUCTURAL RULES:
    1. ${channelInstructions}
    2. The FIRST step MUST be an opener message (e.g. 'Email opener', 'LinkedIn connection note', or 'Sales call opener').
    3. Ensure the sequence escalates or nurtures appropriately based on the 'Posture'.
    
    Generate the sequential steps adhering to the channel mix and cadence above.

    For each step, populate:
    1. output_type: e.g., "Email opener", "LinkedIn connection note", "Email follow-up", "Call script", "LinkedIn message", "Email break-up".
    2. content: The message draft.
    3. subject_line: (For emails only. STRICT: Max 60 chars, front-loaded).
    4. strategic_angle: Why this step in this position?
    5. objective_fit: How it moves the goal forward.
    6. approach_guidance: Delivery advice.

    Return as a JSON array of objects.
  `;

    const response = await client.call(
      () =>
        client.models.generateContent({
          model: GEMINI_MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  output_type: { type: Type.STRING },
                  content: { type: Type.STRING },
                  subject_line: { type: Type.STRING },
                  strategic_angle: { type: Type.STRING },
                  objective_fit: { type: Type.STRING },
                  approach_guidance: { type: Type.STRING },
                },
                required: ['output_type', 'content', 'strategic_angle', 'objective_fit', 'approach_guidance'],
              },
            },
          },
        }),
      'strategy_sequence',
    );

    const result = this.parseJSON<GeneratedSequenceStep[]>(response.text, []);
    logger.info(`Multi-touch sequence generated: ${result.length} steps for ${companyName}`);
    return result;
  }

  async generateMissingTouchpoints(
    activation: ActivationContext,
    user: UserContext,
    config: TouchpointConfig,
    missingTypes: string[],
  ): Promise<GeneratedSequenceStep[]> {
    const client = GeminiClient.getInstance();
    const { researchData, foundation, companyName, angle } = activation;
    const firstMissing = missingTypes[0] ?? 'touchpoint';

    logger.info(
      `Generating ${missingTypes.length} missing touchpoints for: ${companyName} (${missingTypes.join(', ')})`,
    );

    const userToneInstruction = this.buildToneInstruction(user.toneOfVoiceContent);

    const systemInstruction = `
    You are a Strategic Campaign Architect.
    Your role is to generate specific missing touchpoints for a campaign sequence based on a specific Strategic Angle.

    CRITICAL:
    1. You MUST generate FULL, UNTRUNCATED COPY for each touchpoint.
    2. Adhere strictly to the rules of their asset type:
       - LinkedIn connection notes must respect the platform's character limit (under 200 chars).
       - LinkedIn follow-ups must follow LinkedIn message formatting rules.
       - Email assets must include full body copy and a suggested subject line.
       - Sales call openers must include a complete talk track.
    3. NO PLACEHOLDER TEXT. Do not use phrases like "generate this asset", "to be completed", or meta commentary.
    4. All generated touchpoints must appear as fully complete assets.
    
    ${WRITING_PRINCIPLES}

    ALIGN WITH CAMPAIGN GOAL: ${user.campaignGoal}
    CONSIDER THESE CONSTRAINTS: ${user.importantConsiderations || 'None'}
    ${userToneInstruction}
  `;

    const prompt = `
    Company: ${companyName}
    Summary: ${researchData.summary}
    Strategic Angle: ${angle}
    Trigger: ${foundation.trigger}
    Why Now: ${foundation.whyNow}
    Stakeholder: ${foundation.stakeholder}
    Posture: ${foundation.posture}
    Messaging Direction: ${foundation.messagingDirection}
    
    Our Offering: ${user.proposition}
    Target Audience: ${user.audience}
    
    Sequence Requirements:
    - Objective: ${config.objective}
    - Tone: ${config.tone}
    - Sender Persona: ${config.persona}
    - LANGUAGE: ${user.language || 'English'}
    
    You need to generate exactly ${missingTypes.length} touchpoints of the following types, in this exact order:
    ${missingTypes.map((type, i) => `${i + 1}. ${type}`).join('\n')}

    For each step, populate:
    1. output_type: The exact type requested (e.g., "${firstMissing}").
    2. content: The full, untruncated message draft.
    3. subject_line: (For emails only. STRICT: Max 60 chars, front-loaded).
    4. strategic_angle: Why this step in this position?
    5. objective_fit: How it moves the goal forward.
    6. approach_guidance: Delivery advice.

    Return as a JSON array of objects.
  `;

    const response = await client.call(
      () =>
        client.models.generateContent({
          model: GEMINI_MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  output_type: { type: Type.STRING },
                  content: { type: Type.STRING },
                  subject_line: { type: Type.STRING },
                  strategic_angle: { type: Type.STRING },
                  objective_fit: { type: Type.STRING },
                  approach_guidance: { type: Type.STRING },
                },
                required: ['output_type', 'content', 'strategic_angle', 'objective_fit', 'approach_guidance'],
              },
            },
          },
        }),
      'strategy_touchpoints',
    );

    const result = this.parseJSON<GeneratedSequenceStep[]>(response.text, []);
    logger.info(`Missing touchpoints generated: ${result.length} steps for ${companyName}`);
    return result;
  }
}

export const geminiService = GeminiService.getInstance();
