// ============================================================================
// JSON VALUE (ZOD) — Prisma Json fields
// ============================================================================

// External Libraries
import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

// ============================================================================
// SCHEMA
// ============================================================================

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ])
);
