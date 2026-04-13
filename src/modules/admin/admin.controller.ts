// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';

// Modules
import { AdminService } from './admin.service.js';

// DTO
import {
  CreateAdminProjectDto,
  CreateAdminUserDto,
  ListAdminProjectCompaniesQueryDto,
  ListAdminProjectCompanyResearchQueryDto,
  ListAdminProjectNestedResearchReportsQueryDto,
  ListAdminProjectsQueryDto,
  ListAdminResearchReportsQueryDto,
  ListProjectOptionsQueryDto,
  ListUserOptionsQueryDto,
  ListUsersQueryDto,
  UpdateAdminProjectDto,
  UpdateAdminUserDto,
  UpdateAdminUserVerificationDto,
} from './dto/admin.dto.js';

// Utils
import { sendBadRequest, sendCreated, sendNotFound, sendSuccess } from '../../utils/helpers/response.js';
import { validateRequest } from '../../utils/helpers/validate.js';

// Types
import type {
  AdminProjectDetail,
  AdminResearchReportDetail,
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
// CLASS DEFINITIONS
// ============================================================================

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  overview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.adminService.getOverviewStats();
      sendSuccess(res, 'Overview retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  };

  listUserOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(ListUserOptionsQueryDto, req, res, 'query');
      if (!dtoResult.success) {
        return;
      }

      const result: PaginatedAdminUserOptions = await this.adminService.listUserOptions(dtoResult.data);
      sendSuccess(res, 'User options retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(ListUsersQueryDto, req, res, 'query');
      if (!dtoResult.success) {
        return;
      }

      const result: PaginatedAdminUsers = await this.adminService.listUsersPaginated(dtoResult.data);
      sendSuccess(res, 'Users retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(CreateAdminUserDto, req, res, 'body');
      if (!dtoResult.success) {
        return;
      }

      const user = await this.adminService.createUser(dtoResult.data);
      sendCreated(res, 'User created successfully', { user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route   PATCH /api/admin/users/:userId/verification
   * @desc    Validates verification status (approved or rejected only), ensures the target user exists
   *          and is not soft-deleted, then updates from pending when allowed. Returns the updated admin user summary.
   * @access  Admin
   */
  updateUserVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userIdParam = req.params['userId'];
      const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
      if (!userId) {
        sendBadRequest(res, 'User id is required');
        return;
      }

      if (!req.user) {
        sendBadRequest(res, 'Not authenticated');
        return;
      }

      const dtoResult = await validateRequest(UpdateAdminUserVerificationDto, req, res, 'body');
      if (!dtoResult.success) {
        return;
      }

      const updatedUser: AdminUserSummary | null = await this.adminService.updateUserVerificationStatus(userId, dtoResult.data);

      if (!updatedUser) {
        sendNotFound(res, 'User not found');
        return;
      }

      sendSuccess(res, 'User verification status updated successfully', { user: updatedUser });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userIdParam = req.params['userId'];
      const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
      if (!userId) {
        sendBadRequest(res, 'User id is required');
        return;
      }

      if (!req.user) {
        sendBadRequest(res, 'Not authenticated');
        return;
      }

      const dtoResult = await validateRequest(UpdateAdminUserDto, req, res, 'body');
      if (!dtoResult.success) {
        return;
      }

      const updatedUser = await this.adminService.updateUser(userId, dtoResult.data);

      if (!updatedUser) {
        sendNotFound(res, 'User not found');
        return;
      }

      sendSuccess(res, 'User updated successfully', { user: updatedUser });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userIdParam = req.params['userId'];
      const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
      if (!userId) {
        sendBadRequest(res, 'User id is required');
        return;
      }

      if (!req.user) {
        sendBadRequest(res, 'Not authenticated');
        return;
      }

      const deleted = await this.adminService.deleteUser(userId, req.user.id);
      if (!deleted) {
        sendNotFound(res, 'User not found');
        return;
      }

      sendSuccess(res, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  listProjectOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(ListProjectOptionsQueryDto, req, res, 'query');
      if (!dtoResult.success) {
        return;
      }

      const result: PaginatedAdminProjectOptions = await this.adminService.listProjectOptionsPaginated(dtoResult.data);
      sendSuccess(res, 'Project options retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  listProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(ListAdminProjectsQueryDto, req, res, 'query');
      if (!dtoResult.success) {
        return;
      }

      const result: PaginatedAdminProjects = await this.adminService.listProjectsPaginated(dtoResult.data);
      sendSuccess(res, 'Projects retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(CreateAdminProjectDto, req, res, 'body');
      if (!dtoResult.success) {
        return;
      }

      const project = await this.adminService.createProject(dtoResult.data);
      sendCreated(res, 'Project created successfully', { project });
    } catch (error) {
      next(error);
    }
  };

  updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectIdParam = req.params['projectId'];
      const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam;
      if (!projectId) {
        sendBadRequest(res, 'Project id is required');
        return;
      }

      const dtoResult = await validateRequest(UpdateAdminProjectDto, req, res, 'body');
      if (!dtoResult.success) {
        return;
      }

      const updated = await this.adminService.updateProject(projectId, dtoResult.data);
      if (!updated) {
        sendNotFound(res, 'Project not found');
        return;
      }

      sendSuccess(res, 'Project updated successfully', { project: updated });
    } catch (error) {
      next(error);
    }
  };

  deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectIdParam = req.params['projectId'];
      const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam;
      if (!projectId) {
        sendBadRequest(res, 'Project id is required');
        return;
      }

      const deleted = await this.adminService.deleteProject(projectId);
      if (!deleted) {
        sendNotFound(res, 'Project not found');
        return;
      }

      sendSuccess(res, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectIdParam = req.params['projectId'];
      const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam;
      if (!projectId) {
        sendBadRequest(res, 'Project id is required');
        return;
      }

      const project: AdminProjectDetail | null = await this.adminService.getProjectById(projectId);
      if (!project) {
        sendNotFound(res, 'Project not found');
        return;
      }

      sendSuccess(res, 'Project retrieved successfully', { project });
    } catch (error) {
      next(error);
    }
  };

  listProjectCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectIdParam = req.params['projectId'];
      const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam;
      if (!projectId) {
        sendBadRequest(res, 'Project id is required');
        return;
      }

      const dtoResult = await validateRequest(ListAdminProjectCompaniesQueryDto, req, res, 'query');
      if (!dtoResult.success) {
        return;
      }

      const result: PaginatedAdminProjectCompanies | null = await this.adminService.listProjectCompaniesPaginated(
        projectId,
        dtoResult.data,
      );

      if (result === null) {
        sendNotFound(res, 'Project not found');
        return;
      }

      sendSuccess(res, 'Companies retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  listProjectCompanyResearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectIdParam = req.params['projectId'];
      const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam;
      if (!projectId) {
        sendBadRequest(res, 'Project id is required');
        return;
      }

      const dtoResult = await validateRequest(ListAdminProjectCompanyResearchQueryDto, req, res, 'query');
      if (!dtoResult.success) {
        return;
      }

      const result: PaginatedAdminProjectCompanyResearch | null =
        await this.adminService.listProjectCompanyResearchPaginated(projectId, dtoResult.data);

      if (result === null) {
        sendNotFound(res, 'Project not found');
        return;
      }

      sendSuccess(res, 'Company research retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  listProjectNestedResearchReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectIdParam = req.params['projectId'];
      const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam;
      if (!projectId) {
        sendBadRequest(res, 'Project id is required');
        return;
      }

      const dtoResult = await validateRequest(ListAdminProjectNestedResearchReportsQueryDto, req, res, 'query');
      if (!dtoResult.success) {
        return;
      }

      const result: PaginatedAdminNestedResearchReports | null =
        await this.adminService.listProjectNestedResearchReportsPaginated(projectId, dtoResult.data);

      if (result === null) {
        sendNotFound(res, 'Project not found');
        return;
      }

      sendSuccess(res, 'Research reports retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  listResearchReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = await validateRequest(ListAdminResearchReportsQueryDto, req, res, 'query');
      if (!dtoResult.success) {
        return;
      }

      const result: PaginatedAdminResearchReports = await this.adminService.listResearchReportsPaginated(dtoResult.data);
      sendSuccess(res, 'Research reports retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getResearchReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reportIdParam = req.params['reportId'];
      const reportId = Array.isArray(reportIdParam) ? reportIdParam[0] : reportIdParam;
      if (!reportId) {
        sendBadRequest(res, 'Report id is required');
        return;
      }

      const report: AdminResearchReportDetail | null = await this.adminService.getResearchReportById(reportId);
      if (!report) {
        sendNotFound(res, 'Research report not found');
        return;
      }

      sendSuccess(res, 'Research report retrieved successfully', { report });
    } catch (error) {
      next(error);
    }
  };

  deleteResearchReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reportIdParam = req.params['reportId'];
      const reportId = Array.isArray(reportIdParam) ? reportIdParam[0] : reportIdParam;
      if (!reportId) {
        sendBadRequest(res, 'Report id is required');
        return;
      }

      const deleted = await this.adminService.deleteResearchReport(reportId);
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

export const adminController = new AdminController();
