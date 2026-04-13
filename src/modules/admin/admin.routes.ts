// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { Router } from 'express';

// Controllers
import { adminController } from './admin.controller.js';

// Middleware
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

// Constants
import { ROUTES } from '../../utils/constants/routes.js';

// ============================================================================
// ROUTER
// ============================================================================

const router = Router();

router.get(ROUTES.ADMIN.OVERVIEW, authenticate, requireRole(['ADMIN']), adminController.overview);

router.get(ROUTES.ADMIN.USERS.OPTIONS, authenticate, requireRole(['ADMIN']), adminController.listUserOptions);

router.get(ROUTES.ADMIN.USERS.LIST, authenticate, requireRole(['ADMIN']), adminController.listUsers);

router.post(ROUTES.ADMIN.USERS.LIST, authenticate, requireRole(['ADMIN']), adminController.createUser);

/**
 * @route   PATCH /api/admin/users/:userId/verification
 * @desc    Sets account verification to approved (success) or rejected (failed) for users that are
 *          currently pending. Used by the admin users table; rejects revoke active refresh sessions.
 * @access  Admin
 */
router.patch(
    ROUTES.ADMIN.USERS.VERIFICATION,
    authenticate,
    requireRole(['ADMIN']),
    adminController.updateUserVerification
);

router.patch(ROUTES.ADMIN.USERS.DETAIL, authenticate, requireRole(['ADMIN']), adminController.updateUser);

router.delete(ROUTES.ADMIN.USERS.DETAIL, authenticate, requireRole(['ADMIN']), adminController.deleteUser);

router.get(ROUTES.ADMIN.PROJECTS.OPTIONS, authenticate, requireRole(['ADMIN']), adminController.listProjectOptions);

router.get(ROUTES.ADMIN.PROJECTS.LIST, authenticate, requireRole(['ADMIN']), adminController.listProjects);

router.post(ROUTES.ADMIN.PROJECTS.LIST, authenticate, requireRole(['ADMIN']), adminController.createProject);

router.get(ROUTES.ADMIN.PROJECTS.COMPANIES, authenticate, requireRole(['ADMIN']), adminController.listProjectCompanies);

router.get(ROUTES.ADMIN.PROJECTS.COMPANY_RESEARCH, authenticate, requireRole(['ADMIN']), adminController.listProjectCompanyResearch);

router.get(ROUTES.ADMIN.PROJECTS.NESTED_RESEARCH_REPORTS, authenticate, requireRole(['ADMIN']), adminController.listProjectNestedResearchReports);

router.get(ROUTES.ADMIN.PROJECTS.DETAIL, authenticate, requireRole(['ADMIN']), adminController.getProject);

router.patch(ROUTES.ADMIN.PROJECTS.DETAIL, authenticate, requireRole(['ADMIN']), adminController.updateProject);

router.delete(ROUTES.ADMIN.PROJECTS.DETAIL, authenticate, requireRole(['ADMIN']), adminController.deleteProject);

router.get(ROUTES.ADMIN.RESEARCH_REPORTS.LIST, authenticate, requireRole(['ADMIN']), adminController.listResearchReports);

router.get(ROUTES.ADMIN.RESEARCH_REPORTS.DETAIL, authenticate, requireRole(['ADMIN']), adminController.getResearchReport);

router.delete(ROUTES.ADMIN.RESEARCH_REPORTS.DETAIL, authenticate, requireRole(['ADMIN']), adminController.deleteResearchReport);

export default router;
