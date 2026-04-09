// ============================================================================
// LOCAL DISK UPLOADS (tone-of-voice and similar)
// ============================================================================

// Node
import path from 'node:path';

// ============================================================================
// CONSTANTS
// ============================================================================

const cwd = process.cwd();

/** Root directory for user-uploaded files (override with LOCAL_UPLOAD_ROOT). Always resolved to an absolute path. */
export const LOCAL_UPLOAD_ROOT = path.resolve(process.env['LOCAL_UPLOAD_ROOT'] ?? path.join(cwd, 'uploads'));

/** Temporary uploads before a DB id exists (multer destination). */
export const LOCAL_UPLOAD_TMP_DIR = path.join(LOCAL_UPLOAD_ROOT, 'tmp');

/** Relative segment under LOCAL_UPLOAD_ROOT for tone-of-voice assets. */
export const TONE_OF_VOICE_SEGMENT = 'tone-of-voice' as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const buildToneOfVoiceRelativePath = (projectId: string, companyListId: string, storedFileName: string): string => {
  return path.join(TONE_OF_VOICE_SEGMENT, projectId, companyListId, storedFileName).split(path.sep).join('/');
};

export const resolveToneOfVoiceAbsolutePath = (relativePath: string): string => {
  const normalized = path.normalize(relativePath);
  if (normalized.includes('..')) {
    throw new Error('Invalid stored path');
  }
  return path.join(LOCAL_UPLOAD_ROOT, normalized);
};
