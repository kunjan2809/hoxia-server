// ============================================================================
// IMPORTS
// ============================================================================

// Config
import { prisma } from '../../config/prisma.js';

// Prisma
import { Prisma } from '../../generated/prisma/client.js';

// Prisma enums
import { StrategicAngle } from '../../generated/prisma/enums.js';

// Gemini
import { GeminiService } from '../gemini/gemini.service.js';
import type { UserContext } from '../gemini/types/gemini.types.js';

// Utils
import { assertProjectAccess } from '../../utils/helpers/projectAccess.js';
import { toNullablePrismaJson, toRequiredPrismaJson } from '../../utils/prisma/jsonInputs.js';
import { jsonValueSchema } from '../../utils/validation/jsonValue.schema.js';

// DTO types
import type {
  CompanyResearchListQueryDtoType,
  CreateCompanyResearchDtoType,
  CreateResearchReportDtoType,
  ResearchReportListQueryDtoType,
  UpdateCompanyResearchDtoType,
  UpdateResearchReportDtoType,
} from './dto/research.dto.js';

// Types
import type {
  CompanyResearchListItem,
  CompanyResearchResponse,
  FoundationStrategyItem,
  PaginatedCompanyResearch,
  PaginatedResearchReports,
  ResearchReportListItem,
  ResearchReportResponse,
} from './types/research.types.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_USER_CONTEXT: UserContext = {
  campaignGoal: '',
  proposition: '',
  audience: '',
  language: 'English',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const isRecord = (value: Prisma.JsonValue): value is Record<string, Prisma.JsonValue> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const mapResearchJsonToReportPayload = (
  researchData: Prisma.JsonValue | null
): {
  formalCompanyName: string | null;
  industry: string | null;
  headquarters: string | null;
  strategicSummary: string | null;
  growthSignals: string | null;
  hiringSignals: string | null;
  securityRiskSignals: string | null;
  leadershipSignals: string | null;
  keyHeadwinds: string | null;
  interpretation: string | null;
  researchSources: Prisma.JsonValue | null;
} => {
  if (!isRecord(researchData)) {
    return {
      formalCompanyName: null,
      industry: null,
      headquarters: null,
      strategicSummary: null,
      growthSignals: null,
      hiringSignals: null,
      securityRiskSignals: null,
      leadershipSignals: null,
      keyHeadwinds: null,
      interpretation: null,
      researchSources: null,
    };
  }

  const root = researchData;
  const rawNested = root['data'];
  const dataLayer =
    rawNested !== undefined && isRecord(rawNested) ? rawNested : root;

  const getStr = (key: string): string | null => {
    const v = dataLayer[key];
    return typeof v === 'string' ? v : null;
  };

  return {
    formalCompanyName: getStr('formalCompanyName'),
    industry: getStr('industry'),
    headquarters: getStr('headquarters'),
    strategicSummary: getStr('summary'),
    growthSignals: getStr('growthSignals'),
    hiringSignals: getStr('hiringSignals'),
    securityRiskSignals: getStr('securitySignals'),
    leadershipSignals: getStr('leadershipSignals'),
    keyHeadwinds: getStr('keyRisks'),
    interpretation: getStr('internalInterpretation'),
    researchSources: Array.isArray(root['sources']) ? root['sources'] : null,
  };
};

const mapFoundation = (
  angle: StrategicAngle,
  raw: Prisma.JsonValue | undefined
): {
  angle: StrategicAngle;
  strategicTrigger: string | null;
  whyThisMatters: string | null;
  assetsCreated: number;
  stakeholder: string | null;
  targetRole: string | null;
  strategicPosture: string | null;
  messagingDirection: string | null;
  confidence: string | null;
  confidenceReason: string | null;
} | null => {
  if (!raw || !isRecord(raw)) {
    return null;
  }
  return {
    angle,
    strategicTrigger: typeof raw['trigger'] === 'string' ? raw['trigger'] : null,
    whyThisMatters: typeof raw['whyNow'] === 'string' ? raw['whyNow'] : null,
    assetsCreated: 0,
    stakeholder: typeof raw['stakeholder'] === 'string' ? raw['stakeholder'] : null,
    targetRole: null,
    strategicPosture: typeof raw['posture'] === 'string' ? raw['posture'] : null,
    messagingDirection: typeof raw['messagingDirection'] === 'string' ? raw['messagingDirection'] : null,
    confidence: typeof raw['confidence'] === 'string' ? raw['confidence'] : null,
    confidenceReason: typeof raw['confidenceReason'] === 'string' ? raw['confidenceReason'] : null,
  };
};

// ============================================================================
// SERVICE
// ============================================================================

export class ResearchService {
  private mapResearchListItem(row: {
    id: string;
    projectId: string;
    companyId: string;
    createdBy: string;
    researchStatus: CompanyResearchListItem['researchStatus'];
    sortOrder: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): CompanyResearchListItem {
    return {
      id: row.id,
      projectId: row.projectId,
      companyId: row.companyId,
      createdBy: row.createdBy,
      researchStatus: row.researchStatus,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapCompanyResearchResponse(row: {
    id: string;
    projectId: string;
    companyId: string;
    createdBy: string;
    originalData: Prisma.JsonValue;
    researchStatus: CompanyResearchResponse['researchStatus'];
    researchData: Prisma.JsonValue | null;
    sources: Prisma.JsonValue | null;
    activeStrategy: CompanyResearchResponse['activeStrategy'];
    researchError: string | null;
    sortOrder: number | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): CompanyResearchResponse {
    return {
      ...this.mapResearchListItem(row),
      originalData: row.originalData,
      researchData: row.researchData,
      sources: row.sources,
      activeStrategy: row.activeStrategy,
      researchError: row.researchError,
      metadata: row.metadata,
    };
  }

  private mapFoundationItem(row: {
    id: string;
    reportId: string;
    angle: StrategicAngle;
    strategicTrigger: string | null;
    whyThisMatters: string | null;
    assetsCreated: number;
    stakeholder: string | null;
    targetRole: string | null;
    strategicPosture: string | null;
    messagingDirection: string | null;
    confidence: string | null;
    confidenceReason: string | null;
    lastUpdated: Date | null;
  }): FoundationStrategyItem {
    return {
      id: row.id,
      reportId: row.reportId,
      angle: row.angle,
      strategicTrigger: row.strategicTrigger,
      whyThisMatters: row.whyThisMatters,
      assetsCreated: row.assetsCreated,
      stakeholder: row.stakeholder,
      targetRole: row.targetRole,
      strategicPosture: row.strategicPosture,
      messagingDirection: row.messagingDirection,
      confidence: row.confidence,
      confidenceReason: row.confidenceReason,
      lastUpdated: row.lastUpdated ? row.lastUpdated.toISOString() : null,
    };
  }

  private mapReportListItem(row: {
    id: string;
    projectId: string;
    companyResearchId: string | null;
    formalCompanyName: string | null;
    industry: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ResearchReportListItem {
    return {
      id: row.id,
      projectId: row.projectId,
      companyResearchId: row.companyResearchId,
      formalCompanyName: row.formalCompanyName,
      industry: row.industry,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listCompanyResearch(
    userId: string,
    projectId: string,
    query: CompanyResearchListQueryDtoType
  ): Promise<PaginatedCompanyResearch> {
    await assertProjectAccess(userId, projectId);

    const where: Prisma.CompanyResearchWhereInput = {
      projectId,
      isDeleted: false,
      ...(query.researchStatus ? { researchStatus: query.researchStatus } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.q
        ? {
            OR: [
              { researchError: { contains: query.q, mode: 'insensitive' } },
              {
                company: {
                  companyName: { contains: query.q, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const orderBy: Prisma.CompanyResearchOrderByWithRelationInput = (() => {
      const dir = query.sortOrder;
      switch (query.sortBy) {
        case 'createdAt':
          return { createdAt: dir };
        case 'researchStatus':
          return { researchStatus: dir };
        case 'sortOrder':
          return { sortOrder: dir };
        case 'updatedAt':
        default:
          return { updatedAt: dir };
      }
    })();

    const [totalCount, rows] = await prisma.$transaction([
      prisma.companyResearch.count({ where }),
      prisma.companyResearch.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        select: {
          id: true,
          projectId: true,
          companyId: true,
          createdBy: true,
          researchStatus: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize);

    return {
      items: rows.map((r) => this.mapResearchListItem(r)),
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages,
    };
  }

  async createCompanyResearch(
    userId: string,
    projectId: string,
    dto: CreateCompanyResearchDtoType
  ): Promise<CompanyResearchResponse> {
    await assertProjectAccess(userId, projectId);

    const company = await prisma.company.findFirst({
      where: { id: dto.companyId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!company) {
      throw Object.assign(new Error('Company not found'), { statusCode: 404 });
    }

    const existing = await prisma.companyResearch.findFirst({
      where: { companyId: dto.companyId, isDeleted: false },
      select: { id: true },
    });
    if (existing) {
      throw Object.assign(new Error('Research already exists for this company'), { statusCode: 409 });
    }

    const createData: Prisma.CompanyResearchUncheckedCreateInput = {
      projectId,
      companyId: dto.companyId,
      createdBy: userId,
      originalData: toRequiredPrismaJson(dto.originalData),
    };

    if (dto.sortOrder !== undefined && dto.sortOrder !== null) {
      createData.sortOrder = dto.sortOrder;
    }
    if (dto.metadata !== undefined) {
      createData.metadata = toNullablePrismaJson(dto.metadata);
    }

    const created = await prisma.companyResearch.create({
      data: createData,
      select: {
        id: true,
        projectId: true,
        companyId: true,
        createdBy: true,
        originalData: true,
        researchStatus: true,
        researchData: true,
        sources: true,
        activeStrategy: true,
        researchError: true,
        sortOrder: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapCompanyResearchResponse(created);
  }

  async getCompanyResearch(
    userId: string,
    projectId: string,
    companyResearchId: string
  ): Promise<CompanyResearchResponse | null> {
    await assertProjectAccess(userId, projectId);

    const row = await prisma.companyResearch.findFirst({
      where: { id: companyResearchId, projectId, isDeleted: false },
      select: {
        id: true,
        projectId: true,
        companyId: true,
        createdBy: true,
        originalData: true,
        researchStatus: true,
        researchData: true,
        sources: true,
        activeStrategy: true,
        researchError: true,
        sortOrder: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return row ? this.mapCompanyResearchResponse(row) : null;
  }

  async updateCompanyResearch(
    userId: string,
    projectId: string,
    companyResearchId: string,
    dto: UpdateCompanyResearchDtoType
  ): Promise<CompanyResearchResponse | null> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.companyResearch.findFirst({
      where: { id: companyResearchId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const data: Prisma.CompanyResearchUpdateInput = {};
    if (dto.originalData !== undefined) {
      data.originalData = toRequiredPrismaJson(dto.originalData);
    }
    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }
    if (dto.activeStrategy !== undefined) {
      data.activeStrategy = dto.activeStrategy;
    }
    if (dto.metadata !== undefined) {
      data.metadata = toNullablePrismaJson(dto.metadata);
    }

    const updated = await prisma.companyResearch.update({
      where: { id: companyResearchId },
      data,
      select: {
        id: true,
        projectId: true,
        companyId: true,
        createdBy: true,
        originalData: true,
        researchStatus: true,
        researchData: true,
        sources: true,
        activeStrategy: true,
        researchError: true,
        sortOrder: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapCompanyResearchResponse(updated);
  }

  async softDeleteCompanyResearch(
    userId: string,
    projectId: string,
    companyResearchId: string
  ): Promise<boolean> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.companyResearch.findFirst({
      where: { id: companyResearchId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }

    await prisma.companyResearch.update({
      where: { id: companyResearchId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return true;
  }

  /**
   * @route   POST /api/projects/:projectId/company-research/:companyResearchId/run
   * @desc    Runs the Gemini research job to completion on this request and returns the final row.
   *          Clients should use a long HTTP timeout; no polling is required after this response.
   * @access  Protected
   */
  async startCompanyResearchRun(
    userId: string,
    projectId: string,
    companyResearchId: string
  ): Promise<CompanyResearchResponse> {
    await assertProjectAccess(userId, projectId);

    const row = await prisma.companyResearch.findFirst({
      where: { id: companyResearchId, projectId, isDeleted: false },
      select: {
        id: true,
        researchStatus: true,
        companyId: true,
      },
    });

    if (!row) {
      throw Object.assign(new Error('Company research not found'), { statusCode: 404 });
    }

    if (row.researchStatus === 'LOADING') {
      throw Object.assign(new Error('Research already in progress'), { statusCode: 409 });
    }

    await prisma.companyResearch.update({
      where: { id: companyResearchId },
      data: {
        researchStatus: 'LOADING',
        researchError: null,
      },
    });

    await this.executeCompanyResearchJob(userId, projectId, companyResearchId);

    const finalRow = await this.getCompanyResearch(userId, projectId, companyResearchId);
    if (!finalRow) {
      throw Object.assign(new Error('Company research not found after run'), { statusCode: 500 });
    }

    return finalRow;
  }

  private async executeCompanyResearchJob(
    _userId: string,
    projectId: string,
    companyResearchId: string
  ): Promise<void> {
    const row = await prisma.companyResearch.findFirst({
      where: { id: companyResearchId, projectId, isDeleted: false },
      include: {
        company: true,
        project: true,
      },
    });

    if (!row) {
      return;
    }

    const companyName = row.company.companyName ?? 'Unknown';
    const websiteUrl = row.company.websiteUrl ?? '';
    const linkedinUrl = row.company.linkedinUrl ?? '';

    let extraContext = '';
    if (isRecord(row.originalData)) {
      extraContext = JSON.stringify(row.originalData);
    }

    let userContext: UserContext = { ...DEFAULT_USER_CONTEXT };
    const cc = row.project.campaignContext;
    if (isRecord(cc)) {
      const cg = cc['campaignGoal'];
      const prop = cc['proposition'];
      const aud = cc['audience'];
      const lang = cc['language'];
      if (typeof cg === 'string') {
        userContext = { ...userContext, campaignGoal: cg };
      }
      if (typeof prop === 'string') {
        userContext = { ...userContext, proposition: prop };
      }
      if (typeof aud === 'string') {
        userContext = { ...userContext, audience: aud };
      }
      if (typeof lang === 'string') {
        userContext = { ...userContext, language: lang };
      }
    }

    try {
      const gemini = GeminiService.getInstance();
      const result = await gemini.researchCompany(
        companyName,
        websiteUrl,
        linkedinUrl,
        extraContext,
        userContext,
        {
          userId: row.createdBy,
          projectId: row.projectId,
          companyResearchId: row.id,
          companyId: row.companyId,
        }
      );

      const researchDataJson = jsonValueSchema.parse(JSON.parse(JSON.stringify(result.data)));
      const sourcesJson = jsonValueSchema.parse(JSON.parse(JSON.stringify(result.sources)));

      await prisma.companyResearch.update({
        where: { id: companyResearchId },
        data: {
          researchStatus: 'COMPLETED',
          researchData: toRequiredPrismaJson(researchDataJson),
          sources: toRequiredPrismaJson(sourcesJson),
          researchError: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Research failed';
      await prisma.companyResearch.update({
        where: { id: companyResearchId },
        data: {
          researchStatus: 'ERROR',
          researchError: message,
        },
      });
    }
  }

  async listResearchReports(
    userId: string,
    projectId: string,
    query: ResearchReportListQueryDtoType
  ): Promise<PaginatedResearchReports> {
    await assertProjectAccess(userId, projectId);

    const where: Prisma.ResearchReportWhereInput = {
      projectId,
      isDeleted: false,
      ...(query.companyResearchId ? { companyResearchId: query.companyResearchId } : {}),
      ...(query.q
        ? {
            OR: [
              { formalCompanyName: { contains: query.q, mode: 'insensitive' } },
              { industry: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const orderBy: Prisma.ResearchReportOrderByWithRelationInput = (() => {
      const dir = query.sortOrder;
      switch (query.sortBy) {
        case 'createdAt':
          return { createdAt: dir };
        case 'formalCompanyName':
          return { formalCompanyName: dir };
        case 'updatedAt':
        default:
          return { updatedAt: dir };
      }
    })();

    const [totalCount, rows] = await prisma.$transaction([
      prisma.researchReport.count({ where }),
      prisma.researchReport.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        select: {
          id: true,
          projectId: true,
          companyResearchId: true,
          formalCompanyName: true,
          industry: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize);

    return {
      items: rows.map((r) => this.mapReportListItem(r)),
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages,
    };
  }

  async createResearchReportFromResearch(
    userId: string,
    projectId: string,
    dto: CreateResearchReportDtoType
  ): Promise<ResearchReportResponse> {
    await assertProjectAccess(userId, projectId);

    const cr = await prisma.companyResearch.findFirst({
      where: { id: dto.companyResearchId, projectId, isDeleted: false },
      include: { company: true },
    });

    if (!cr) {
      throw Object.assign(new Error('Company research not found'), { statusCode: 404 });
    }

    if (cr.researchStatus !== 'COMPLETED') {
      throw Object.assign(new Error('Company research must be COMPLETED before generating a report'), {
        statusCode: 400,
      });
    }

    const mapped = mapResearchJsonToReportPayload(cr.researchData);

    const reportSourcesJson =
      cr.sources !== null && cr.sources !== undefined
        ? jsonValueSchema.parse(JSON.parse(JSON.stringify(cr.sources)))
        : null;

    const report = await prisma.$transaction(async (tx) => {
      const createPayload: Prisma.ResearchReportUncheckedCreateInput = {
        projectId,
        createdBy: userId,
        companyId: cr.companyId,
        companyResearchId: cr.id,
        formalCompanyName: mapped.formalCompanyName,
        industry: mapped.industry,
        headquarters: mapped.headquarters,
        strategicSummary: mapped.strategicSummary,
        growthSignals: mapped.growthSignals,
        hiringSignals: mapped.hiringSignals,
        securityRiskSignals: mapped.securityRiskSignals,
        leadershipSignals: mapped.leadershipSignals,
        keyHeadwinds: mapped.keyHeadwinds,
        interpretation: mapped.interpretation,
      };

      if (reportSourcesJson !== null) {
        createPayload.researchSources = toRequiredPrismaJson(reportSourcesJson);
      } else {
        createPayload.researchSources = Prisma.JsonNull;
      }

      const created = await tx.researchReport.create({
        data: createPayload,
        select: {
          id: true,
          projectId: true,
          createdBy: true,
          companyId: true,
          companyResearchId: true,
          formalCompanyName: true,
          industry: true,
          headquarters: true,
          strategicSummary: true,
          strategicVelocity: true,
          growthSignals: true,
          hiringSignals: true,
          securityRiskSignals: true,
          leadershipSignals: true,
          keyHeadwinds: true,
          interpretation: true,
          researchSources: true,
          activeStrategy: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (cr.researchData && isRecord(cr.researchData)) {
        const nested = cr.researchData['data'];
        const dataLayer =
          nested !== undefined && isRecord(nested) ? nested : cr.researchData;

        const primary = mapFoundation('PRIMARY', dataLayer['primaryFoundation']);
        const supporting = mapFoundation('SUPPORTING', dataLayer['supportingFoundation']);
        const contrarian = mapFoundation('CONTRARIAN', dataLayer['contrarianFoundation']);

        const foundations = [primary, supporting, contrarian].filter(Boolean) as NonNullable<
          ReturnType<typeof mapFoundation>
        >[];

        for (const f of foundations) {
          await tx.foundationStrategy.create({
            data: {
              reportId: created.id,
              angle: f.angle,
              strategicTrigger: f.strategicTrigger,
              whyThisMatters: f.whyThisMatters,
              assetsCreated: f.assetsCreated,
              stakeholder: f.stakeholder,
              targetRole: f.targetRole,
              strategicPosture: f.strategicPosture,
              messagingDirection: f.messagingDirection,
              confidence: f.confidence,
              confidenceReason: f.confidenceReason,
            },
          });
        }
      }

      return created;
    });

    const full = await this.getResearchReport(userId, projectId, report.id);
    if (!full) {
      throw Object.assign(new Error('Failed to load created report'), { statusCode: 500 });
    }
    return full;
  }

  async getResearchReport(
    userId: string,
    projectId: string,
    reportId: string
  ): Promise<ResearchReportResponse | null> {
    await assertProjectAccess(userId, projectId);

    const row = await prisma.researchReport.findFirst({
      where: { id: reportId, projectId, isDeleted: false },
      include: {
        foundationStrategies: {
          orderBy: { angle: 'asc' },
        },
      },
    });

    if (!row) {
      return null;
    }

    const foundations = row.foundationStrategies.map((f) => this.mapFoundationItem(f));

    return {
      id: row.id,
      projectId: row.projectId,
      companyResearchId: row.companyResearchId,
      formalCompanyName: row.formalCompanyName,
      industry: row.industry,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      createdBy: row.createdBy,
      companyId: row.companyId,
      headquarters: row.headquarters,
      strategicSummary: row.strategicSummary,
      strategicVelocity: row.strategicVelocity,
      growthSignals: row.growthSignals,
      hiringSignals: row.hiringSignals,
      securityRiskSignals: row.securityRiskSignals,
      leadershipSignals: row.leadershipSignals,
      keyHeadwinds: row.keyHeadwinds,
      interpretation: row.interpretation,
      researchSources: row.researchSources,
      activeStrategy: row.activeStrategy,
      metadata: row.metadata,
      foundationStrategies: foundations,
    };
  }

  async updateResearchReport(
    userId: string,
    projectId: string,
    reportId: string,
    dto: UpdateResearchReportDtoType
  ): Promise<ResearchReportResponse | null> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.researchReport.findFirst({
      where: { id: reportId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const data: Prisma.ResearchReportUpdateInput = {};

    if (dto.formalCompanyName !== undefined) {
      data.formalCompanyName = dto.formalCompanyName;
    }
    if (dto.industry !== undefined) {
      data.industry = dto.industry;
    }
    if (dto.headquarters !== undefined) {
      data.headquarters = dto.headquarters;
    }
    if (dto.strategicSummary !== undefined) {
      data.strategicSummary = dto.strategicSummary;
    }
    if (dto.strategicVelocity !== undefined) {
      data.strategicVelocity = dto.strategicVelocity;
    }
    if (dto.growthSignals !== undefined) {
      data.growthSignals = dto.growthSignals;
    }
    if (dto.hiringSignals !== undefined) {
      data.hiringSignals = dto.hiringSignals;
    }
    if (dto.securityRiskSignals !== undefined) {
      data.securityRiskSignals = dto.securityRiskSignals;
    }
    if (dto.leadershipSignals !== undefined) {
      data.leadershipSignals = dto.leadershipSignals;
    }
    if (dto.keyHeadwinds !== undefined) {
      data.keyHeadwinds = dto.keyHeadwinds;
    }
    if (dto.interpretation !== undefined) {
      data.interpretation = dto.interpretation;
    }
    if (dto.researchSources !== undefined) {
      data.researchSources = toNullablePrismaJson(dto.researchSources);
    }
    if (dto.activeStrategy !== undefined) {
      data.activeStrategy = dto.activeStrategy;
    }
    if (dto.metadata !== undefined) {
      data.metadata = toNullablePrismaJson(dto.metadata);
    }

    await prisma.researchReport.update({
      where: { id: reportId },
      data,
    });

    return this.getResearchReport(userId, projectId, reportId);
  }

  async softDeleteResearchReport(userId: string, projectId: string, reportId: string): Promise<boolean> {
    await assertProjectAccess(userId, projectId);

    const existing = await prisma.researchReport.findFirst({
      where: { id: reportId, projectId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }

    await prisma.researchReport.update({
      where: { id: reportId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return true;
  }
}
