// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';

// Constants
import { LOCAL_UPLOAD_TMP_DIR } from '../utils/constants/localUploads.js';

// Utils
import { sendBadRequest } from '../utils/helpers/response.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]);

/** Browsers sometimes send application/octet-stream or empty mimetype; allow known extensions as fallback. */
const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx', '.txt', '.md']);

// ============================================================================
// SETUP
// ============================================================================

if (!fs.existsSync(LOCAL_UPLOAD_TMP_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_TMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, LOCAL_UPLOAD_TMP_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    cb(null, `${randomUUID()}${ext}`);
  },
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

export const uploadToneOfVoice = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.has(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported file type for tone of voice. Use PDF, Word, or plain text.'));
  },
});

// ============================================================================
// WRAPPED HANDLER (multer errors → 400)
// ============================================================================

export const runToneOfVoiceUploadOptional = (req: Request, res: Response, next: NextFunction): void => {
  uploadToneOfVoice.single('toneOfVoice')(req, res, (err: unknown) => {
    if (err === undefined || err === null) {
      next();
      return;
    }
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      const errors = [{ field: 'toneOfVoice', message: 'File exceeds maximum size (15MB).' }];
      sendBadRequest(res, 'Validation failed', errors);
      return;
    }
    const message = err instanceof Error ? err.message : 'Upload failed';
    const errors = [{ field: 'toneOfVoice', message }];
    sendBadRequest(res, 'Upload failed', errors);
  });
};
