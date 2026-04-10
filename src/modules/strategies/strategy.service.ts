// ============================================================================
// IMPORTS
// ============================================================================

// Config
import { prisma } from '../../config/prisma.js';

// Prisma
import { Prisma } from '../../generated/prisma/client.js';

// Prisma enums
import { Cadence, OutputType } from '../../generated/prisma/enums.js';

// Gemini
import { geminiService } from '../gemini/gemini.service.js';
import type { ActivationContext, ResearchResult, UserContext } from '../gemini/types/gemini.types.js';

// Utils
import { assertProjectAccess } from '../../utils/helpers/projectAccess.js';
import { createLogger } from '../../utils/helpers/logger.js';
import { toNullablePrismaJson } from '../../utils/prisma/jsonInputs.js';
import type { JsonValue } from '../../utils/validation/jsonValue.schema.js';

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
  StrategyCreateBundle,
  StrategyListItem,
  StrategyResponse,
  StrategyStepItem,
  StrategyStepResponse,
} from './types/strategy.types.js';

import {
  mapCadenceLabelToEnum,
  mapObjectiveLabelToEnum,
  mapPersonaLabelToEnum,
  mapToneLabelToEnum,
  strategicAngleToUiLabel,
} from './strategyLabelMaps.js';

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

  private async companyNameForActivationAsset(projectId: string, companyId: string | null): Promise<{ companyName: string | null } | null> {
    if (companyId === null || companyId === undefined) {
      return null;
    }
    const c = await prisma.company.findFirst({
      where: { id: companyId, projectId },
      select: { companyName: true },
    });
    return c ? { companyName: c.companyName } : null;
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
    company?: { companyName: string | null } | null;
  }): ActivationAssetResponse {
    const { company, ...listRow } = row;
    const companyName =
      company?.companyName !== undefined && company?.companyName !== null ? company.companyName.trim() : '';
    const base: ActivationAssetResponse = {
      ...this.mapActivationList(listRow),
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
    return companyName.length > 0 ? { ...base, companyName } : base;
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

  async createStrategy(userId: string, projectId: string, dto: CreateStrategyDtoType): Promise<StrategyCreateBundle> {
    await assertProjectAccess(userId, projectId);

    const { upsert: _upsert, ...payload } = dto;
    void _upsert;

    if (payload.llmGeneration) {
      return this.createStrategyWithLlm(userId, projectId, payload);
    }

    if (
      payload.objective === undefined ||
      payload.outputType === undefined ||
      payload.tone === undefined ||
      payload.senderPersona === undefined
    ) {
      throw Object.assign(new Error('objective, outputType, tone, and senderPersona are required'), { statusCode: 400 });
    }

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
    return {
      strategy: this.mapStrategyDetail(created),
      steps: [],
      activationAssets: [],
    };
  }

  private isPlainRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private extractResearchResultFromCompanyResearch(raw: Prisma.JsonValue | null): ResearchResult {
    if (raw === null || raw === undefined) {
      throw Object.assign(new Error('Company research data missing'), { statusCode: 400 });
    }
    let root: unknown = raw;
    if (typeof raw === 'string') {
      try {
        root = JSON.parse(raw) as unknown;
      } catch {
        throw Object.assign(new Error('Invalid company research JSON'), { statusCode: 400 });
      }
    }
    if (!this.isPlainRecord(root)) {
      throw Object.assign(new Error('Company research data is not an object'), { statusCode: 400 });
    }
    const nested = root['data'];
    const dataLayer = this.isPlainRecord(nested) ? nested : root;
    return dataLayer as unknown as ResearchResult;
  }

  private inferChannelFromOutputType(outputType: string): string {
    const t = outputType.toLowerCase();
    if (t.includes('linkedin')) {
      return 'LinkedIn';
    }
    if (t.includes('call')) {
      return 'Call';
    }
    return 'Email';
  }

  private toFoundationConfidence(value: string): 'High' | 'Medium' | 'Low' {
    if (value === 'High' || value === 'Medium' || value === 'Low') {
      return value;
    }
    return 'Medium';
  }

  private async createStrategyWithLlm(
    userId: string,
    projectId: string,
    payload: CreateStrategyDtoType
  ): Promise<StrategyCreateBundle> {
    const llm = payload.llmGeneration;
    if (!llm) {
      throw Object.assign(new Error('LLM generation payload missing'), { statusCode: 400 });
    }

    const companyId = payload.companyId;
    const companyResearchId = payload.companyResearchId;
    const researchReportId = payload.researchReportId;

    if (
      companyId === undefined ||
      companyId === null ||
      companyResearchId === undefined ||
      companyResearchId === null ||
      researchReportId === undefined ||
      researchReportId === null
    ) {
      throw Object.assign(new Error('companyId, companyResearchId, and researchReportId are required for LLM strategy'), {
        statusCode: 400,
      });
    }

    await this.validateOptionalFks(projectId, {
      companyId,
      companyResearchId,
      researchReportId,
    });

    const companyResearch = await prisma.companyResearch.findFirst({
      where: { id: companyResearchId, projectId, isDeleted: false },
      include: {
        company: { select: { companyName: true } },
      },
    });
    if (!companyResearch) {
      throw Object.assign(new Error('Company research not found'), { statusCode: 404 });
    }

    const researchData = this.extractResearchResultFromCompanyResearch(companyResearch.researchData);

    const angle = payload.angle;
    const foundation =
      angle === 'PRIMARY'
        ? researchData.primaryFoundation
        : angle === 'SUPPORTING'
          ? researchData.supportingFoundation
          : researchData.contrarianFoundation;

    const companyDisplayName =
      researchData.formalCompanyName.trim().length > 0
        ? researchData.formalCompanyName
        : companyResearch.company.companyName ?? 'Unknown';

    const activation: ActivationContext = {
      companyName: companyDisplayName,
      angle: strategicAngleToUiLabel(angle),
      researchData,
      foundation,
    };

    const u = llm.userContext;
    const user: UserContext = {
      campaignGoal: u.campaignGoal,
      proposition: u.proposition,
      audience: u.audience,
      ...(u.language !== undefined ? { language: u.language } : {}),
      ...(u.influenceFocus !== undefined ? { influenceFocus: u.influenceFocus } : {}),
      ...(u.importantConsiderations !== undefined ? { importantConsiderations: u.importantConsiderations } : {}),
      ...(u.toneOfVoiceContent !== undefined ? { toneOfVoiceContent: u.toneOfVoiceContent } : {}),
    };

    const objectiveEnum = mapObjectiveLabelToEnum(llm.labels.objective);
    const toneEnum = mapToneLabelToEnum(llm.labels.tone);
    const personaEnum = mapPersonaLabelToEnum(llm.labels.persona);

    let outputTypeEnum: OutputType;
    let cadenceEnum: Cadence | null = null;

    if (llm.mode === 'LIBRARY_MISSING_TOUCHPOINTS') {
      outputTypeEnum = OutputType.OUTREACH_FRAMEWORK;
      const cadenceLabel = llm.labels.cadence?.trim();
      if (cadenceLabel === undefined || cadenceLabel.length === 0) {
        throw Object.assign(new Error('Cadence is required for library missing touchpoints'), { statusCode: 400 });
      }
      cadenceEnum = mapCadenceLabelToEnum(cadenceLabel);
      const libraryPayload = llm.library;
      if (!libraryPayload) {
        throw Object.assign(new Error('Library payload is required'), { statusCode: 400 });
      }

      const missingTypes = libraryPayload.missingTypes;
      const generatedMissing =
        missingTypes.length > 0
          ? await geminiService.generateMissingTouchpoints(
              activation,
              user,
              {
                objective: llm.labels.objective,
                tone: llm.labels.tone,
                persona: llm.labels.persona,
              },
              missingTypes,
              {
                userId,
                projectId,
                companyResearchId,
                researchReportId,
                companyId,
              }
            )
          : [];

      const existingIds = libraryPayload.stepBlueprints
        .map((b) => b.existing?.activationAssetId)
        .filter((id): id is string => id !== undefined);
      const existingAssets =
        existingIds.length > 0
          ? await prisma.activationAsset.findMany({
              where: { id: { in: existingIds }, projectId, isDeleted: false },
              select: { id: true },
            })
          : [];
      const existingAssetIdSet = new Set(existingAssets.map((a) => a.id));
      for (const id of existingIds) {
        if (!existingAssetIdSet.has(id)) {
          throw Object.assign(new Error(`Activation asset not found: ${id}`), { statusCode: 404 });
        }
      }

      const bundle = await prisma.$transaction(async (tx) => {
        await tx.strategy.updateMany({
          where: {
            projectId,
            companyId,
            angle,
            objective: objectiveEnum,
            outputType: outputTypeEnum,
            isDeleted: false,
          },
          data: { isDeleted: true, deletedAt: new Date() },
        });

        const strategyRow = await tx.strategy.create({
          data: {
            projectId,
            createdBy: userId,
            name: payload.name,
            angle,
            objective: objectiveEnum,
            outputType: outputTypeEnum,
            cadence: cadenceEnum,
            tone: toneEnum,
            senderPersona: personaEnum,
            companyId,
            companyResearchId,
            researchReportId,
            metadata: toNullablePrismaJson(strategyMetadata),
          },
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

        const activationAssets: ActivationAssetResponse[] = [];
        const stepResponses: StrategyStepResponse[] = [];
        const generatedQueue = [...generatedMissing];
        const sortedBlueprints = [...libraryPayload.stepBlueprints].sort((a, b) => a.stepOrder - b.stepOrder);

        for (const blueprint of sortedBlueprints) {
          let activationAssetId: string | null = null;
          let assetName = '';
          let channel = '';
          let confidence: 'High' | 'Medium' | 'Low' = foundation.confidence;
          let preview = '';
          let subjectLine: string | null = null;
          let metadataForStep: JsonValue | null = null;

          if (blueprint.existing) {
            activationAssetId = blueprint.existing.activationAssetId;
            assetName = blueprint.existing.assetName;
            channel = blueprint.existing.channel;
            confidence = this.toFoundationConfidence(blueprint.existing.confidence);
            preview = blueprint.existing.preview;
            subjectLine = blueprint.existing.subjectLine ?? null;
          } else {
            const nextGenerated = generatedQueue.shift();
            if (!nextGenerated) {
              throw Object.assign(new Error('Missing generated touchpoints for one or more blueprint slots'), { statusCode: 500 });
            }
            const createdAsset = await tx.activationAsset.create({
              data: {
                projectId,
                createdBy: userId,
                source: 'library_missing_touchpoints',
                angleUsed: angle,
                insightClaim: foundation.trigger,
                confidence: foundation.confidence,
                objective: objectiveEnum,
                outputType: OutputType.SINGLE_TOUCHPOINT,
                outputPreview: nextGenerated.content,
                subjectLine: nextGenerated.subject_line ?? null,
                strategicAngle: nextGenerated.strategic_angle,
                whyItFits: nextGenerated.objective_fit,
                approachGuidance: nextGenerated.approach_guidance,
                companyResearchId,
                researchReportId,
                companyId,
              },
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
            activationAssets.push(this.mapActivationDetail(createdAsset));
            activationAssetId = createdAsset.id;
            assetName = nextGenerated.output_type;
            channel = this.inferChannelFromOutputType(nextGenerated.output_type);
            confidence = foundation.confidence;
            preview = nextGenerated.content;
            subjectLine = nextGenerated.subject_line ?? null;
            metadataForStep = JSON.parse(
              JSON.stringify({
                strategic_angle: nextGenerated.strategic_angle,
                objective_fit: nextGenerated.objective_fit,
                approach_guidance: nextGenerated.approach_guidance,
              })
            ) as JsonValue;
          }

          const createdStep = await tx.strategyStep.create({
            data: {
              strategyId: strategyRow.id,
              createdBy: userId,
              role: blueprint.role,
              day: blueprint.day,
              stepOrder: blueprint.stepOrder,
              assetName,
              channel,
              strategyAngle: angle,
              confidence,
              preview,
              subjectLine,
              companyId,
              companyResearchId,
              researchReportId,
              activationAssetId,
              ...(metadataForStep ? { metadata: toNullablePrismaJson(metadataForStep) } : {}),
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
          stepResponses.push(this.mapStepDetail(createdStep));
        }

        return {
          strategy: this.mapStrategyDetail(strategyRow),
          steps: stepResponses,
          activationAssets,
        };
      });

      logger.info(`createStrategyWithLlm LIBRARY projectId=${projectId} strategyId=${bundle.strategy.id}`);
      return bundle;
    }

    if (llm.mode === 'MULTI_TOUCH') {
      outputTypeEnum = OutputType.OUTREACH_FRAMEWORK;
      const cadenceLabel = llm.labels.cadence?.trim();
      if (cadenceLabel === undefined || cadenceLabel.length === 0) {
        throw Object.assign(new Error('Cadence is required for multi-touch'), { statusCode: 400 });
      }
      cadenceEnum = mapCadenceLabelToEnum(cadenceLabel);
    } else {
      outputTypeEnum = OutputType.SINGLE_TOUCHPOINT;
    }

    const strategyMetadata: JsonValue = JSON.parse(
      JSON.stringify(
        payload.metadata !== undefined && payload.metadata !== null
          ? {
              llmGeneration: { mode: llm.mode, labels: llm.labels },
              manualMetadata: payload.metadata,
            }
          : { llmGeneration: { mode: llm.mode, labels: llm.labels } }
      )
    ) as JsonValue;

    if (llm.mode === 'MULTI_TOUCH') {
      const cadenceLabel = llm.labels.cadence?.trim() ?? '';
      const sequence = await geminiService.generateMultiTouchSequence(
        activation,
        user,
        {
          objective: llm.labels.objective,
          cadence: cadenceLabel,
          tone: llm.labels.tone,
          persona: llm.labels.persona,
        },
        {
          userId,
          projectId,
          companyResearchId,
          researchReportId,
          companyId,
        }
      );

      const bundle = await prisma.$transaction(async (tx) => {
        await tx.strategy.updateMany({
          where: {
            projectId,
            companyId,
            angle,
            objective: objectiveEnum,
            outputType: outputTypeEnum,
            isDeleted: false,
          },
          data: { isDeleted: true, deletedAt: new Date() },
        });

        const strategyRow = await tx.strategy.create({
          data: {
            projectId,
            createdBy: userId,
            name: payload.name,
            angle,
            objective: objectiveEnum,
            outputType: outputTypeEnum,
            cadence: cadenceEnum,
            tone: toneEnum,
            senderPersona: personaEnum,
            companyId,
            companyResearchId,
            researchReportId,
            metadata: toNullablePrismaJson(strategyMetadata),
          },
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

        const stepResponses: StrategyStepResponse[] = [];
        const activationAssetResponses: ActivationAssetResponse[] = [];

        for (let i = 0; i < sequence.length; i++) {
          const step = sequence[i]!;
          const touchMeta = {
            touchpoint_output_type: step.output_type,
            strategic_angle: step.strategic_angle,
            objective_fit: step.objective_fit,
            approach_guidance: step.approach_guidance,
          } as JsonValue;

          const createdAsset = await tx.activationAsset.create({
            data: {
              projectId,
              createdBy: userId,
              source: 'LLM multi-touch generation',
              angleUsed: angle,
              insightClaim: foundation.trigger,
              confidence: foundation.confidence,
              objective: objectiveEnum,
              outputType: OutputType.SINGLE_TOUCHPOINT,
              outputPreview: step.content,
              subjectLine: step.subject_line ?? null,
              strategicAngle: step.strategic_angle,
              whyItFits: step.objective_fit,
              approachGuidance: step.approach_guidance,
              companyResearchId,
              researchReportId,
              companyId,
              metadata: toNullablePrismaJson(touchMeta),
            },
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

          activationAssetResponses.push(this.mapActivationDetail(createdAsset));

          const createdStep = await tx.strategyStep.create({
            data: {
              strategyId: strategyRow.id,
              createdBy: userId,
              role: i === 0 ? 'Interrupt' : 'Reinforce',
              day: i + 1,
              stepOrder: i,
              assetName: step.output_type,
              channel: this.inferChannelFromOutputType(step.output_type),
              strategyAngle: angle,
              confidence: foundation.confidence,
              preview: step.content,
              subjectLine: step.subject_line ?? null,
              companyId,
              companyResearchId,
              researchReportId,
              activationAssetId: createdAsset.id,
              metadata: toNullablePrismaJson(touchMeta),
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
          stepResponses.push(this.mapStepDetail(createdStep));
        }

        return {
          strategy: this.mapStrategyDetail(strategyRow),
          steps: stepResponses,
          activationAssets: activationAssetResponses,
        };
      });

      logger.info(`createStrategyWithLlm MULTI projectId=${projectId} strategyId=${bundle.strategy.id}`);
      return bundle;
    }

    const singleType = llm.labels.singleOutputType?.trim();
    if (singleType === undefined || singleType.length === 0) {
      throw Object.assign(new Error('singleOutputType is required for single-touch'), { statusCode: 400 });
    }

    const generated = await geminiService.generateCampaignAssets(
      activation,
      user,
      {
        objective: llm.labels.objective,
        type: singleType,
        tone: llm.labels.tone,
        persona: llm.labels.persona,
      },
      {
        userId,
        projectId,
        companyResearchId,
        researchReportId,
        companyId,
      },
      3
    );

    const bundle = await prisma.$transaction(async (tx) => {
      await tx.strategy.updateMany({
        where: {
          projectId,
          companyId,
          angle,
          objective: objectiveEnum,
          outputType: outputTypeEnum,
          isDeleted: false,
        },
        data: { isDeleted: true, deletedAt: new Date() },
      });

      const strategyRow = await tx.strategy.create({
        data: {
          projectId,
          createdBy: userId,
          name: payload.name,
          angle,
          objective: objectiveEnum,
          outputType: outputTypeEnum,
          cadence: null,
          tone: toneEnum,
          senderPersona: personaEnum,
          companyId,
          companyResearchId,
          researchReportId,
          metadata: toNullablePrismaJson(strategyMetadata),
        },
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

      const activationAssets: ActivationAssetResponse[] = [];
      const stepResponses: StrategyStepResponse[] = [];

      for (let i = 0; i < generated.length; i++) {
        const asset = generated[i]!;
        const aaRow = await tx.activationAsset.create({
          data: {
            projectId,
            createdBy: userId,
            source: 'LLM single-touch generation',
            angleUsed: angle,
            insightClaim: foundation.trigger,
            confidence: foundation.confidence,
            objective: objectiveEnum,
            outputType: OutputType.SINGLE_TOUCHPOINT,
            outputPreview: asset.content,
            subjectLine: asset.subject_line ?? null,
            strategicAngle: asset.strategic_angle,
            whyItFits: asset.objective_fit,
            approachGuidance: asset.approach_guidance,
            companyResearchId,
            researchReportId,
            companyId,
          },
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
        activationAssets.push(this.mapActivationDetail(aaRow));

        const createdStep = await tx.strategyStep.create({
          data: {
            strategyId: strategyRow.id,
            createdBy: userId,
            role: i === 0 ? 'Interrupt' : 'Reinforce',
            day: i + 1,
            stepOrder: i,
            assetName: singleType,
            channel: this.inferChannelFromOutputType(singleType),
            strategyAngle: angle,
            confidence: foundation.confidence,
            preview: asset.content,
            subjectLine: asset.subject_line ?? null,
            companyId,
            companyResearchId,
            researchReportId,
            activationAssetId: aaRow.id,
            metadata: toNullablePrismaJson(
              JSON.parse(
                JSON.stringify({
                  strategic_angle: asset.strategic_angle,
                  objective_fit: asset.objective_fit,
                  approach_guidance: asset.approach_guidance,
                })
              ) as JsonValue
            ),
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
        stepResponses.push(this.mapStepDetail(createdStep));
      }

      return {
        strategy: this.mapStrategyDetail(strategyRow),
        steps: stepResponses,
        activationAssets,
      };
    });

    logger.info(`createStrategyWithLlm SINGLE projectId=${projectId} strategyId=${bundle.strategy.id}`);
    return bundle;
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

    const activationListSelect = {
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
    } as const;

    const [totalCount, rows] = await prisma.$transaction([
      prisma.activationAsset.count({ where }),
      prisma.activationAsset.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        select: activationListSelect,
      }),
    ]);

    const uniqueCompanyIds = [...new Set(rows.map((r) => r.companyId).filter((id): id is string => Boolean(id)))];
    const companyRows =
      uniqueCompanyIds.length > 0
        ? await prisma.company.findMany({
            where: { id: { in: uniqueCompanyIds }, projectId },
            select: { id: true, companyName: true },
          })
        : [];
    const nameById = new Map(companyRows.map((c) => [c.id, c.companyName ?? null] as const));

    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize);

    return {
      items: rows.map((r) =>
        this.mapActivationDetail({
          ...r,
          company:
            r.companyId !== null && r.companyId !== undefined
              ? { companyName: nameById.get(r.companyId) ?? null }
              : null,
        })
      ),
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

    const company = await this.companyNameForActivationAsset(projectId, created.companyId);
    return this.mapActivationDetail({ ...created, company });
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

    if (!row) {
      return null;
    }
    const company = await this.companyNameForActivationAsset(projectId, row.companyId);
    return this.mapActivationDetail({ ...row, company });
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

    const company = await this.companyNameForActivationAsset(projectId, updated.companyId);
    return this.mapActivationDetail({ ...updated, company });
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
