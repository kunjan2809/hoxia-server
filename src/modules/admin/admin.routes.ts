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

router.get(ROUTES.ADMIN.USERS.LIST, authenticate, requireRole(['ADMIN']), adminController.listUsers);

router.post(ROUTES.ADMIN.USERS.LIST, authenticate, requireRole(['ADMIN']), adminController.createUser);

router.patch(ROUTES.ADMIN.USERS.DETAIL, authenticate, requireRole(['ADMIN']), adminController.updateUser);

router.delete(ROUTES.ADMIN.USERS.DETAIL, authenticate, requireRole(['ADMIN']), adminController.deleteUser);

export default router;
