// ============================================================================
// GEMINI CONFIG
// ============================================================================

/**
 * Gemini API key from `GEMINI_API_KEY` in the server `.env` (loaded at process startup).
 */
export const GEMINI_API_KEY = process.env['GEMINI_API_KEY'] ?? '';

export const GEMINI_MODEL_NAME = 'gemini-3.1-flash-lite-preview' as const;

export const RATE_LIMIT_CONFIG = {
  requestsPerMinute: 60,
  windowMs: 60_000,
  /** Base delay before a rate-limit retry (capped by maxBackoffMs). */
  initialBackoffMs: 3_000,
  /** Inclusive upper bound on attempt index: attempts = 0..maxRetries (maxRetries + 1 tries). Keep low so long-running routes return quickly. */
  maxRetries: 1,
  jitterMs: 2_000,
  slotDelayMs: 1_000,
  /** Never sleep longer than this for one backoff (local or global window). */
  maxBackoffMs: 25_000,
  /** If another request set a global wait longer than this, fail fast instead of blocking the HTTP request. */
  maxGlobalWaitBeforeFailMs: 12_000,
} as const;

export const WRITING_PRINCIPLES = `
CORE PRINCIPLES (NON-NEGOTIABLE):
1. Write like a human, not a marketer: The copy should read like something a real professional would type quickly. Avoid overly polished language, inflated claims, or generic persuasion tactics. Messages should feel natural, conversational, and direct.
2. Be concise: Shorter messages perform better. Prefer short paragraphs, short sentences, and minimal filler. Avoid long explanations.
   - Email opener: 60–120 words
   - LinkedIn message: 30–70 words
   - Follow-ups: 20–60 words
   - Subject lines: 3–7 words
3. Remove clichés and AI-style language: Never include phrases that signal generic AI-generated writing.
   - AVOID: "In today's fast-paced world", "Hope this email finds you well", "I wanted to reach out", "Leverage", "Unlock", "Game-changing", "Revolutionary", "Cutting-edge solution", "Transform your business".
4. Avoid AI punctuation patterns: Do not overuse em dashes (—) or overly structured sentence patterns. Avoid excessive semicolons and rigid sentence symmetry. Prefer simple punctuation and natural rhythm.
5. Focus on relevance first: The opening sentence should always demonstrate relevance to the recipient (observed company behaviour, industry trends, recent announcements, hiring signals, product launches, growth initiatives). Do not fabricate signals.
6. Write in a low-pressure tone: Cold outreach should not sound like a pitch. Avoid aggressive calls to action. Use soft conversational prompts such as: "Worth sharing a few ideas?", "Happy to send more details if helpful.", "Curious if this is on your radar." The objective is to start a conversation, not to force a meeting.
7. Avoid heavy self-promotion: Limit company description to one short sentence maximum. Focus the majority of the message on the recipient, their company, and their likely priorities.
8. Use concrete proof where possible: Use specific signals rather than vague claims. Prefer "Worked with 22 B2B SaaS companies last year" over "We've helped many companies succeed." Numbers, examples, or categories add credibility.
9. Avoid obvious sales language: AVOID "schedule a demo", "book a call", "transform your workflow", "best-in-class solution".
10. Use natural message structure:
    - 1. Personalised observation (Something relevant about the company or role)
    - 2. Short credibility signal (A brief explanation of experience or insight)
    - 3. Clear value hypothesis (How the sender might help)
    - 4. Soft question (A low-pressure invitation to continue the conversation)

TONE GUIDELINES:
- Copy should feel: thoughtful, calm, intelligent, conversational, professional.
- Avoid sounding: overly enthusiastic, pushy, corporate, robotic.

RESEARCH-DRIVEN COPY OPTIMISATION:
- Use insights from reputable sources (Mailchimp, WordStream, BuzzStream, HubSpot, Gong, Lavender, Salesloft) to refine subject line length, email length, tone, call-to-action style, and reply-driven messaging. Prioritise approaches that historically produce higher reply rates.

ASSET-SPECIFIC RULES:
- Subject Lines: Must be short (3-7 words), sound natural, avoid clickbait, avoid sales language. Prefer curiosity or relevance over promotion. Examples: "quick question", "noticed this", "API banking rollout", "saw your hiring". AVOID: "Exclusive offer", "Boost your growth today".
- Follow-Up Messages: Very short (20-60 words). Reference the previous message, introduce ONE new idea or signal, remain low pressure. Never repeat the original email verbatim.
- Break-Up / Nudge Messages: Polite, acknowledge timing may not be right, keep the door open. Example: "Not sure if this is relevant right now. Happy to revisit later if priorities change."
- Sales Call Openers: Summarise the insight briefly, explain why the conversation could be useful, avoid scripted or robotic language. Should sound like a natural introduction a salesperson would use on a real call.
` as const;
