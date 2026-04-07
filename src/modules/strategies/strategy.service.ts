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
import { toNullablePrismaJson } from '../../utils/prisma/jsonInputs.js';

// DTO types
import type {
  ActivationAssetListQueryDtoType,
  CreateActivationAssetDtoType,
  CreateStrategyDtoType,
  CreateStrategyStepDtoType,
  StrategyListQueryDtoType,
  StrategyStepListQueryDtoType,
  UpdateActivationAssetDtoType,
  UpdateStrategyDtoType,
  UpdateStrategyStepDtoType,
} from './dto/strategy.dto.js';

// Types
import type {
  ActivationAssetListItem,
  ActivationAssetResponse,
  PaginatedActivationAssets,
  PaginatedStrategies,
  PaginatedStrategySteps,
  StrategyListItem,
  StrategyResponse,
  StrategyStepItem,
  StrategyStepResponse,
} from './types/strategy.types.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('StrategyService');

// ============================================================================
// SERVICE
// ============================================================================

export class StrategyService {
  private async validateOptionalFks(
    projectId: string,
    input: {
      companyId?: string | null | undefined;
      companyResearchId?: string | null | undefined;
      researchReportId?: string | null | undefined;
    }
  ): Promise<void> {
    if (input.companyId) {
      const c = await prisma.company.findFirst({
        where: { id: input.companyId, projectId, isDeleted: false },
        select: { id: true },
      });
      if (!c) {
        throw Object.assign(new Error('Company not found'), { statusCode: 404 });
      }
    }
    if (input.companyResearchId) {
      const cr = await prisma.companyResearch.findFirst({
        where: { id: input.companyResearchId, projectId, isDeleted: false },
        select: { id: true },
      });
      if (!cr) {
        throw Object.assign(new Error('Company research not found'), { statusCode: 404 });
      }
    }
    if (input.researchReportId) {
      const rr = await prisma.researchReport.findFirst({
        where: { id: input.researchReportId, projectId, isDeleted: false },
        select: { id: true },
      });
      if (!rr) {
        throw Object.assign(new Error('Research report not found'), { statusCode: 404 });
      }
    }
  }

  private mapStrategyList(row: {
    id: string;
    projectId: string;
    name: string;
    angle: StrategyListItem['angle'];
    objective: StrategyListItem['objective'];
    outputType: StrategyListItem['outputType'];
    createdAt: Date;
    updatedAt: Date;
  }): StrategyListItem {
    return {
      id: row.id,
      projectId: row.projectId,
      name: row.name,
      angle: row.angle,
      objective: row.objective,
      outputType: row.outputType,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapStrategyDetail(row: {
    id: string;
    projectId: string;
    createdBy: string;
    name: string;
    angle: StrategyResponse['angle'];
    objective: StrategyResponse['objective'];
    outputType: StrategyResponse['outputType'];
    cadence: StrategyResponse['cadence'];
    tone: StrategyResponse['tone'];
    senderPersona: StrategyResponse['senderPersona'];
    pacingNotes: string | null;
    companyId: string | null;
    companyResearchId: string | null;
    researchReportId: string | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): StrategyResponse {
    return {
      ...this.mapStrategyList(row),
      createdBy: row.createdBy,
      cadence: row.cadence,
      tone: row.tone,
      senderPersona: row.senderPersona,
      pacingNotes: row.pacingNotes,
      companyId: row.companyId,
      companyResearchId: row.companyResearchId,
      researchReportId: row.researchReportId,
      metadata: row.metadata,
    };
  }

  private mapStepList(row: {
    id: string;
    strategyId: string;
    role: string;
    day: number;
    stepOrder: number;
    assetName: string;
    channel: string;
    strategyAngle: StrategyStepItem['strategyAngle'];
    confidence: string;
    preview: string;
    subjectLine: string | null;
    activationAssetId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): StrategyStepItem {
    return {
      id: row.id,
      strategyId: row.strategyId,
      role: row.role,
      day: row.day,
      stepOrder: row.stepOrder,
      assetName: row.assetName,
      channel: row.channel,
      strategyAngle: row.strategyAngle,
      confidence: row.confidence,
      preview: row.preview,
      subjectLine: row.subjectLine,
      activationAssetId: row.activationAssetId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapStepDetail(row: {
    id: string;
    strategyId: string;
    createdBy: string;
    role: string;
    day: number;
    stepOrder: number;
    assetName: string;
    channel: string;
    strategyAngle: StrategyStepResponse['strategyAngle'];
    confidence: string;
    preview: string;
    subjectLine: string | null;
    activationAssetId: string | null;
    companyId: string | null;
    companyResearchId: string | null;
    researchReportId: string | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): StrategyStepResponse {
    return {
      ...this.mapStepList(row),
      createdBy: row.createdBy,
      companyId: row.companyId,
      companyResearchId: row.companyResearchId,
      researchReportId: row.researchReportId,
      metadata: row.metadata,
    };
  }

  private mapActivationList(row: {
    id: string;
    projectId: string;
    source: string;
    objective: ActivationAssetListItem['objective'];
    outputType: ActivationAssetListItem['outputType'];
    createdAt: Date;
    updatedAt: Date;
  }): ActivationAssetListItem {
    return {
      id: row.id,
      projectId: row.projectId,
      source: row.source,
      objective: row.objective,
      outputType: row.outputType,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapActivationDetail(row: {
    id: string;
    projectId: string;
    createdBy: string;
    source: string;
    angleUsed: ActivationAssetResponse['angleUsed'];
    insightClaim: string;
    confidence: string;
    objective: ActivationAssetResponse['objective'];
    outputType: ActivationAssetResponse['outputType'];
    outputPreview: string;
    subjectLine: string | null;
    strategicAngle: string | null;
    whyItFits: string | null;
    approachGuidance: string | null;
    companyResearchId: string | null;
    researchReportId: string | null;
    companyId: string | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): ActivationAssetResponse {
    return {
      ...this.mapActivationList(row),
      createdBy: row.createdBy,
      angleUsed: row.angleUsed,
      insightClaim: row.insightClaim,
      confidence: row.confidence,
      outputPreview: row.outputPreview,
      subjectLine: row.subjectLine,
      strategicAngle: row.strategicAngle,
      whyItFits: row.whyItFits,
      approachGuidance: row.approachGuidance,
      companyResearchId: row.companyResearchId,
      researchReportId: row.researchReportId,
      companyId: row.companyId,
      metadata: row.metadata,
    };
  }

  async listStrategies(
    userId: string,
    projectId: string,
    query: StrategyListQueryDtoType
  ): Promise<PaginatedStrategies> {
    await assertProjectAccess(userId, projectId);

    const where: Prisma.StrategyWhereInput = {
      projectId,
      isDeleted: false,
      ...(query.companyResearchId ? { companyResearchId: query.companyResearchId } : {}),
      ...(query.researchReportId ? { researchReportId: query.researchReportId } : {}),
      ...(query.q
        ? {
            name: { contains: query.q, mode: 'insensitive' },
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const orderBy: Prisma.StrategyOrderByWithRelationInput = (() => {
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
    })();

    const [totalCount, rows] = await prisma.$transaction([
      prisma.strategy.count({ where }),
      prisma.strategy.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        select: {
          id: true,
          projectId: true,
          name: true,
          angle: true,
          objective: true,
          outputType: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize);

    return {
      items: rows.map((r) => this.mapStrategyList(r)),
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages,
    };
  }

  async createStrategy(
    userId: string,
    projectId: string,
    dto: CreateStrategyDtoType
  ): Promise<StrategyResponse> {
    await assertProjectAccess(userId, projectId);

    const { upsert: _upsert, ...payload } = dto;
    void _upsert;

    await this.validateOptionalFks(projectId, {
      companyId: payload.companyId,
      companyResearchId: payload.companyResearchId,
      researchReportId: payload.researchReportId,
    });

    const createData: Prisma.StrategyUncheckedCreateInput = {
      projectId,
      createdBy: userId,
      name: payload.name,
      angle: payload.angle,
      objective: payload.objective,
      outputType: payload.outputType,
      tone: payload.tone,
      senderPersona: payload.senderPersona,
    };

    if (payload.cadence !== undefined && payload.cadence !== null) {
      createData.cadence = payload.cadence;
    }
    if (payload.pacingNotes !== undefined) {
      createData.pacingNotes = payload.pacingNotes;
    }
    if (payload.companyId !== undefined && payload.companyId !== null) {
      createData.companyId = payload.companyId;
    }
    if (payload.companyResearchId !== undefined && payload.companyResearchId !== null) {
      createData.companyResearchId = payload.companyResearchId;
    }
    if (payload.researchReportId !== undefined && payload.researchReportId !== null) {
      createData.researchReportId = payload.researchReportId;
    }
    if (payload.metadata !== undefined) {
      createData.metadata = toNullablePrismaJson(payload.metadata);
    }

    const created = await prisma.strategy.create({
      data: createData,
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        name: true,
        angle: true,
        objective: true,
        outputType: true,
        cadence: true,
        tone: true,
        senderPersona: true,
        pacingNotes: true,
        companyId: true,
        companyResearchId: true,
        researchReportId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`createStrategy projectId=${projectId} strategyId=${created.id}`);
    return this.mapStrategyDetail(created);
  }

  async getStrategy(userId: string, projectId: string, strategyId: string): Promise<StrategyResponse | null> {
    await assertProjectAccess(userId, projectId);

    const row = await prisma.strategy.findFirst({
      where: { id: strategyId, projectId, isDeleted: false },
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        name: true,
        angle: true,
        objective: true,
        outputType: true,
        cadence: true,
        tone: true,
        senderPersona: true,
        pacingNotes: true,
        companyId: true,
        companyResearchId: true,
        researchReportId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return row ? this.mapStrategyDetail(row) : null;
  }

  async updateStrategy(
    userId: string,
    projectId: string,
    strategyId: string,
    dto: UpdateStrategyDtoType
  ): Promise<StrategyResponse | null> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.strategy.findFirst({
      where: { id: strategyId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    await this.validateOptionalFks(projectId, {
      companyId: dto.companyId,
      companyResearchId: dto.companyResearchId,
      researchReportId: dto.researchReportId,
    });

    const data: Prisma.StrategyUncheckedUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.angle !== undefined) {
      data.angle = dto.angle;
    }
    if (dto.objective !== undefined) {
      data.objective = dto.objective;
    }
    if (dto.outputType !== undefined) {
      data.outputType = dto.outputType;
    }
    if (dto.cadence !== undefined) {
      data.cadence = dto.cadence;
    }
    if (dto.tone !== undefined) {
      data.tone = dto.tone;
    }
    if (dto.senderPersona !== undefined) {
      data.senderPersona = dto.senderPersona;
    }
    if (dto.pacingNotes !== undefined) {
      data.pacingNotes = dto.pacingNotes;
    }
    if (dto.companyId !== undefined) {
      data.companyId = dto.companyId;
    }
    if (dto.companyResearchId !== undefined) {
      data.companyResearchId = dto.companyResearchId;
    }
    if (dto.researchReportId !== undefined) {
      data.researchReportId = dto.researchReportId;
    }
    if (dto.metadata !== undefined) {
      data.metadata = toNullablePrismaJson(dto.metadata);
    }

    const updated = await prisma.strategy.update({
      where: { id: strategyId },
      data,
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        name: true,
        angle: true,
        objective: true,
        outputType: true,
        cadence: true,
        tone: true,
        senderPersona: true,
        pacingNotes: true,
        companyId: true,
        companyResearchId: true,
        researchReportId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapStrategyDetail(updated);
  }

  async softDeleteStrategy(userId: string, projectId: string, strategyId: string): Promise<boolean> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.strategy.findFirst({
      where: { id: strategyId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }

    await prisma.strategy.update({
      where: { id: strategyId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return true;
  }

  async listStrategySteps(
    userId: string,
    projectId: string,
    strategyId: string,
    query: StrategyStepListQueryDtoType
  ): Promise<PaginatedStrategySteps> {
    await assertProjectAccess(userId, projectId);

    const strategy = await prisma.strategy.findFirst({
      where: { id: strategyId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!strategy) {
      throw Object.assign(new Error('Strategy not found'), { statusCode: 404 });
    }

    const where: Prisma.StrategyStepWhereInput = {
      strategyId,
      isDeleted: false,
    };

    const skip = (query.page - 1) * query.pageSize;

    const orderBy: Prisma.StrategyStepOrderByWithRelationInput = (() => {
      const dir = query.sortOrder;
      switch (query.sortBy) {
        case 'createdAt':
          return { createdAt: dir };
        case 'day':
          return { day: dir };
        case 'stepOrder':
          return { stepOrder: dir };
        case 'updatedAt':
        default:
          return { updatedAt: dir };
      }
    })();

    const [totalCount, rows] = await prisma.$transaction([
      prisma.strategyStep.count({ where }),
      prisma.strategyStep.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        select: {
          id: true,
          strategyId: true,
          role: true,
          day: true,
          stepOrder: true,
          assetName: true,
          channel: true,
          strategyAngle: true,
          confidence: true,
          preview: true,
          subjectLine: true,
          activationAssetId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize);

    return {
      items: rows.map((r) => this.mapStepList(r)),
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages,
    };
  }

  async createStrategyStep(
    userId: string,
    projectId: string,
    strategyId: string,
    dto: CreateStrategyStepDtoType
  ): Promise<StrategyStepResponse> {
    await assertProjectAccess(userId, projectId);

    const strategy = await prisma.strategy.findFirst({
      where: { id: strategyId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!strategy) {
      throw Object.assign(new Error('Strategy not found'), { statusCode: 404 });
    }

    await this.validateOptionalFks(projectId, {
      companyId: dto.companyId,
      companyResearchId: dto.companyResearchId,
      researchReportId: dto.researchReportId,
    });

    const createData: Prisma.StrategyStepUncheckedCreateInput = {
      strategyId,
      createdBy: userId,
      role: dto.role,
      day: dto.day,
      stepOrder: dto.stepOrder,
      assetName: dto.assetName,
      channel: dto.channel,
      strategyAngle: dto.strategyAngle,
      confidence: dto.confidence,
      preview: dto.preview,
    };

    if (dto.subjectLine !== undefined) {
      createData.subjectLine = dto.subjectLine;
    }
    if (dto.companyId !== undefined && dto.companyId !== null) {
      createData.companyId = dto.companyId;
    }
    if (dto.companyResearchId !== undefined && dto.companyResearchId !== null) {
      createData.companyResearchId = dto.companyResearchId;
    }
    if (dto.researchReportId !== undefined && dto.researchReportId !== null) {
      createData.researchReportId = dto.researchReportId;
    }
    if (dto.activationAssetId !== undefined && dto.activationAssetId !== null) {
      createData.activationAssetId = dto.activationAssetId;
    }
    if (dto.metadata !== undefined) {
      createData.metadata = toNullablePrismaJson(dto.metadata);
    }

    const created = await prisma.strategyStep.create({
      data: createData,
      select: {
        id: true,
        strategyId: true,
        createdBy: true,
        role: true,
        day: true,
        stepOrder: true,
        assetName: true,
        channel: true,
        strategyAngle: true,
        confidence: true,
        preview: true,
        subjectLine: true,
        activationAssetId: true,
        companyId: true,
        companyResearchId: true,
        researchReportId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapStepDetail(created);
  }

  async getStrategyStep(
    userId: string,
    projectId: string,
    strategyId: string,
    stepId: string
  ): Promise<StrategyStepResponse | null> {
    await assertProjectAccess(userId, projectId);

    const row = await prisma.strategyStep.findFirst({
      where: {
        id: stepId,
        strategyId,
        isDeleted: false,
        strategy: { projectId, isDeleted: false },
      },
      select: {
        id: true,
        strategyId: true,
        createdBy: true,
        role: true,
        day: true,
        stepOrder: true,
        assetName: true,
        channel: true,
        strategyAngle: true,
        confidence: true,
        preview: true,
        subjectLine: true,
        activationAssetId: true,
        companyId: true,
        companyResearchId: true,
        researchReportId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return row ? this.mapStepDetail(row) : null;
  }

  async updateStrategyStep(
    userId: string,
    projectId: string,
    strategyId: string,
    stepId: string,
    dto: UpdateStrategyStepDtoType
  ): Promise<StrategyStepResponse | null> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.strategyStep.findFirst({
      where: {
        id: stepId,
        strategyId,
        isDeleted: false,
        strategy: { projectId, isDeleted: false },
      },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    await this.validateOptionalFks(projectId, {
      companyId: dto.companyId,
      companyResearchId: dto.companyResearchId,
      researchReportId: dto.researchReportId,
    });

    const data: Prisma.StrategyStepUncheckedUpdateInput = {};

    if (dto.role !== undefined) {
      data.role = dto.role;
    }
    if (dto.day !== undefined) {
      data.day = dto.day;
    }
    if (dto.stepOrder !== undefined) {
      data.stepOrder = dto.stepOrder;
    }
    if (dto.assetName !== undefined) {
      data.assetName = dto.assetName;
    }
    if (dto.channel !== undefined) {
      data.channel = dto.channel;
    }
    if (dto.strategyAngle !== undefined) {
      data.strategyAngle = dto.strategyAngle;
    }
    if (dto.confidence !== undefined) {
      data.confidence = dto.confidence;
    }
    if (dto.preview !== undefined) {
      data.preview = dto.preview;
    }
    if (dto.subjectLine !== undefined) {
      data.subjectLine = dto.subjectLine;
    }
    if (dto.companyId !== undefined) {
      data.companyId = dto.companyId;
    }
    if (dto.companyResearchId !== undefined) {
      data.companyResearchId = dto.companyResearchId;
    }
    if (dto.researchReportId !== undefined) {
      data.researchReportId = dto.researchReportId;
    }
    if (dto.activationAssetId !== undefined) {
      data.activationAssetId = dto.activationAssetId;
    }
    if (dto.metadata !== undefined) {
      data.metadata = toNullablePrismaJson(dto.metadata);
    }

    const updated = await prisma.strategyStep.update({
      where: { id: stepId },
      data,
      select: {
        id: true,
        strategyId: true,
        createdBy: true,
        role: true,
        day: true,
        stepOrder: true,
        assetName: true,
        channel: true,
        strategyAngle: true,
        confidence: true,
        preview: true,
        subjectLine: true,
        activationAssetId: true,
        companyId: true,
        companyResearchId: true,
        researchReportId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapStepDetail(updated);
  }

  async softDeleteStrategyStep(
    userId: string,
    projectId: string,
    strategyId: string,
    stepId: string
  ): Promise<boolean> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.strategyStep.findFirst({
      where: {
        id: stepId,
        strategyId,
        isDeleted: false,
        strategy: { projectId, isDeleted: false },
      },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }

    await prisma.strategyStep.update({
      where: { id: stepId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return true;
  }

  async listActivationAssets(
    userId: string,
    projectId: string,
    query: ActivationAssetListQueryDtoType
  ): Promise<PaginatedActivationAssets> {
    await assertProjectAccess(userId, projectId);

    const where: Prisma.ActivationAssetWhereInput = {
      projectId,
      isDeleted: false,
      ...(query.companyResearchId ? { companyResearchId: query.companyResearchId } : {}),
      ...(query.researchReportId ? { researchReportId: query.researchReportId } : {}),
      ...(query.outputType ? { outputType: query.outputType } : {}),
      ...(query.q
        ? {
            OR: [
              { source: { contains: query.q, mode: 'insensitive' } },
              { insightClaim: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const orderBy: Prisma.ActivationAssetOrderByWithRelationInput = (() => {
      const dir = query.sortOrder;
      switch (query.sortBy) {
        case 'createdAt':
          return { createdAt: dir };
        case 'source':
          return { source: dir };
        case 'updatedAt':
        default:
          return { updatedAt: dir };
      }
    })();

    const [totalCount, rows] = await prisma.$transaction([
      prisma.activationAsset.count({ where }),
      prisma.activationAsset.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        select: {
          id: true,
          projectId: true,
          source: true,
          objective: true,
          outputType: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize);

    return {
      items: rows.map((r) => this.mapActivationList(r)),
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages,
    };
  }

  async createActivationAsset(
    userId: string,
    projectId: string,
    dto: CreateActivationAssetDtoType
  ): Promise<ActivationAssetResponse> {
    await assertProjectAccess(userId, projectId);

    await this.validateOptionalFks(projectId, {
      companyId: dto.companyId,
      companyResearchId: dto.companyResearchId,
      researchReportId: dto.researchReportId,
    });

    const createData: Prisma.ActivationAssetUncheckedCreateInput = {
      projectId,
      createdBy: userId,
      source: dto.source,
      angleUsed: dto.angleUsed,
      insightClaim: dto.insightClaim,
      confidence: dto.confidence,
      objective: dto.objective,
      outputType: dto.outputType,
      outputPreview: dto.outputPreview,
    };

    if (dto.subjectLine !== undefined) {
      createData.subjectLine = dto.subjectLine;
    }
    if (dto.strategicAngle !== undefined) {
      createData.strategicAngle = dto.strategicAngle;
    }
    if (dto.whyItFits !== undefined) {
      createData.whyItFits = dto.whyItFits;
    }
    if (dto.approachGuidance !== undefined) {
      createData.approachGuidance = dto.approachGuidance;
    }
    if (dto.companyResearchId !== undefined && dto.companyResearchId !== null) {
      createData.companyResearchId = dto.companyResearchId;
    }
    if (dto.researchReportId !== undefined && dto.researchReportId !== null) {
      createData.researchReportId = dto.researchReportId;
    }
    if (dto.companyId !== undefined && dto.companyId !== null) {
      createData.companyId = dto.companyId;
    }
    if (dto.metadata !== undefined) {
      createData.metadata = toNullablePrismaJson(dto.metadata);
    }

    const created = await prisma.activationAsset.create({
      data: createData,
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        source: true,
        angleUsed: true,
        insightClaim: true,
        confidence: true,
        objective: true,
        outputType: true,
        outputPreview: true,
        subjectLine: true,
        strategicAngle: true,
        whyItFits: true,
        approachGuidance: true,
        companyResearchId: true,
        researchReportId: true,
        companyId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapActivationDetail(created);
  }

  async getActivationAsset(
    userId: string,
    projectId: string,
    activationAssetId: string
  ): Promise<ActivationAssetResponse | null> {
    await assertProjectAccess(userId, projectId);

    const row = await prisma.activationAsset.findFirst({
      where: { id: activationAssetId, projectId, isDeleted: false },
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        source: true,
        angleUsed: true,
        insightClaim: true,
        confidence: true,
        objective: true,
        outputType: true,
        outputPreview: true,
        subjectLine: true,
        strategicAngle: true,
        whyItFits: true,
        approachGuidance: true,
        companyResearchId: true,
        researchReportId: true,
        companyId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return row ? this.mapActivationDetail(row) : null;
  }

  async updateActivationAsset(
    userId: string,
    projectId: string,
    activationAssetId: string,
    dto: UpdateActivationAssetDtoType
  ): Promise<ActivationAssetResponse | null> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.activationAsset.findFirst({
      where: { id: activationAssetId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    await this.validateOptionalFks(projectId, {
      companyId: dto.companyId,
      companyResearchId: dto.companyResearchId,
      researchReportId: dto.researchReportId,
    });

    const data: Prisma.ActivationAssetUncheckedUpdateInput = {};

    if (dto.source !== undefined) {
      data.source = dto.source;
    }
    if (dto.angleUsed !== undefined) {
      data.angleUsed = dto.angleUsed;
    }
    if (dto.insightClaim !== undefined) {
      data.insightClaim = dto.insightClaim;
    }
    if (dto.confidence !== undefined) {
      data.confidence = dto.confidence;
    }
    if (dto.objective !== undefined) {
      data.objective = dto.objective;
    }
    if (dto.outputType !== undefined) {
      data.outputType = dto.outputType;
    }
    if (dto.outputPreview !== undefined) {
      data.outputPreview = dto.outputPreview;
    }
    if (dto.subjectLine !== undefined) {
      data.subjectLine = dto.subjectLine;
    }
    if (dto.strategicAngle !== undefined) {
      data.strategicAngle = dto.strategicAngle;
    }
    if (dto.whyItFits !== undefined) {
      data.whyItFits = dto.whyItFits;
    }
    if (dto.approachGuidance !== undefined) {
      data.approachGuidance = dto.approachGuidance;
    }
    if (dto.companyResearchId !== undefined) {
      data.companyResearchId = dto.companyResearchId;
    }
    if (dto.researchReportId !== undefined) {
      data.researchReportId = dto.researchReportId;
    }
    if (dto.companyId !== undefined) {
      data.companyId = dto.companyId;
    }
    if (dto.metadata !== undefined) {
      data.metadata = toNullablePrismaJson(dto.metadata);
    }

    const updated = await prisma.activationAsset.update({
      where: { id: activationAssetId },
      data,
      select: {
        id: true,
        projectId: true,
        createdBy: true,
        source: true,
        angleUsed: true,
        insightClaim: true,
        confidence: true,
        objective: true,
        outputType: true,
        outputPreview: true,
        subjectLine: true,
        strategicAngle: true,
        whyItFits: true,
        approachGuidance: true,
        companyResearchId: true,
        researchReportId: true,
        companyId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapActivationDetail(updated);
  }

  async softDeleteActivationAsset(
    userId: string,
    projectId: string,
    activationAssetId: string
  ): Promise<boolean> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.activationAsset.findFirst({
      where: { id: activationAssetId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }

    await prisma.activationAsset.update({
      where: { id: activationAssetId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return true;
  }
}
