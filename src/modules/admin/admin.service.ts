// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import bcrypt from 'bcrypt';

// Config
import { prisma } from '../../config/prisma.js';

// Types
import type { Prisma } from '../../generated/prisma/client.js';
import type { UserRole } from '../../generated/prisma/enums.js';
import type { CreateAdminUserDtoType, ListUsersQueryDtoType, UpdateAdminUserDtoType } from './dto/admin.dto.js';
import type { AdminOverviewStats, AdminUserSummary, PaginatedAdminUsers } from './types/admin.types.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const bcryptSaltRounds = Number.parseInt(process.env['BCRYPT_SALT_ROUNDS'] ?? '', 10) || 12;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const toAdminUserSummary = (user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminUserSummary => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
};

// ============================================================================
// CLASS DEFINITIONS
// ============================================================================

export class AdminService {
  private async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  async getOverviewStats(): Promise<AdminOverviewStats> {
    const baseWhere: Prisma.UserWhereInput = { isDeleted: false };

    const [totalUsers, activeUsers, inactiveUsers, adminCount] = await prisma.$transaction([
      prisma.user.count({ where: baseWhere }),
      prisma.user.count({ where: { ...baseWhere, isActive: true } }),
      prisma.user.count({ where: { ...baseWhere, isActive: false } }),
      prisma.user.count({ where: { ...baseWhere, role: 'ADMIN' } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminCount,
    };
  }

  async listUsersPaginated(query: ListUsersQueryDtoType): Promise<PaginatedAdminUsers> {
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
    };

    if (query.status === 'active') {
      where.isActive = true;
    } else if (query.status === 'inactive') {
      where.isActive = false;
    }

    if (query.search.length > 0) {
      const term = query.search;
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderDirection = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [query.sortBy]: orderDirection,
    };

    const [rows, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      users: rows.map(toAdminUserSummary),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async createUser(dto: CreateAdminUserDtoType): Promise<AdminUserSummary> {
    const existing = await prisma.user.findFirst({
      where: { email: dto.email, isDeleted: false },
      select: { id: true },
    });

    if (existing) {
      throw Object.assign(new Error('Email is already registered'), { statusCode: 409 });
    }

    const passwordHash = await bcrypt.hash(dto.password, bcryptSaltRounds);

    const created = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        isEmailVerified: true,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return toAdminUserSummary(created);
  }

  async updateUser(userId: string, dto: UpdateAdminUserDtoType): Promise<AdminUserSummary | null> {
    const existing = await prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!existing) {
      return null;
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await prisma.user.findFirst({
        where: { email: dto.email, isDeleted: false, NOT: { id: userId } },
        select: { id: true },
      });
      if (emailTaken) {
        throw Object.assign(new Error('Email is already in use'), { statusCode: 409 });
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const roleChanged = dto.role !== undefined && dto.role !== existing.role;
    const deactivated = dto.isActive === false && existing.isActive === true;

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (roleChanged || deactivated) {
      await this.revokeAllRefreshTokensForUser(userId);
    }

    return toAdminUserSummary(updated);
  }

  async deleteUser(userId: string, actorUserId: string): Promise<boolean> {
    if (userId === actorUserId) {
      throw Object.assign(new Error('You cannot delete your own account'), { statusCode: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      }),
    ]);

    return true;
  }
}
