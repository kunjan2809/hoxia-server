// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';

// Modules
import { AdminService } from './admin.service.js';

// DTO
import { CreateAdminUserDto, ListUsersQueryDto, UpdateAdminUserDto } from './dto/admin.dto.js';

// Utils
import { sendBadRequest, sendCreated, sendNotFound, sendSuccess } from '../../utils/helpers/response.js';
import { validateRequest } from '../../utils/helpers/validate.js';

// Types
import type { PaginatedAdminUsers } from './types/admin.types.js';

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
}

export const adminController = new AdminController();
