// ============================================================================
// IMPORTS
// ============================================================================

// Config
import { prisma } from '../../config/prisma.js';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ensures the project exists, belongs to the user, and is not soft-deleted.
 * Throws an Error with statusCode 404 when the project is missing or inaccessible.
 */
export const assertProjectAccess = async (userId: string, projectId: string): Promise<void> => {
  const row = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (!row) {
    throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  }
};
