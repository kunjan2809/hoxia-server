// ============================================================================
// IMPORTS
// ============================================================================

import { Cadence, Objective, SenderPersona, StrategicAngle, StrategyTone } from '../../generated/prisma/enums.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type HttpError = Error & { statusCode: number };

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const badLabel = (field: string, value: string): HttpError => {
  const err = new Error(`Unknown ${field} label: ${value}`) as HttpError;
  err.statusCode = 400;
  return err;
};

export const mapObjectiveLabelToEnum = (label: string): Objective => {
  const t = label.trim();
  const map: Record<string, Objective> = {
    'Open a conversation': Objective.OPEN_CONVERSATION,
    'Secure a meeting': Objective.SECURE_MEETING,
    'Support an active opportunity': Objective.SUPPORT_OPPORTUNITY,
    'Re-engage a stalled deal': Objective.REENGAGE_STALLED,
    'Introduce a point of view': Objective.INTRODUCE_POV,
    Nurture: Objective.NURTURE,
  };
  const v = map[t];
  if (v === undefined) {
    throw badLabel('objective', label);
  }
  return v;
};

export const mapCadenceLabelToEnum = (label: string): Cadence => {
  const t = label.trim();
  const map: Record<string, Cadence> = {
    'Standard Prospecting': Cadence.STANDARD_PROSPECTING,
    'Long-Game Nurture': Cadence.LONG_GAME_NURTURE,
    'Quick Breakthrough': Cadence.QUICK_BREAKTHROUGH,
  };
  const v = map[t];
  if (v === undefined) {
    throw badLabel('cadence', label);
  }
  return v;
};

export const mapToneLabelToEnum = (label: string): StrategyTone => {
  const t = label.trim();
  const map: Record<string, StrategyTone> = {
    'Insight-led': StrategyTone.CONSULTATIVE,
    Direct: StrategyTone.DIRECT,
    Empathetic: StrategyTone.WARM,
  };
  const v = map[t];
  if (v === undefined) {
    throw badLabel('tone', label);
  }
  return v;
};

export const mapPersonaLabelToEnum = (label: string): SenderPersona => {
  const t = label.trim();
  const map: Record<string, SenderPersona> = {
    'Account Executive': SenderPersona.PEER,
    'Sales Director': SenderPersona.EXECUTIVE,
    'Senior Commercial Lead': SenderPersona.PARTNER,
    'Sales Development (SDR / BDR)': SenderPersona.PEER,
    'Board-Level Executive': SenderPersona.EXECUTIVE,
    'Subject-Matter Expert': SenderPersona.INTERNAL_CHAMPION,
    Founder: SenderPersona.EXECUTIVE,
    'Marketing Lead': SenderPersona.PEER,
  };
  const v = map[t];
  if (v === undefined) {
    throw badLabel('persona', label);
  }
  return v;
};

export const strategicAngleToUiLabel = (angle: StrategicAngle): string => {
  switch (angle) {
    case 'PRIMARY':
      return 'Primary Angle';
    case 'SUPPORTING':
      return 'Supporting Angle';
    case 'CONTRARIAN':
      return 'Contrarian Angle';
    default:
      return 'Primary Angle';
  }
};
