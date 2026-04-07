// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import type { NextFunction, Request, Response } from 'express';

// DTO
import {
  ActivationAssetIdParamDto,
  ActivationAssetListQueryDto,
  CreateActivationAssetDto,
  CreateStrategyDto,
  CreateStrategyStepDto,
  ProjectScopedParamsDto,
  StrategyIdParamDto,
  StrategyListQueryDto,
  StrategyStepIdParamDto,
  StrategyStepListQueryDto,
  UpdateActivationAssetDto,
  UpdateStrategyDto,
  UpdateStrategyStepDto,
} from './dto/strategy.dto.js';

// Service
import { StrategyService } from './strategy.service.js';

// Utils
import { createLogger } from '../../utils/helpers/logger.js';
import { sendBadRequest, sendCreated, sendNotFound, sendSuccess, sendUnauthorized } from '../../utils/helpers/response.js';
import { validateRequest } from '../../utils/helpers/validate.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const logger = createLogger('StrategyController');

// ============================================================================
// CONTROLLER
// ============================================================================

export class StrategyController {
  private strategyService: StrategyService;

  constructor() {
    this.strategyService = new StrategyService();
  }

  listStrategies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const queryResult = await validateRequest(StrategyListQueryDto, req, res, 'query');
      if (!queryResult.success) {
        return;
      }

      const result = await this.strategyService.listStrategies(
        req.user.id,
        paramsResult.data.projectId,
        queryResult.data
      );
      sendSuccess(res, 'Strategies retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  createStrategy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(CreateStrategyDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      if (bodyResult.data.upsert === true) {
        sendBadRequest(res, 'Upsert is not supported in MVP');
        return;
      }

      const result = await this.strategyService.createStrategy(
        req.user.id,
        paramsResult.data.projectId,
        bodyResult.data
      );
      sendCreated(res, 'Strategy created successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getStrategy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(StrategyIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const result = await this.strategyService.getStrategy(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.strategyId
      );
      if (!result) {
        sendNotFound(res, 'Strategy not found');
        return;
      }
      sendSuccess(res, 'Strategy retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  updateStrategy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(StrategyIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(UpdateStrategyDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.strategyService.updateStrategy(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.strategyId,
        bodyResult.data
      );
      if (!result) {
        sendNotFound(res, 'Strategy not found');
        return;
      }
      sendSuccess(res, 'Strategy updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  deleteStrategy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(StrategyIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const deleted = await this.strategyService.softDeleteStrategy(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.strategyId
      );
      if (!deleted) {
        sendNotFound(res, 'Strategy not found');
        return;
      }
      logger.info(`Strategy soft-deleted: ${paramsResult.data.strategyId}`);
      sendSuccess(res, 'Strategy deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  listStrategySteps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(StrategyIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const queryResult = await validateRequest(StrategyStepListQueryDto, req, res, 'query');
      if (!queryResult.success) {
        return;
      }

      const result = await this.strategyService.listStrategySteps(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.strategyId,
        queryResult.data
      );
      sendSuccess(res, 'Strategy steps retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  createStrategyStep = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(StrategyIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(CreateStrategyStepDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.strategyService.createStrategyStep(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.strategyId,
        bodyResult.data
      );
      sendCreated(res, 'Strategy step created successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getStrategyStep = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(StrategyStepIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const result = await this.strategyService.getStrategyStep(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.strategyId,
        paramsResult.data.stepId
      );
      if (!result) {
        sendNotFound(res, 'Strategy step not found');
        return;
      }
      sendSuccess(res, 'Strategy step retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  updateStrategyStep = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(StrategyStepIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(UpdateStrategyStepDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.strategyService.updateStrategyStep(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.strategyId,
        paramsResult.data.stepId,
        bodyResult.data
      );
      if (!result) {
        sendNotFound(res, 'Strategy step not found');
        return;
      }
      sendSuccess(res, 'Strategy step updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  deleteStrategyStep = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(StrategyStepIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const deleted = await this.strategyService.softDeleteStrategyStep(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.strategyId,
        paramsResult.data.stepId
      );
      if (!deleted) {
        sendNotFound(res, 'Strategy step not found');
        return;
      }
      sendSuccess(res, 'Strategy step deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  listActivationAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const queryResult = await validateRequest(ActivationAssetListQueryDto, req, res, 'query');
      if (!queryResult.success) {
        return;
      }

      const result = await this.strategyService.listActivationAssets(
        req.user.id,
        paramsResult.data.projectId,
        queryResult.data
      );
      sendSuccess(res, 'Activation assets retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  createActivationAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ProjectScopedParamsDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(CreateActivationAssetDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.strategyService.createActivationAsset(
        req.user.id,
        paramsResult.data.projectId,
        bodyResult.data
      );
      sendCreated(res, 'Activation asset created successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getActivationAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ActivationAssetIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const result = await this.strategyService.getActivationAsset(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.activationAssetId
      );
      if (!result) {
        sendNotFound(res, 'Activation asset not found');
        return;
      }
      sendSuccess(res, 'Activation asset retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  updateActivationAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ActivationAssetIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const bodyResult = await validateRequest(UpdateActivationAssetDto, req, res, 'body');
      if (!bodyResult.success) {
        return;
      }

      const result = await this.strategyService.updateActivationAsset(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.activationAssetId,
        bodyResult.data
      );
      if (!result) {
        sendNotFound(res, 'Activation asset not found');
        return;
      }
      sendSuccess(res, 'Activation asset updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  deleteActivationAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const paramsResult = await validateRequest(ActivationAssetIdParamDto, req, res, 'params');
      if (!paramsResult.success) {
        return;
      }

      const deleted = await this.strategyService.softDeleteActivationAsset(
        req.user.id,
        paramsResult.data.projectId,
        paramsResult.data.activationAssetId
      );
      if (!deleted) {
        sendNotFound(res, 'Activation asset not found');
        return;
      }
      sendSuccess(res, 'Activation asset deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const strategyController = new StrategyController();
