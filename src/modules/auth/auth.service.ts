// ============================================================================
// IMPORTS
// ============================================================================

// Node Core
import crypto from 'node:crypto';

// External Libraries
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';

// Config
import { prisma } from '../../config/prisma.js';

// Services
import { mailService } from '../mail/index.js';

// Utils
import { createLogger } from '../../utils/helpers/logger.js';

// Types
import type { EmailVerificationType, UserRole } from '../../generated/prisma/enums.js';
import type { UpdateProfileDtoType } from './dto/auth.dto.js';
import type { AuthResponse, SafeUser, SessionInfo } from './types/auth.types.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('AuthService');

const accessTokenExpiry = process.env['ACCESS_TOKEN_EXPIRY'] || '15m';
const refreshTokenExpiry = process.env['REFRESH_TOKEN_EXPIRY'] || '7d';
const magicLinkExpiresInMinutes = Number.parseInt(process.env['MAGIC_LINK_EXPIRES_IN_MINUTES'] ?? '', 10) || 15;

const bcryptSaltRounds = Number.parseInt(process.env['BCRYPT_SALT_ROUNDS'] ?? '', 10) || 12;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const parseExpiryToMilliseconds = (expiry: string, defaultValue: number): number => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) return defaultValue;

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return defaultValue;
  }
};

const sha256 = (value: string): string => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

const randomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const toSafeUser = (user: {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser => {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
};

// ============================================================================
// SERVICE
// ============================================================================

export class AuthService {
  private ensureJwtSecret(): string {
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      throw Object.assign(new Error('JWT_SECRET is not configured'), { statusCode: 500 });
    }
    return secret;
  }

  private signAccessToken(payload: { sub: string; email: string; role: UserRole }): string {
    const secret = this.ensureJwtSecret();
    const options: SignOptions = {
      expiresIn: accessTokenExpiry as unknown as NonNullable<SignOptions['expiresIn']>,
    };
    return jwt.sign(payload, secret as Secret, options);
  }

  private async issueRefreshToken(userId: string, sessionInfo: SessionInfo): Promise<string> {
    const expiresInMs = parseExpiryToMilliseconds(refreshTokenExpiry, 7 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(Date.now() + expiresInMs);
    const token = randomToken();

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        userAgent: sessionInfo.userAgent ?? null,
        ipAddress: sessionInfo.ipAddress ?? null,
        expiresAt,
      },
    });

    return token;
  }

  private async rotateRefreshToken(oldToken: string, sessionInfo: SessionInfo): Promise<string> {
    const existing = await prisma.refreshToken.findFirst({
      where: { token: oldToken, isRevoked: false, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    });

    if (!existing) {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }

    await prisma.refreshToken.update({
      where: { id: existing.id },
      data: { isRevoked: true },
    });

    return this.issueRefreshToken(existing.userId, sessionInfo);
  }

  async register(dto: { email: string; password: string; firstName: string; lastName: string }): Promise<{ message: string }> {
    const existing = await prisma.user.findFirst({
      where: { email: dto.email, isDeleted: false },
      select: { id: true, isEmailVerified: true },
    });

    if (existing) {
      if (existing.isEmailVerified) {
        throw Object.assign(new Error('Email is already registered'), { statusCode: 409 });
      }

      await prisma.user.update({
        where: { id: existing.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          // PHASE1: Treat repeat signup as complete without sending another verification email.
          isEmailVerified: true,
        },
      });

      // PHASE1: Post-signup verification email (magic link) disabled — re-enable with sendSignupVerification below.
      // await this.sendSignupVerification(dto.email, existing.id);
      return { message: 'Account created successfully.' };
    }

    const passwordHash = await bcrypt.hash(dto.password, bcryptSaltRounds);

    await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        // PHASE1: Auto-verify so signup can complete without a follow-up email step.
        isEmailVerified: true,
      },
    });

    // PHASE1: Post-signup verification email (magic link) disabled — re-enable with sendSignupVerification below.
    // await this.sendSignupVerification(dto.email, user.id);
    return { message: 'Account created successfully.' };
  }

  async login(dto: { email: string; password: string }, sessionInfo: SessionInfo): Promise<AuthResponse | { message: string }> {
    const user = await prisma.user.findFirst({
      where: { email: dto.email, isDeleted: false },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    if (!user.isActive) {
      throw Object.assign(new Error('Account is deactivated'), { statusCode: 403 });
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    // PHASE1: Login no longer blocked when email is unverified; magic-link gate removed for phase 1.
    // if (!user.isEmailVerified) {
    //   await this.sendSignupVerification(user.email, user.id);
    //   return { message: 'Email not verified. Verification link resent.' };
    // }

    const lastLoginAt = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt,
        // PHASE1: Mark verified on password login for legacy accounts created before verification was disabled.
        ...(user.isEmailVerified ? {} : { isEmailVerified: true }),
      },
    });

    const { passwordHash: _passwordHash, ...userPublic } = user;
    void _passwordHash;

    const refreshToken = await this.issueRefreshToken(user.id, sessionInfo);
    const accessToken = this.signAccessToken({ sub: user.id, email: user.email, role: user.role });

    return {
      user: toSafeUser({ ...userPublic, isEmailVerified: true, lastLoginAt }),
      accessToken,
      refreshToken,
    };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findFirst({
      where: { email, isDeleted: false },
      select: { id: true, isEmailVerified: true },
    });

    if (!user) {
      return { message: 'If an account exists, a verification link has been sent.' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified.' };
    }

    // PHASE1: Resend verification email disabled — restore private sendSignupVerification + call when re-enabling.
    // await this.sendSignupVerification(email, user.id);
    return { message: 'Verification link sent.' };
  }

  // PHASE1: Post-signup verification email (magic link) disabled — restore private sendSignupVerification + call when re-enabling.
  // private async sendSignupVerification(email: string, userId: string): Promise<void> {
  //   const rawToken = randomToken();
  //   const tokenHash = sha256(rawToken);
  //   const expiresAt = new Date(Date.now() + magicLinkExpiresInMinutes * 60 * 1000);

  //   await prisma.emailVerificationToken.create({
  //     data: {
  //       userId,
  //       tokenHash,
  //       type: 'SIGNUP',
  //       expiresAt,
  //     },
  //   });

  //   const backendUrl = process.env['BACKEND_URL'] || `http://localhost:${process.env['PORT'] || 3000}`;
  //   const verifyUrl = `${backendUrl}/api/auth/magic-link/verify?token=${encodeURIComponent(rawToken)}`;

  //   const frontendUrl = process.env['FRONTEND_URL'] || '';
  //   const fallbackUrl = frontendUrl ? `${frontendUrl}/auth/magic-link?token=${encodeURIComponent(rawToken)}` : verifyUrl;

  //   void mailService
  //     .sendMagicLinkEmail({
  //       to: { email },
  //       magicLinkUrl: verifyUrl,
  //       fallbackUrl,
  //       expiresInMinutes: magicLinkExpiresInMinutes,
  //     })
  //     .then((result) => {
  //       if (!result.success) {
  //         logger.warn(`Verification email failed to send for ${email}`, result);
  //       }
  //     })
  //     .catch((error) => {
  //       logger.error(`Verification email crashed for ${email}`, error);
  //     });
  // }

  async requestMagicLink(email: string): Promise<{ message: string }> {
    const existingUser = await prisma.user.findFirst({
      where: { email, isDeleted: false },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    const userId =
      existingUser?.id ??
      (
        await prisma.user.create({
          data: {
            email,
            passwordHash: await bcrypt.hash(randomToken(), bcryptSaltRounds),
          },
          select: { id: true },
        })
      ).id;

    const rawToken = randomToken();
    const tokenHash = sha256(rawToken);

    const expiresAt = new Date(Date.now() + magicLinkExpiresInMinutes * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        type: 'SIGNUP',
        expiresAt,
      },
    });

    const backendUrl = process.env['BACKEND_URL'] || `http://localhost:${process.env['PORT'] || 3000}`;
    const verifyUrl = `${backendUrl}/api/auth/magic-link/verify?token=${encodeURIComponent(rawToken)}`;

    const frontendUrl = process.env['FRONTEND_URL'] || '';
    const fallbackUrl = frontendUrl ? `${frontendUrl}/auth/magic-link?token=${encodeURIComponent(rawToken)}` : verifyUrl;

    void mailService
      .sendMagicLinkEmail({
        to: existingUser?.firstName ? { email, name: existingUser.firstName } : { email },
        magicLinkUrl: verifyUrl,
        fallbackUrl,
        expiresInMinutes: magicLinkExpiresInMinutes,
      })
      .then((result) => {
        if (!result.success) {
          logger.warn(`Magic link email failed to send for ${email}`, result);
        }
      })
      .catch((error) => {
        logger.error(`Magic link email crashed for ${email}`, error);
      });

    return { message: 'If an account exists, a sign-in link has been sent.' };
  }

  async verifyMagicLinkToken(rawToken: string, sessionInfo: SessionInfo): Promise<AuthResponse> {
    const tokenHash = sha256(rawToken);

    const tokenRow = await prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userId: true,
        type: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isEmailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            isDeleted: true,
          },
        },
      },
    });

    if (!tokenRow || tokenRow.user.isDeleted) {
      throw Object.assign(new Error('Invalid or expired token'), { statusCode: 400 });
    }

    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: tokenRow.id },
        data: { isUsed: true },
      }),
      prisma.user.update({
        where: { id: tokenRow.userId },
        data: {
          isEmailVerified: tokenRow.type === ('SIGNUP' as EmailVerificationType) ? true : tokenRow.user.isEmailVerified,
          lastLoginAt: new Date(),
        },
      }),
    ]);

    const refreshToken = await this.issueRefreshToken(tokenRow.user.id, sessionInfo);
    const accessToken = this.signAccessToken({
      sub: tokenRow.user.id,
      email: tokenRow.user.email,
      role: tokenRow.user.role,
    });

    return {
      user: toSafeUser({
        ...tokenRow.user,
        isEmailVerified: tokenRow.type === ('SIGNUP' as EmailVerificationType) ? true : tokenRow.user.isEmailVerified,
        lastLoginAt: new Date(),
      }),
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string, sessionInfo: SessionInfo): Promise<AuthResponse> {
    const tokenRow = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, isRevoked: false, expiresAt: { gt: new Date() } },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isEmailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            isDeleted: true,
            isActive: true,
          },
        },
      },
    });

    if (!tokenRow || tokenRow.user.isDeleted) {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }

    if (!tokenRow.user.isActive) {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }

    const newRefreshToken = await this.rotateRefreshToken(refreshToken, sessionInfo);
    const accessToken = this.signAccessToken({
      sub: tokenRow.user.id,
      email: tokenRow.user.email,
      role: tokenRow.user.role,
    });

    return {
      user: toSafeUser(tokenRow.user),
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { isRevoked: true },
      });
      return;
    }

    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  /**
   * Loads the full safe profile for the authenticated user (GET /api/auth/me).
   * Excludes password and other sensitive fields.
   */
  async getProfile(userId: string): Promise<SafeUser | null> {
    const user = await prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return toSafeUser(user);
  }

  /**
   * Updates display name fields only (first and last name). Email and credentials are unchanged.
   */
  async updateProfile(userId: string, dto: UpdateProfileDtoType): Promise<SafeUser> {
    const updated = await prisma.user.update({
      where: { id: userId, isDeleted: false },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return toSafeUser(updated);
  }
}

// ============================================================================
// PHASE1 — ARCHIVE: post-signup email verification (magic link)
// ============================================================================
// Restore as `private async sendSignupVerification(email: string, userId: string)` on AuthService
// and uncomment all `// await this.sendSignupVerification(...)` call sites when re-enabling.
/*
  const rawToken = randomToken();
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + magicLinkExpiresInMinutes * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      type: 'SIGNUP',
      expiresAt,
    },
  });

  const backendUrl = process.env['BACKEND_URL'] || `http://localhost:${process.env['PORT'] || 3000}`;
  const verifyUrl = `${backendUrl}/api/auth/magic-link/verify?token=${encodeURIComponent(rawToken)}`;

  const frontendUrl = process.env['FRONTEND_URL'] || '';
  const fallbackUrl = frontendUrl ? `${frontendUrl}/auth/magic-link?token=${encodeURIComponent(rawToken)}` : verifyUrl;

  void mailService
    .sendMagicLinkEmail({
      to: { email },
      magicLinkUrl: verifyUrl,
      fallbackUrl,
      expiresInMinutes: magicLinkExpiresInMinutes,
    })
    .then((result) => {
      if (!result.success) {
        logger.warn(`Verification email failed to send for ${email}`, result);
      }
    })
    .catch((error) => {
      logger.error(`Verification email crashed for ${email}`, error);
    });
*/

