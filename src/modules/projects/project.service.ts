// ============================================================================
// IMPORTS
// ============================================================================

// Config
import { prisma } from '../../config/prisma.js';

// Prisma
import { Prisma } from '../../generated/prisma/client.js';

// Utils
import { createLogger } from '../../utils/helpers/logger.js';
import { toNullablePrismaJson, toRequiredPrismaJson } from '../../utils/prisma/jsonInputs.js';

// DTO types
import type { CreateProjectDtoType, ProjectListQueryDtoType, UpdateProjectDtoType } from './dto/project.dto.js';

// Types
import type { PaginatedProjectList, ProjectListItem, ProjectResponse } from './types/project.types.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('ProjectService');

// ============================================================================
// SERVICE
// ============================================================================

export class ProjectService {
  private toListItem(row: {
    id: string;
    userId: string;
    name: string;
    status: ProjectListItem['status'];
    createdAt: Date;
    updatedAt: Date;
    _count: {
      companyLists: number;
      researchReports: number;
      strategies: number;
      activationAssets: number;
    };
  }): ProjectListItem {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      relationCounts: {
        companyLists: row._count.companyLists,
        researchReports: row._count.researchReports,
        strategies: row._count.strategies,
        activationAssets: row._count.activationAssets,
      },
    };
  }

  private toDetail(row: {
    id: string;
    userId: string;
    name: string;
    status: ProjectResponse['status'];
    defaultHeaders: Prisma.JsonValue;
    campaignContext: Prisma.JsonValue | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): ProjectResponse {
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
    };
  }

  private buildOrderBy(
    query: ProjectListQueryDtoType
  ): Prisma.ProjectOrderByWithRelationInput {
    const direction = query.sortOrder;
    switch (query.sortBy) {
      case 'name':
        return { name: direction };
      case 'status':
        return { status: direction };
      case 'createdAt':
        return { createdAt: direction };
      case 'updatedAt':
      default:
        return { updatedAt: direction };
    }
  }

  async listProjects(userId: string, query: ProjectListQueryDtoType): Promise<PaginatedProjectList> {
    const where: Prisma.ProjectWhereInput = {
      userId,
      isDeleted: false,
      ...(query.q
        ? {
            name: {
              contains: query.q,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const [totalCount, rows] = await prisma.$transaction([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: this.buildOrderBy(query),
        skip,
        take: query.pageSize,
        select: {
          id: true,
          userId: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              companyLists: { where: { isDeleted: false } },
              researchReports: { where: { isDeleted: false } },
              strategies: { where: { isDeleted: false } },
              activationAssets: { where: { isDeleted: false } },
            },
          },
        },
      }),
    ]);

    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize);

    logger.debug(`listProjects userId=${userId} page=${query.page} total=${totalCount}`);

    return {
      items: rows.map((row) => this.toListItem(row)),
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages,
    };
  }

  async getProjectById(userId: string, projectId: string): Promise<ProjectResponse | null> {
    const row = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        isDeleted: false,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        status: true,
        defaultHeaders: true,
        campaignContext: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!row) {
      return null;
    }

    return this.toDetail(row);
  }

  async createProject(userId: string, dto: CreateProjectDtoType): Promise<ProjectResponse> {
    const createData: Prisma.ProjectUncheckedCreateInput = {
      userId,
      name: dto.name,
      status: dto.status ?? 'DRAFT',
      defaultHeaders: toRequiredPrismaJson(dto.defaultHeaders),
    };

    if (dto.campaignContext !== undefined) {
      createData.campaignContext = toNullablePrismaJson(dto.campaignContext);
    }
    if (dto.metadata !== undefined) {
      createData.metadata = toNullablePrismaJson(dto.metadata);
    }

    const created = await prisma.project.create({
      data: createData,
      select: {
        id: true,
        userId: true,
        name: true,
        status: true,
        defaultHeaders: true,
        campaignContext: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`createProject userId=${userId} projectId=${created.id}`);

    return this.toDetail(created);
  }

  async updateProject(userId: string, projectId: string, dto: UpdateProjectDtoType): Promise<ProjectResponse | null> {
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        isDeleted: false,
      },
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
    if (dto.defaultHeaders !== undefined) {
      data.defaultHeaders = toRequiredPrismaJson(dto.defaultHeaders);
    }
    if (dto.campaignContext !== undefined) {
      data.campaignContext = toNullablePrismaJson(dto.campaignContext);
    }
    if (dto.metadata !== undefined) {
      data.metadata = toNullablePrismaJson(dto.metadata);
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
      select: {
        id: true,
        userId: true,
        name: true,
        status: true,
        defaultHeaders: true,
        campaignContext: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`updateProject userId=${userId} projectId=${projectId}`);

    return this.toDetail(updated);
  }

  async softDeleteProject(userId: string, projectId: string): Promise<boolean> {
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        isDeleted: false,
      },
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

    logger.info(`softDeleteProject userId=${userId} projectId=${projectId}`);

    return true;
  }
}
