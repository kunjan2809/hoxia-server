// ============================================================================
// PRISMA JSON INPUT HELPERS (Zod JsonValue → Prisma inputs)
// ============================================================================

// Prisma
import { Prisma } from '../../generated/prisma/client.js';

// Utils
import type { JsonValue } from '../validation/jsonValue.schema.js';

// ============================================================================
// FUNCTIONS
// ============================================================================

export const toRequiredPrismaJson = (
  value: JsonValue
): Prisma.JsonNullValueInput | Prisma.InputJsonValue => {
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
};

export const toNullablePrismaJson = (
  value: JsonValue | null
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue => {
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
};
