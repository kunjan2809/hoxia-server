-- DropStrategyCompositeUnique
-- Allow multiple saved strategies per project/company/angle/objective/output_type combination.

DROP INDEX IF EXISTS "saved_strategies_project_id_company_id_angle_objective_outp_key";
