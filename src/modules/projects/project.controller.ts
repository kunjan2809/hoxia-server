// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';

// DTO
import {
  CreateProjectDto,
  ProjectIdParamDto,
  ProjectListQueryDto,
  UpdateProjectDto,
} from './dto/project.dto.js';

// Service
import { ProjectService } from './project.service.js';

// Utils
import { createLogger } from '../../utils/helpers/logger.js';
import { sendCreated, sendNotFound, sendSuccess, sendUnauthorized } from '../../utils/helpers/response.js';
import { validateRequest } from '../../utils/helpers/validate.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('ProjectController');

// ============================================================================
// CONTROLLER
// ============================================================================

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  /**
   * Lists the authenticated user's projects with pagination, optional name search, status filter,
   * and sort (createdAt, updatedAt, name, status). Page size is clamped to the configured 5–100 range.
   */
  listProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const dtoResult = await validateRequest(ProjectListQueryDto, req, res, 'query');
      if (!dtoResult.success) {
        return;
      }

      const result = await this.projectService.listProjects(req.user.id, dtoResult.data);
      sendSuccess(res, 'Projects retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates a project owned by the authenticated user. defaultHeaders defaults to an empty object;
   * status defaults to DRAFT when omitted.
   */
  createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const dtoResult = await validateRequest(CreateProjectDto, req, res, 'body');
      if (!dtoResult.success) {
        return;
      }

      const result = await this.projectService.createProject(req.user.id, dtoResult.data);
      sendCreated(res, 'Project created successfully', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Returns one project by id when it belongs to the authenticated user (soft-deleted projects 404).
   */
  getProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const result = await this.projectService.getProjectById(req.user.id, paramsResult.data.projectId);
      if (!result) {
        sendNotFound(res, 'Project not found');
        return;
      }

      sendSuccess(res, 'Project retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Partially updates a project. At least one of name, status, defaultHeaders, campaignContext, or
   * metadata must be present in the body. Only the owner may update.
   */
  updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(UpdateProjectDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.projectService.updateProject(
        req.user.id,
        paramsResult.data.projectId,
        bodyResult.data
      );

      if (!result) {
        sendNotFound(res, 'Project not found');
        return;
      }

      sendSuccess(res, 'Project updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Soft-deletes a project (sets isDeleted and deletedAt). Only the owner may delete.
   */
  deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const deleted = await this.projectService.softDeleteProject(req.user.id, paramsResult.data.projectId);
      if (!deleted) {
        sendNotFound(res, 'Project not found');
        return;
      }

      logger.info(`Project soft-deleted: ${paramsResult.data.projectId} by user ${req.user.id}`);
      sendSuccess(res, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const projectController = new ProjectController();
