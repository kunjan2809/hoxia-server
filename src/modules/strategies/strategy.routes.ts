// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { Router } from 'express';

// Controllers
import { strategyController } from './strategy.controller.js';

// Middleware
import { authenticate } from '../../middleware/auth.js';

// Constants
import { ROUTES } from '../../utils/constants/routes.js';

// ============================================================================
// ROUTER
// ============================================================================

const router = Router({ mergeParams: true });

const SCOPE = ROUTES.PROJECTS.SCOPE;

// ============================================================================
// Strategy steps (register longer paths before /strategies/:strategyId)
// ============================================================================

/**
 * @route   GET /api/projects/:projectId/strategies/:strategyId/steps/:stepId
 * @desc    Single step with preview text and optional activation asset link.
 * @access  Protected
 */
router.get(
    SCOPE.STRATEGY_STEP_DETAIL,
    authenticate,
    strategyController.getStrategyStep
);

/**
 * @route   PATCH /api/projects/:projectId/strategies/:strategyId/steps/:stepId
 * @desc    Partial update of step fields, optional FK links, or activation asset id.
 * @access  Protected
 */
router.patch(
    SCOPE.STRATEGY_STEP_DETAIL,
    authenticate,
    strategyController.updateStrategyStep
);

/**
 * @route   DELETE /api/projects/:projectId/strategies/:strategyId/steps/:stepId
 * @desc    Soft-deletes the campaign step.
 * @access  Protected
 */
router.delete(
    SCOPE.STRATEGY_STEP_DETAIL,
    authenticate,
    strategyController.deleteStrategyStep
);

/**
 * @route   GET /api/projects/:projectId/strategies/:strategyId/steps
 * @desc    Paginated ordered steps for a strategy (sort by stepOrder by default).
 * @access  Protected
 */
router.get(
    SCOPE.STRATEGY_STEPS,
    authenticate,
    strategyController.listStrategySteps
);

/**
 * @route   POST /api/projects/:projectId/strategies/:strategyId/steps
 * @desc    Adds a step to the sequence; activationAssetId optional for later linkage.
 * @access  Protected
 */
router.post(
    SCOPE.STRATEGY_STEPS,
    authenticate,
    strategyController.createStrategyStep
);

// ============================================================================
// Strategies
// ============================================================================

/**
 * @route   GET /api/projects/:projectId/strategies/:strategyId
 * @desc    Returns a saved strategy including tone, cadence, persona, and FK links to research/report.
 * @access  Protected
 */
router.get(
    SCOPE.STRATEGY_DETAIL,
    authenticate,
    strategyController.getStrategy
);

/**
 * @route   PATCH /api/projects/:projectId/strategies/:strategyId
 * @desc    Partial update; unique constraint on (projectId, companyId, angle, objective, outputType) may return 409.
 * @access  Protected
 */
router.patch(
    SCOPE.STRATEGY_DETAIL,
    authenticate,
    strategyController.updateStrategy
);

/**
 * @route   DELETE /api/projects/:projectId/strategies/:strategyId
 * @desc    Soft-deletes the strategy (steps cascade per schema).
 * @access  Protected
 */
router.delete(
    SCOPE.STRATEGY_DETAIL,
    authenticate,
    strategyController.deleteStrategy
);

/**
 * @route   GET /api/projects/:projectId/strategies
 * @desc    Paginated strategies; optional filters by companyResearchId or researchReportId.
 * @access  Protected
 */
router.get(
    SCOPE.STRATEGIES,
    authenticate,
    strategyController.listStrategies
);

/**
 * @route   POST /api/projects/:projectId/strategies
 * @desc    Creates a strategy; body may include upsert:false for future use — true is rejected in MVP with 400.
 * @access  Protected
 */
router.post(
    SCOPE.STRATEGIES,
    authenticate,
    strategyController.createStrategy
);

// ============================================================================
// Activation assets
// ============================================================================

/**
 * @route   GET /api/projects/:projectId/activation-assets/:activationAssetId
 * @desc    Full activation asset (copy + metadata) for outreach.
 * @access  Protected
 */
router.get(
    SCOPE.ACTIVATION_ASSET_DETAIL,
    authenticate,
    strategyController.getActivationAsset
);

/**
 * @route   PATCH /api/projects/:projectId/activation-assets/:activationAssetId
 * @desc    Partial update of generated copy and FK links.
 * @access  Protected
 */
router.patch(
    SCOPE.ACTIVATION_ASSET_DETAIL,
    authenticate,
    strategyController.updateActivationAsset
);

/**
 * @route   DELETE /api/projects/:projectId/activation-assets/:activationAssetId
 * @desc    Soft-deletes the asset.
 * @access  Protected
 */
router.delete(
    SCOPE.ACTIVATION_ASSET_DETAIL,
    authenticate,
    strategyController.deleteActivationAsset
);

/**
 * @route   GET /api/projects/:projectId/activation-assets
 * @desc    Paginated activation assets; optional filters by research/report and output type.
 * @access  Protected
 */
router.get(
    SCOPE.ACTIVATION_ASSETS,
    authenticate,
    strategyController.listActivationAssets
);

/**
 * @route   POST /api/projects/:projectId/activation-assets
 * @desc    Creates a stored activation asset (typically after LLM generation or manual entry).
 * @access  Protected
 */
router.post(
    SCOPE.ACTIVATION_ASSETS,
    authenticate,
    strategyController.createActivationAsset
);

export default router;
