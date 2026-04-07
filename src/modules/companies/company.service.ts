// ============================================================================
// IMPORTS
// ============================================================================

// Config
import { prisma } from '../../config/prisma.js';

// Prisma
import { Prisma } from '../../generated/prisma/client.js';

// Utils
import { assertProjectAccess } from '../../utils/helpers/projectAccess.js';
import { createLogger } from '../../utils/helpers/logger.js';
import { toNullablePrismaJson, toRequiredPrismaJson } from '../../utils/prisma/jsonInputs.js';

// DTO types
import type {
  BulkCompaniesBodyDtoType,
  CompanyListListQueryDtoType,
  CompanyListQueryDtoType,
  CreateCompanyDtoType,
  CreateCompanyListDtoType,
  UpdateCompanyDtoType,
  UpdateCompanyListDtoType,
} from './dto/company.dto.js';

// Types
import type {
  BulkCompaniesResult,
  CompanyListItem,
  CompanyListItemRow,
  CompanyListResponse,
  CompanyResponse,
  PaginatedCompanies,
  PaginatedCompanyLists,
} from './types/company.types.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('CompanyService');

// ============================================================================
// SERVICE
// ============================================================================

export class CompanyService {
  private mapCompanyListItem(row: {
    id: string;
    projectId: string;
    createdBy: string;
    name: string;
    rowCount: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): CompanyListItem {
    return {
      id: row.id,
      projectId: row.projectId,
      createdBy: row.createdBy,
      name: row.name,
      rowCount: row.rowCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapCompanyListResponse(row: {
    id: string;
    projectId: string;
    createdBy: string;
    name: string;
    rowCount: number | null;
    headers: Prisma.JsonValue;
    campaignContext: Prisma.JsonValue | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): CompanyListResponse {
    return {
      ...this.mapCompanyListItem(row),
      headers: row.headers,
      campaignContext: row.campaignContext,
      metadata: row.metadata,
    };
  }

  private mapCompanyRow(row: {
    id: string;
    projectId: string;
    createdBy: string;
    type: CompanyListItemRow['type'];
    companyListId: string | null;
    companyName: string | null;
    websiteUrl: string | null;
    linkedinUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): CompanyListItemRow {
    return {
      id: row.id,
      projectId: row.projectId,
      createdBy: row.createdBy,
      type: row.type,
      companyListId: row.companyListId,
      companyName: row.companyName,
      websiteUrl: row.websiteUrl,
      linkedinUrl: row.linkedinUrl,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapCompanyResponse(row: {
    id: string;
    projectId: string;
    createdBy: string;
    type: CompanyListItemRow['type'];
    companyListId: string | null;
    companyName: string | null;
    websiteUrl: string | null;
    linkedinUrl: string | null;
    payload: Prisma.JsonValue;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): CompanyResponse {
    return {
      ...this.mapCompanyRow(row),
      payload: row.payload,
      metadata: row.metadata,
    };
  }

  private companyListOrderBy(
    query: CompanyListListQueryDtoType
  ): Prisma.CompanyListOrderByWithRelationInput {
    const dir = query.sortOrder;
    switch (query.sortBy) {
      case 'name':
        return { name: dir };
      case 'createdAt':
        return { createdAt: dir };
      case 'updatedAt':
      default:
        return { updatedAt: dir };
    }
  }

  private companyOrderBy(query: CompanyListQueryDtoType): Prisma.CompanyOrderByWithRelationInput {
    const dir = query.sortOrder;
    switch (query.sortBy) {
      case 'companyName':
        return { companyName: dir };
      case 'type':
        return { type: dir };
      case 'createdAt':
        return { createdAt: dir };
      case 'updatedAt':
      default:
        return { updatedAt: dir };
    }
  }

  async listCompanyLists(
    userId: string,
    projectId: string,
    query: CompanyListListQueryDtoType
  ): Promise<PaginatedCompanyLists> {
    await assertProjectAccess(userId, projectId);

    const where: Prisma.CompanyListWhereInput = {
      projectId,
      isDeleted: false,
      ...(query.q
        ? {
            name: { contains: query.q, mode: 'insensitive' },
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const [totalCount, rows] = await prisma.$transaction([
      prisma.companyList.count({ where }),
      prisma.companyList.findMany({
        where,
        orderBy: this.companyListOrderBy(query),
        skip,
        take: query.pageSize,
        select: {
          id: true,
          projectId: true,
          createdBy: true,
          name: true,
          rowCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize);

    return {
      items: rows.map((r) => this.mapCompanyListItem(r)),
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages,
    };
  }

  async createCompanyList(
    userId: string,
    projectId: string,
    dto: CreateCompanyListDtoType
  ): Promise<CompanyListResponse> {
    await assertProjectAccess(userId, projectId);

    const createData: Prisma.CompanyListUncheckedCreateInput = {
      projectId,
      createdBy: userId,
      name: dto.name,
      headers: toRequiredPrismaJson(dto.headers),
    };

    if (dto.rowCount !== undefined && dto.rowCount !== null) {
      createData.rowCount = dto.rowCount;
    }
    if (dto.campaignContext !== undefined) {
      createData.campaignContext = toNullablePrismaJson(dto.campaignContext);
    }
    if (dto.metadata !== undefined) {
      createData.metadata = toNullablePrismaJson(dto.metadata);
    }

    const created = await prisma.companyList.create({
      data: createData,
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        name: true,
        rowCount: true,
        headers: true,
        campaignContext: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`createCompanyList projectId=${projectId} listId=${created.id}`);
    return this.mapCompanyListResponse(created);
  }

  async getCompanyList(
    userId: string,
    projectId: string,
    companyListId: string
  ): Promise<CompanyListResponse | null> {
    await assertProjectAccess(userId, projectId);

    const row = await prisma.companyList.findFirst({
      where: {
        id: companyListId,
        projectId,
        isDeleted: false,
      },
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        name: true,
        rowCount: true,
        headers: true,
        campaignContext: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return row ? this.mapCompanyListResponse(row) : null;
  }

  async updateCompanyList(
    userId: string,
    projectId: string,
    companyListId: string,
    dto: UpdateCompanyListDtoType
  ): Promise<CompanyListResponse | null> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.companyList.findFirst({
      where: { id: companyListId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const data: Prisma.CompanyListUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.headers !== undefined) {
      data.headers = toRequiredPrismaJson(dto.headers);
    }
    if (dto.rowCount !== undefined) {
      data.rowCount = dto.rowCount;
    }
    if (dto.campaignContext !== undefined) {
      data.campaignContext = toNullablePrismaJson(dto.campaignContext);
    }
    if (dto.metadata !== undefined) {
      data.metadata = toNullablePrismaJson(dto.metadata);
    }

    const updated = await prisma.companyList.update({
      where: { id: companyListId },
      data,
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        name: true,
        rowCount: true,
        headers: true,
        campaignContext: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapCompanyListResponse(updated);
  }

  async softDeleteCompanyList(userId: string, projectId: string, companyListId: string): Promise<boolean> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.companyList.findFirst({
      where: { id: companyListId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }

    await prisma.companyList.update({
      where: { id: companyListId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return true;
  }

  async bulkCreateCompaniesForList(
    userId: string,
    projectId: string,
    companyListId: string,
    dto: BulkCompaniesBodyDtoType
  ): Promise<BulkCompaniesResult> {
    await assertProjectAccess(userId, projectId);

    const list = await prisma.companyList.findFirst({
      where: { id: companyListId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!list) {
      throw Object.assign(new Error('Company list not found'), { statusCode: 404 });
    }

    const ids: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const row of dto.rows) {
        const created = await tx.company.create({
          data: {
            projectId,
            createdBy: userId,
            type: 'BATCH',
            companyListId,
            companyName: row.companyName,
            websiteUrl: row.websiteUrl ?? null,
            linkedinUrl: row.linkedinUrl ?? null,
            payload: toRequiredPrismaJson(row.payload),
          },
          select: { id: true },
        });
        ids.push(created.id);
      }

      const totalInList = await tx.company.count({
        where: { companyListId, isDeleted: false },
      });

      await tx.companyList.update({
        where: { id: companyListId },
        data: { rowCount: totalInList },
      });
    });

    return { createdCount: ids.length, ids };
  }

  async listCompanies(
    userId: string,
    projectId: string,
    query: CompanyListQueryDtoType
  ): Promise<PaginatedCompanies> {
    await assertProjectAccess(userId, projectId);

    const where: Prisma.CompanyWhereInput = {
      projectId,
      isDeleted: false,
      ...(query.q
        ? {
            OR: [
              { companyName: { contains: query.q, mode: 'insensitive' } },
              { websiteUrl: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.companyListId ? { companyListId: query.companyListId } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const [totalCount, rows] = await prisma.$transaction([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        orderBy: this.companyOrderBy(query),
        skip,
        take: query.pageSize,
        select: {
          id: true,
          projectId: true,
          createdBy: true,
          type: true,
          companyListId: true,
          companyName: true,
          websiteUrl: true,
          linkedinUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize);

    return {
      items: rows.map((r) => this.mapCompanyRow(r)),
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages,
    };
  }

  async createCompany(
    userId: string,
    projectId: string,
    dto: CreateCompanyDtoType
  ): Promise<CompanyResponse> {
    await assertProjectAccess(userId, projectId);

    if (dto.companyListId) {
      const list = await prisma.companyList.findFirst({
        where: { id: dto.companyListId, projectId, isDeleted: false },
        select: { id: true },
      });
      if (!list) {
        throw Object.assign(new Error('Company list not found'), { statusCode: 404 });
      }
    }

    const createData: Prisma.CompanyUncheckedCreateInput = {
      projectId,
      createdBy: userId,
      type: dto.type,
      companyName: dto.companyName ?? null,
      websiteUrl: dto.websiteUrl ?? null,
      linkedinUrl: dto.linkedinUrl ?? null,
      payload: toRequiredPrismaJson(dto.payload),
    };

    if (dto.companyListId !== undefined && dto.companyListId !== null) {
      createData.companyListId = dto.companyListId;
    }

    if (dto.metadata !== undefined) {
      createData.metadata = toNullablePrismaJson(dto.metadata);
    }

    const created = await prisma.company.create({
      data: createData,
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        type: true,
        companyListId: true,
        companyName: true,
        websiteUrl: true,
        linkedinUrl: true,
        payload: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapCompanyResponse(created);
  }

  async getCompany(userId: string, projectId: string, companyId: string): Promise<CompanyResponse | null> {
    await assertProjectAccess(userId, projectId);

    const row = await prisma.company.findFirst({
      where: { id: companyId, projectId, isDeleted: false },
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        type: true,
        companyListId: true,
        companyName: true,
        websiteUrl: true,
        linkedinUrl: true,
        payload: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return row ? this.mapCompanyResponse(row) : null;
  }

  async updateCompany(
    userId: string,
    projectId: string,
    companyId: string,
    dto: UpdateCompanyDtoType
  ): Promise<CompanyResponse | null> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.company.findFirst({
      where: { id: companyId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    if (dto.companyListId) {
      const list = await prisma.companyList.findFirst({
        where: { id: dto.companyListId, projectId, isDeleted: false },
        select: { id: true },
      });
      if (!list) {
        throw Object.assign(new Error('Company list not found'), { statusCode: 404 });
      }
    }

    const data: Prisma.CompanyUpdateInput = {};
    if (dto.type !== undefined) {
      data.type = dto.type;
    }
    if (dto.companyListId !== undefined) {
      if (dto.companyListId === null) {
        data.companyList = { disconnect: true };
      } else {
        data.companyList = { connect: { id: dto.companyListId } };
      }
    }
    if (dto.companyName !== undefined) {
      data.companyName = dto.companyName;
    }
    if (dto.websiteUrl !== undefined) {
      data.websiteUrl = dto.websiteUrl;
    }
    if (dto.linkedinUrl !== undefined) {
      data.linkedinUrl = dto.linkedinUrl;
    }
    if (dto.payload !== undefined) {
      data.payload = toRequiredPrismaJson(dto.payload);
    }
    if (dto.metadata !== undefined) {
      data.metadata = toNullablePrismaJson(dto.metadata);
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data,
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        type: true,
        companyListId: true,
        companyName: true,
        websiteUrl: true,
        linkedinUrl: true,
        payload: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapCompanyResponse(updated);
  }

  async softDeleteCompany(userId: string, projectId: string, companyId: string): Promise<boolean> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.company.findFirst({
      where: { id: companyId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return true;
  }
}
