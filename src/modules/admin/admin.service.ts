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
import type {
  CreateAdminProjectDtoType,
  CreateAdminUserDtoType,
  ListAdminProjectCompaniesQueryDtoType,
  ListAdminProjectCompanyResearchQueryDtoType,
  ListAdminProjectNestedResearchReportsQueryDtoType,
  ListAdminProjectsQueryDtoType,
  ListAdminResearchReportsQueryDtoType,
  ListProjectOptionsQueryDtoType,
  ListUserOptionsQueryDtoType,
  ListUsersQueryDtoType,
  UpdateAdminProjectDtoType,
  UpdateAdminUserDtoType,
} from './dto/admin.dto.js';
import type {
  AdminCompanyResearchRow,
  AdminCompanyRow,
  AdminNestedResearchReportRow,
  AdminOverviewStats,
  AdminProjectDetail,
  AdminProjectSummary,
  AdminResearchReportDetail,
  AdminResearchReportSummary,
  AdminUserSummary,
  PaginatedAdminNestedResearchReports,
  PaginatedAdminProjectCompanies,
  PaginatedAdminProjectCompanyResearch,
  PaginatedAdminProjectOptions,
  PaginatedAdminProjects,
  PaginatedAdminResearchReports,
  PaginatedAdminUserOptions,
  PaginatedAdminUsers,
} from './types/admin.types.js';

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

  async listUserOptions(query: ListUserOptionsQueryDtoType): Promise<PaginatedAdminUserOptions> {
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
    };

    if (query.q.length > 0) {
      const term = query.q;
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take: pageSize,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const options = rows.map((u) => {
      const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
      const label = name.length > 0 ? `${name} (${u.email})` : u.email;
      return { value: u.id, label };
    });

    return {
      options,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async listProjectsPaginated(query: ListAdminProjectsQueryDtoType): Promise<PaginatedAdminProjects> {
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProjectWhereInput = {
      isDeleted: false,
    };

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.search.length > 0) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const orderDirection = query.sortOrder === 'asc' ? 'asc' : 'desc';
    let orderBy: Prisma.ProjectOrderByWithRelationInput;
    if (query.sortBy === 'name') {
      orderBy = { name: orderDirection };
    } else if (query.sortBy === 'status') {
      orderBy = { status: orderDirection };
    } else {
      orderBy = { createdAt: orderDirection };
    }

    const [rows, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          userId: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const projects: AdminProjectSummary[] = rows.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.name,
      status: p.status,
      ownerEmail: p.user.email,
      ownerFirstName: p.user.firstName,
      ownerLastName: p.user.lastName,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return {
      projects,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async listProjectOptionsPaginated(query: ListProjectOptionsQueryDtoType): Promise<PaginatedAdminProjectOptions> {
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProjectWhereInput = {
      isDeleted: false,
    };

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.q.length > 0) {
      where.name = { contains: query.q, mode: 'insensitive' };
    }

    const [rows, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          user: { select: { email: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const options = rows.map((p) => ({
      value: p.id,
      label: `${p.name} — ${p.user.email}`,
    }));

    return {
      options,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async createProject(dto: CreateAdminProjectDtoType): Promise<AdminProjectSummary> {
    const owner = await prisma.user.findFirst({
      where: { id: dto.userId, isDeleted: false },
      select: { id: true },
    });

    if (!owner) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const created = await prisma.project.create({
      data: {
        userId: dto.userId,
        name: dto.name,
        status: dto.status,
        defaultHeaders: {},
      },
      select: {
        id: true,
        userId: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      name: created.name,
      status: created.status,
      ownerEmail: created.user.email,
      ownerFirstName: created.user.firstName,
      ownerLastName: created.user.lastName,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateProject(projectId: string, dto: UpdateAdminProjectDtoType): Promise<AdminProjectSummary | null> {
    const existing = await prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const data: Prisma.ProjectUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
      select: {
        id: true,
        userId: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      status: updated.status,
      ownerEmail: updated.user.email,
      ownerFirstName: updated.user.firstName,
      ownerLastName: updated.user.lastName,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const existing = await prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return true;
  }

  async listResearchReportsPaginated(query: ListAdminResearchReportsQueryDtoType): Promise<PaginatedAdminResearchReports> {
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ResearchReportWhereInput = {
      isDeleted: false,
    };

    if (query.userId) {
      where.createdBy = query.userId;
    }

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.search.length > 0) {
      where.formalCompanyName = { contains: query.search, mode: 'insensitive' };
    }

    const orderDirection = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.ResearchReportOrderByWithRelationInput =
      query.sortBy === 'formalCompanyName'
        ? { formalCompanyName: orderDirection }
        : { createdAt: orderDirection };

    const [rows, total] = await prisma.$transaction([
      prisma.researchReport.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          projectId: true,
          createdBy: true,
          formalCompanyName: true,
          createdAt: true,
          updatedAt: true,
          project: { select: { name: true } },
          user: { select: { email: true } },
          companyResearch: { select: { researchStatus: true } },
        },
      }),
      prisma.researchReport.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const reports: AdminResearchReportSummary[] = rows.map((r): AdminResearchReportSummary => {
      const status = r.companyResearch?.researchStatus ?? null;
      return {
        id: r.id,
        projectId: r.projectId,
        projectName: r.project.name,
        createdBy: r.createdBy,
        ownerEmail: r.user.email,
        formalCompanyName: r.formalCompanyName,
        status: status === null ? null : String(status),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    });

    return {
      reports,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async deleteResearchReport(reportId: string): Promise<boolean> {
    const existing = await prisma.researchReport.findFirst({
      where: { id: reportId, isDeleted: false },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.researchReport.update({
      where: { id: reportId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return true;
  }

  async getProjectById(projectId: string): Promise<AdminProjectDetail | null> {
    const row = await prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      status: row.status,
      defaultHeaders: row.defaultHeaders,
      campaignContext: row.campaignContext,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      ownerEmail: row.user.email,
      ownerFirstName: row.user.firstName,
      ownerLastName: row.user.lastName,
    };
  }

  async listProjectCompaniesPaginated(
    projectId: string,
    query: ListAdminProjectCompaniesQueryDtoType,
  ): Promise<PaginatedAdminProjectCompanies | null> {
    const projectExists = await prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
      select: { id: true },
    });

    if (!projectExists) {
      return null;
    }

    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CompanyWhereInput = {
      projectId,
      isDeleted: false,
    };

    if (query.search.length > 0) {
      where.companyName = { contains: query.search, mode: 'insensitive' };
    }

    const orderDirection = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.CompanyOrderByWithRelationInput =
      query.sortBy === 'companyName' ? { companyName: orderDirection } : { createdAt: orderDirection };

    const [rows, total] = await prisma.$transaction([
      prisma.company.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          companyName: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.company.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const companies: AdminCompanyRow[] = rows.map(
      (r): AdminCompanyRow => ({
        id: r.id,
        companyName: r.companyName,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }),
    );

    return {
      companies,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async listProjectCompanyResearchPaginated(
    projectId: string,
    query: ListAdminProjectCompanyResearchQueryDtoType,
  ): Promise<PaginatedAdminProjectCompanyResearch | null> {
    const projectExists = await prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
      select: { id: true },
    });

    if (!projectExists) {
      return null;
    }

    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CompanyResearchWhereInput = {
      projectId,
      isDeleted: false,
    };

    if (query.search.length > 0) {
      where.company = {
        companyName: { contains: query.search, mode: 'insensitive' },
      };
    }

    const orderDirection = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.CompanyResearchOrderByWithRelationInput =
      query.sortBy === 'researchStatus'
        ? { researchStatus: orderDirection }
        : { createdAt: orderDirection };

    const [rows, total] = await prisma.$transaction([
      prisma.companyResearch.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          companyId: true,
          researchStatus: true,
          createdAt: true,
          updatedAt: true,
          company: { select: { companyName: true } },
        },
      }),
      prisma.companyResearch.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const companyResearchRows: AdminCompanyResearchRow[] = rows.map(
      (r): AdminCompanyResearchRow => ({
        id: r.id,
        companyId: r.companyId,
        companyName: r.company.companyName,
        researchStatus: r.researchStatus,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }),
    );

    return {
      rows: companyResearchRows,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async listProjectNestedResearchReportsPaginated(
    projectId: string,
    query: ListAdminProjectNestedResearchReportsQueryDtoType,
  ): Promise<PaginatedAdminNestedResearchReports | null> {
    const projectExists = await prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
      select: { id: true },
    });

    if (!projectExists) {
      return null;
    }

    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ResearchReportWhereInput = {
      projectId,
      isDeleted: false,
    };

    if (query.search.length > 0) {
      where.formalCompanyName = { contains: query.search, mode: 'insensitive' };
    }

    const orderDirection = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.ResearchReportOrderByWithRelationInput =
      query.sortBy === 'formalCompanyName'
        ? { formalCompanyName: orderDirection }
        : { createdAt: orderDirection };

    const [rows, total] = await prisma.$transaction([
      prisma.researchReport.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          formalCompanyName: true,
          createdAt: true,
          updatedAt: true,
          companyResearch: { select: { researchStatus: true } },
        },
      }),
      prisma.researchReport.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const reports: AdminNestedResearchReportRow[] = rows.map(
      (r): AdminNestedResearchReportRow => {
        const status = r.companyResearch?.researchStatus ?? null;
        return {
          id: r.id,
          formalCompanyName: r.formalCompanyName,
          status: status === null ? null : String(status),
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      },
    );

    return {
      reports,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getResearchReportById(reportId: string): Promise<AdminResearchReportDetail | null> {
    const row = await prisma.researchReport.findFirst({
      where: { id: reportId, isDeleted: false },
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        formalCompanyName: true,
        strategicSummary: true,
        growthSignals: true,
        hiringSignals: true,
        securityRiskSignals: true,
        leadershipSignals: true,
        keyHeadwinds: true,
        interpretation: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { name: true } },
        user: { select: { email: true } },
        companyResearch: { select: { researchStatus: true } },
      },
    });

    if (!row) {
      return null;
    }

    const status = row.companyResearch?.researchStatus ?? null;

    return {
      id: row.id,
      projectId: row.projectId,
      projectName: row.project.name,
      createdBy: row.createdBy,
      ownerEmail: row.user.email,
      formalCompanyName: row.formalCompanyName,
      status: status === null ? null : String(status),
      strategicSummary: row.strategicSummary,
      growthSignals: row.growthSignals,
      hiringSignals: row.hiringSignals,
      securityRiskSignals: row.securityRiskSignals,
      leadershipSignals: row.leadershipSignals,
      keyHeadwinds: row.keyHeadwinds,
      interpretation: row.interpretation,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
