// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { Router } from 'express';

// Controllers
import { companyController } from './company.controller.js';

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
// Company lists & bulk import (project-scoped)
// ============================================================================

/**
 * @route   GET /api/projects/:projectId/company-lists
 * @desc    Paginated company lists for the project; optional q searches list name; sortBy name|createdAt|updatedAt.
 * @access  Protected
 */
router.get(
    SCOPE.COMPANY_LISTS,
    authenticate,
    companyController.listCompanyLists
);

/**
 * @route   POST /api/projects/:projectId/company-lists
 * @desc    Creates a batch list container (headers JSON, optional campaignContext/metadata). Used when the client
 *          has parsed a CSV and will POST rows to the bulk endpoint or add companies separately.
 * @access  Protected
 */
router.post(
    SCOPE.COMPANY_LISTS,
    authenticate,
    companyController.createCompanyList
);

/**
 * @route   POST /api/projects/:projectId/company-lists/:companyListId/companies/bulk
 * @desc    Creates many BATCH-type company rows under this list in one transaction; updates list rowCount.
 *          Row count is capped by server config (see PAGINATION.BULK_COMPANY_ROWS_MAX).
 * @access  Protected
 */
router.post(
    SCOPE.COMPANIES_BULK,
    authenticate,
    companyController.bulkCreateCompanies
);

/**
 * @route   GET /api/projects/:projectId/company-lists/:companyListId
 * @desc    Full company list record including headers and metadata for editing or display.
 * @access  Protected
 */
router.get(
    SCOPE.COMPANY_LIST_DETAIL,
    authenticate,
    companyController.getCompanyList
);

/**
 * @route   PATCH /api/projects/:projectId/company-lists/:companyListId
 * @desc    Partial update of list name, headers, rowCount, or JSON blobs; at least one field required.
 * @access  Protected
 */
router.patch(
    SCOPE.COMPANY_LIST_DETAIL,
    authenticate,
    companyController.updateCompanyList
);

/**
 * @route   DELETE /api/projects/:projectId/company-lists/:companyListId
 * @desc    Soft-deletes the list; companies in the list may cascade per schema (verify Prisma onDelete).
 * @access  Protected
 */
router.delete(
    SCOPE.COMPANY_LIST_DETAIL,
    authenticate,
    companyController.deleteCompanyList
);

// ============================================================================
// Companies (project-scoped)
// ============================================================================

/**
 * @route   GET /api/projects/:projectId/companies
 * @desc    Paginated companies: optional filter by companyListId, type (INDIVIDUAL|BATCH), q on name/URL,
 *          sortBy companyName|type|createdAt|updatedAt.
 * @access  Protected
 */
router.get(
    SCOPE.COMPANIES,
    authenticate,
    companyController.listCompanies
);

/**
 * @route   POST /api/projects/:projectId/companies
 * @desc    Creates a company row (single-company or batch-linked via companyListId), with typed payload JSON.
 * @access  Protected
 */
router.post(
    SCOPE.COMPANIES,
    authenticate,
    companyController.createCompany
);

/**
 * @route   GET /api/projects/:projectId/companies/:companyId
 * @desc    Single company with payload and metadata for research and UI forms.
 * @access  Protected
 */
router.get(
    SCOPE.COMPANY_DETAIL,
    authenticate,
    companyController.getCompany
);

/**
 * @route   PATCH /api/projects/:projectId/companies/:companyId
 * @desc    Partial update; validates companyListId belongs to the same project when provided.
 * @access  Protected
 */
router.patch(
    SCOPE.COMPANY_DETAIL,
    authenticate,
    companyController.updateCompany
);

/**
 * @route   DELETE /api/projects/:projectId/companies/:companyId
 * @desc    Soft-deletes the company row (stops it appearing in lists; cascades may apply to research per schema).
 * @access  Protected
 */
router.delete(
    SCOPE.COMPANY_DETAIL,
    authenticate,
    companyController.deleteCompany
);

export default router;
