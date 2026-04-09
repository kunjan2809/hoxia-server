// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';

// DTO
import {
  CompanyResearchIdParamDto,
  CompanyResearchListQueryDto,
  CreateCompanyResearchDto,
  CreateResearchReportDto,
  ProjectScopedParamsDto,
  ResearchReportIdParamDto,
  ResearchReportListQueryDto,
  UpdateCompanyResearchDto,
  UpdateResearchReportDto,
} from './dto/research.dto.js';

// Service
import { ResearchService } from './research.service.js';

// Utils
import { createLogger } from '../../utils/helpers/logger.js';
import { sendCreated, sendNotFound, sendSuccess, sendUnauthorized } from '../../utils/helpers/response.js';
import { validateRequest } from '../../utils/helpers/validate.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('ResearchController');

// ============================================================================
// CONTROLLER
// ============================================================================

export class ResearchController {
  private researchService: ResearchService;

  constructor() {
    this.researchService = new ResearchService();
  }

  listCompanyResearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const queryResult = await validateRequest(CompanyResearchListQueryDto, req, res, 'query');
      if (!queryResult.success) {
        return;
      }

      const result = await this.researchService.listCompanyResearch(
        req.user.id,
        paramsResult.data.projectId,
        queryResult.data
      );
      sendSuccess(res, 'Company research rows retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  createCompanyResearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(CreateCompanyResearchDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.researchService.createCompanyResearch(
        req.user.id,
        paramsResult.data.projectId,
        bodyResult.data
      );
      sendCreated(res, 'Company research created successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getCompanyResearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyResearchIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const result = await this.researchService.getCompanyResearch(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyResearchId
      );
      if (!result) {
        sendNotFound(res, 'Company research not found');
        return;
      }
      sendSuccess(res, 'Company research retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  updateCompanyResearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyResearchIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(UpdateCompanyResearchDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.researchService.updateCompanyResearch(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyResearchId,
        bodyResult.data
      );
      if (!result) {
        sendNotFound(res, 'Company research not found');
        return;
      }
      sendSuccess(res, 'Company research updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  deleteCompanyResearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyResearchIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const deleted = await this.researchService.softDeleteCompanyResearch(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyResearchId
      );
      if (!deleted) {
        sendNotFound(res, 'Company research not found');
        return;
      }
      logger.info(`Company research soft-deleted: ${paramsResult.data.companyResearchId}`);
      sendSuccess(res, 'Company research deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  runCompanyResearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyResearchIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const result = await this.researchService.startCompanyResearchRun(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyResearchId
      );
      sendSuccess(res, 'Research run finished', result);
    } catch (error) {
      next(error);
    }
  };

  listResearchReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const queryResult = await validateRequest(ResearchReportListQueryDto, req, res, 'query');
      if (!queryResult.success) {
        return;
      }

      const result = await this.researchService.listResearchReports(
        req.user.id,
        paramsResult.data.projectId,
        queryResult.data
      );
      sendSuccess(res, 'Research reports retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  createResearchReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(CreateResearchReportDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.researchService.createResearchReportFromResearch(
        req.user.id,
        paramsResult.data.projectId,
        bodyResult.data
      );
      sendCreated(res, 'Research report created successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getResearchReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ResearchReportIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const result = await this.researchService.getResearchReport(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.reportId
      );
      if (!result) {
        sendNotFound(res, 'Research report not found');
        return;
      }
      sendSuccess(res, 'Research report retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  updateResearchReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ResearchReportIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(UpdateResearchReportDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.researchService.updateResearchReport(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.reportId,
        bodyResult.data
      );
      if (!result) {
        sendNotFound(res, 'Research report not found');
        return;
      }
      sendSuccess(res, 'Research report updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  deleteResearchReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ResearchReportIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const deleted = await this.researchService.softDeleteResearchReport(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.reportId
      );
      if (!deleted) {
        sendNotFound(res, 'Research report not found');
        return;
      }
      sendSuccess(res, 'Research report deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const researchController = new ResearchController();
