// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';

// DTO
import {
  BulkCompaniesBodyDto,
  CompanyIdParamDto,
  CompanyListIdParamDto,
  CompanyListListQueryDto,
  CompanyListQueryDto,
  CreateCompanyDto,
  CreateCompanyListDto,
  ProjectScopedParamsDto,
  UpdateCompanyDto,
  UpdateCompanyListDto,
} from './dto/company.dto.js';
import { SaveCampaignContextFormDto } from './dto/saveCampaignContext.dto.js';

// Service
import { CompanyService } from './company.service.js';

// Utils
import { createLogger } from '../../utils/helpers/logger.js';
import { sendCreated, sendNotFound, sendSuccess, sendUnauthorized } from '../../utils/helpers/response.js';
import { validateRequest } from '../../utils/helpers/validate.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('CompanyController');

// ============================================================================
// CONTROLLER
// ============================================================================

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  listCompanyLists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const queryResult = await validateRequest(CompanyListListQueryDto, req, res, 'query');
      if (!queryResult.success) {
        return;
      }

      const result = await this.companyService.listCompanyLists(
        req.user.id,
        paramsResult.data.projectId,
        queryResult.data
      );
      sendSuccess(res, 'Company lists retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  createCompanyList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(CreateCompanyListDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.companyService.createCompanyList(
        req.user.id,
        paramsResult.data.projectId,
        bodyResult.data
      );
      sendCreated(res, 'Company list created successfully', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Multipart: optional file field `toneOfVoice` (PDF, Word, text). Text fields match SaveCampaignContextFormDto.
   * Creates a company list with canonical campaignContext JSON and stores the file under LOCAL_UPLOAD_ROOT.
   */
  saveCampaignContext = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(SaveCampaignContextFormDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const file = req.file;
      const result = await this.companyService.createCompanyListSaveCampaignContext(
        req.user.id,
        paramsResult.data.projectId,
        bodyResult.data,
        file
      );
      sendCreated(res, 'Campaign context saved', result);
    } catch (error) {
      next(error);
    }
  };

  downloadToneOfVoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyListIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const resolved = await this.companyService.resolveToneOfVoiceDownload(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyListId
      );
      if (!resolved) {
        sendNotFound(res, 'Tone of voice file not found');
        return;
      }

      res.setHeader('Content-Type', resolved.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${resolved.downloadName.replace(/"/g, '')}"`);

      resolved.stream.on('error', () => {
        if (!res.headersSent) {
          sendNotFound(res, 'File no longer available');
        }
      });

      resolved.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  bulkCreateCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyListIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(BulkCompaniesBodyDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.companyService.bulkCreateCompaniesForList(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyListId,
        bodyResult.data
      );
      sendCreated(res, 'Companies imported successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getCompanyList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyListIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const result = await this.companyService.getCompanyList(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyListId
      );
      if (!result) {
        sendNotFound(res, 'Company list not found');
        return;
      }
      sendSuccess(res, 'Company list retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  updateCompanyList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyListIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(UpdateCompanyListDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.companyService.updateCompanyList(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyListId,
        bodyResult.data
      );
      if (!result) {
        sendNotFound(res, 'Company list not found');
        return;
      }
      sendSuccess(res, 'Company list updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  deleteCompanyList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyListIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const deleted = await this.companyService.softDeleteCompanyList(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyListId
      );
      if (!deleted) {
        sendNotFound(res, 'Company list not found');
        return;
      }
      logger.info(`Company list soft-deleted: ${paramsResult.data.companyListId}`);
      sendSuccess(res, 'Company list deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  listCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const queryResult = await validateRequest(CompanyListQueryDto, req, res, 'query');
      if (!queryResult.success) {
        return;
      }

      const result = await this.companyService.listCompanies(
        req.user.id,
        paramsResult.data.projectId,
        queryResult.data
      );
      sendSuccess(res, 'Companies retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  createCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(CreateCompanyDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.companyService.createCompany(
        req.user.id,
        paramsResult.data.projectId,
        bodyResult.data
      );
      sendCreated(res, 'Company created successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const result = await this.companyService.getCompany(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyId
      );
      if (!result) {
        sendNotFound(res, 'Company not found');
        return;
      }
      sendSuccess(res, 'Company retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  updateCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(UpdateCompanyDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.companyService.updateCompany(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyId,
        bodyResult.data
      );
      if (!result) {
        sendNotFound(res, 'Company not found');
        return;
      }
      sendSuccess(res, 'Company updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  deleteCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(CompanyIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const deleted = await this.companyService.softDeleteCompany(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.companyId
      );
      if (!deleted) {
        sendNotFound(res, 'Company not found');
        return;
      }
      sendSuccess(res, 'Company deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const companyController = new CompanyController();
