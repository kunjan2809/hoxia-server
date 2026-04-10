// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { Router } from 'express';

// Controllers
import { projectController } from './project.controller.js';

// Middleware
import { authenticate } from '../../middleware/auth.js';

// Constants
import { ROUTES } from '../../utils/constants/routes.js';

// ============================================================================
// ROUTER
// ============================================================================

const router = Router();

// ============================================================================
// Project routes (user-scoped; soft delete)
// ============================================================================

/**
 * @route   GET /api/projects
 * @desc    Paginated list of projects for the current user. Supports q (name substring), status filter,
 *          sortBy (createdAt | updatedAt | name | status), sortOrder (asc | desc), page, pageSize (5–100).
 * @access  Protected
 */
router.get(
    ROUTES.PROJECTS.LIST,
    authenticate,
    projectController.listProjects
);

/**
 * @route   POST /api/projects
 * @desc    Creates a project with name, optional status (defaults to DRAFT), defaultHeaders (JSON object),
 *          optional campaignContext and metadata. JSON fields are validated recursively on the server.
 * @access  Protected
 */
router.post(
    ROUTES.PROJECTS.LIST,
    authenticate,
    projectController.createProject
);

/**
 * @route   GET /api/projects/:projectId
 * @desc    Returns a single project including defaultHeaders, campaignContext, and metadata when the
 *          project belongs to the caller and is not soft-deleted.
 * @access  Protected
 */
router.get(
    ROUTES.PROJECTS.DETAIL,
    authenticate,
    projectController.getProject
);

/**
 * @route   PATCH /api/projects/:projectId
 * @desc    Partial update: at least one of name, status, defaultHeaders, campaignContext, metadata.
 *          Use this to rename a project, change status, or adjust campaign JSON blobs.
 * @access  Protected
 */
router.patch(
    ROUTES.PROJECTS.DETAIL,
    authenticate,
    projectController.updateProject
);

/**
 * @route   DELETE /api/projects/:projectId
 * @desc    Soft-deletes the project (isDeleted + deletedAt). Related child rows remain governed by
 *          Prisma cascades where defined; callers should not see deleted projects in list/detail.
 * @access  Protected
 */
router.delete(
    ROUTES.PROJECTS.DETAIL,
    authenticate,
    projectController.deleteProject
);

export default router;
