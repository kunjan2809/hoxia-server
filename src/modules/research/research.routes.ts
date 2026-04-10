// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import { Router } from 'express';

// Controllers
import { researchController } from './research.controller.js';

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
// Company research (project-scoped)
// ============================================================================

/**
 * @route   GET /api/projects/:projectId/company-research
 * @desc    Paginated list of company research rows with optional status filter, companyId filter, and q search.
 * @access  Protected
 */
router.get(
    SCOPE.COMPANY_RESEARCH,
    authenticate,
    researchController.listCompanyResearch
);

/**
 * @route   POST /api/projects/:projectId/company-research
 * @desc    Creates a research row for a company (one per company). originalData is validated JSON from the client.
 * @access  Protected
 */
router.post(
    SCOPE.COMPANY_RESEARCH,
    authenticate,
    researchController.createCompanyResearch
);

/**
 * @route   POST /api/projects/:projectId/company-research/:companyResearchId/run
 * @desc    Runs the Gemini research job to completion and returns the final company research row (HTTP 200).
 *          Use a long client timeout; polling GET company-research is optional for recovery only.
 * @access  Protected
 */
router.post(
    SCOPE.COMPANY_RESEARCH_RUN,
    authenticate,
    researchController.runCompanyResearch
);

/**
 * @route   GET /api/projects/:projectId/company-research/:companyResearchId
 * @desc    Full research row including originalData, researchData, sources, and error fields.
 * @access  Protected
 */
router.get(
    SCOPE.COMPANY_RESEARCH_DETAIL,
    authenticate,
    researchController.getCompanyResearch
);

/**
 * @route   PATCH /api/projects/:projectId/company-research/:companyResearchId
 * @desc    Partial update of originalData, sortOrder, activeStrategy, metadata.
 * @access  Protected
 */
router.patch(
    SCOPE.COMPANY_RESEARCH_DETAIL,
    authenticate,
    researchController.updateCompanyResearch
);

/**
 * @route   DELETE /api/projects/:projectId/company-research/:companyResearchId
 * @desc    Soft-deletes the research row.
 * @access  Protected
 */
router.delete(
    SCOPE.COMPANY_RESEARCH_DETAIL,
    authenticate,
    researchController.deleteCompanyResearch
);

// ============================================================================
// Research reports (project-scoped)
// ============================================================================

/**
 * @route   GET /api/projects/:projectId/research-reports
 * @desc    Paginated list of deep-dive reports; optional filter by companyResearchId and q on name/industry.
 * @access  Protected
 */
router.get(
    SCOPE.RESEARCH_REPORTS,
    authenticate,
    researchController.listResearchReports
);

/**
 * @route   POST /api/projects/:projectId/research-reports
 * @desc    Builds a report from a COMPLETED company research row and creates foundation strategy rows when data is present.
 * @access  Protected
 */
router.post(
    SCOPE.RESEARCH_REPORTS,
    authenticate,
    researchController.createResearchReport
);

/**
 * @route   GET /api/projects/:projectId/research-reports/:reportId
 * @desc    Report detail including read-only foundationStrategies for UI selection.
 * @access  Protected
 */
router.get(
    SCOPE.RESEARCH_REPORT_DETAIL,
    authenticate,
    researchController.getResearchReport
);

/**
 * @route   PATCH /api/projects/:projectId/research-reports/:reportId
 * @desc    Partial update of narrative and JSON fields (foundation rows are not edited in MVP).
 * @access  Protected
 */
router.patch(
    SCOPE.RESEARCH_REPORT_DETAIL,
    authenticate,
    researchController.updateResearchReport
);

/**
 * @route   DELETE /api/projects/:projectId/research-reports/:reportId
 * @desc    Soft-deletes the report (cascades foundation strategies per schema).
 * @access  Protected
 */
router.delete(
    SCOPE.RESEARCH_REPORT_DETAIL,
    authenticate,
    researchController.deleteResearchReport
);

export default router;
