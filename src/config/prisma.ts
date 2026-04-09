// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const GlobalPrismaKey = '__prisma__' as const;

type GlobalWithPrisma = typeof globalThis & {
  [GlobalPrismaKey]?: PrismaClient;
};

const globalWithPrisma = globalThis as GlobalWithPrisma;

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Please configure it before starting the server.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

// ============================================================================
// SINGLETON
// ============================================================================

export const prisma =
  globalWithPrisma[GlobalPrismaKey] ??
  new PrismaClient({
    adapter,
    log: process.env['NODE_ENV'] === 'development' ? ['warn', 'error'] : ['warn', 'error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalWithPrisma[GlobalPrismaKey] = prisma;
}

