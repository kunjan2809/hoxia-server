-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DRAFT', 'PAUSED');

-- CreateEnum
CREATE TYPE "StrategicAngle" AS ENUM ('PRIMARY', 'SUPPORTING', 'CONTRARIAN');

-- CreateEnum
CREATE TYPE "Objective" AS ENUM ('OPEN_CONVERSATION', 'SECURE_MEETING', 'SUPPORT_OPPORTUNITY', 'REENGAGE_STALLED', 'INTRODUCE_POV', 'NURTURE');

-- CreateEnum
CREATE TYPE "OutputType" AS ENUM ('OUTREACH_FRAMEWORK', 'SINGLE_TOUCHPOINT');

-- CreateEnum
CREATE TYPE "Cadence" AS ENUM ('STANDARD_PROSPECTING', 'LONG_GAME_NURTURE', 'QUICK_BREAKTHROUGH');

-- CreateEnum
CREATE TYPE "ResearchRowStatus" AS ENUM ('IDLE', 'LOADING', 'COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "LlmProvider" AS ENUM ('GOOGLE', 'ANTHROPIC', 'OPENAI');

-- CreateEnum
CREATE TYPE "LlmOperationKind" AS ENUM ('RESEARCH', 'DEEP_DIVE', 'STRATEGY', 'ASSET_GENERATION');

-- CreateEnum
CREATE TYPE "LlmCallStatus" AS ENUM ('SUCCESS', 'FAILURE', 'TIMEOUT', 'RATE_LIMITED', 'CANCELLED', 'PENDING');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('INDIVIDUAL', 'BATCH');

-- CreateEnum
CREATE TYPE "StrategyTone" AS ENUM ('PROFESSIONAL', 'CASUAL', 'DIRECT', 'CONSULTATIVE', 'WARM', 'FORMAL');

-- CreateEnum
CREATE TYPE "SenderPersona" AS ENUM ('PEER', 'EXECUTIVE', 'VENDOR', 'PARTNER', 'INTERNAL_CHAMPION');

-- DropIndex
DROP INDEX "email_verification_tokens_token_hash_idx";

-- DropIndex
DROP INDEX "refresh_tokens_token_idx";

-- AlterTable
ALTER TABLE "email_verification_tokens" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "default_headers" JSONB NOT NULL,
    "campaign_context" JSONB,
    "metadata" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_lists" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "row_count" INTEGER,
    "headers" JSONB NOT NULL,
    "campaign_context" JSONB,
    "metadata" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_list_rows" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "type" "CompanyType" NOT NULL,
    "company_list_id" TEXT,
    "company_name" TEXT,
    "website_url" TEXT,
    "linkedin_url" TEXT,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_list_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_research_rows" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "original_data" JSONB NOT NULL,
    "research_status" "ResearchRowStatus" NOT NULL DEFAULT 'IDLE',
    "research_data" JSONB,
    "sources" JSONB,
    "active_strategy" "StrategicAngle",
    "research_error" TEXT,
    "sort_order" INTEGER,
    "metadata" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_research_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deep_dive_reports" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "company_id" TEXT,
    "company_research_id" TEXT,
    "formal_company_name" TEXT,
    "industry" TEXT,
    "headquarters" TEXT,
    "strategic_summary" TEXT,
    "strategic_velocity" TEXT,
    "growth_signals" TEXT,
    "hiring_signals" TEXT,
    "security_risk_signals" TEXT,
    "leadership_signals" TEXT,
    "key_headwinds" TEXT,
    "interpretation" TEXT,
    "research_sources" JSONB,
    "active_strategy" "StrategicAngle",
    "metadata" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "deep_dive_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_strategies" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "angle" "StrategicAngle" NOT NULL,
    "strategic_trigger" TEXT,
    "why_this_matters" TEXT,
    "assets_created" INTEGER NOT NULL,
    "stakeholder" TEXT,
    "target_role" TEXT,
    "strategic_posture" TEXT,
    "messaging_direction" TEXT,
    "confidence" TEXT,
    "confidence_reason" TEXT,
    "last_updated" TIMESTAMPTZ(6),
    "metadata" JSONB,

    CONSTRAINT "foundation_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_strategies" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "company_id" TEXT,
    "company_research_id" TEXT,
    "research_report_id" TEXT,
    "name" TEXT NOT NULL,
    "angle" "StrategicAngle" NOT NULL,
    "objective" "Objective" NOT NULL,
    "output_type" "OutputType" NOT NULL,
    "cadence" "Cadence",
    "tone" "StrategyTone" NOT NULL,
    "sender_persona" "SenderPersona" NOT NULL,
    "pacing_notes" TEXT,
    "metadata" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "saved_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_steps" (
    "id" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "company_id" TEXT,
    "company_research_id" TEXT,
    "research_report_id" TEXT,
    "activation_asset_id" TEXT,
    "role" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "step_order" INTEGER NOT NULL,
    "asset_name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "strategy_angle" "StrategicAngle" NOT NULL,
    "confidence" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "subject_line" TEXT,
    "metadata" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "campaign_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activation_assets" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "company_research_id" TEXT,
    "research_report_id" TEXT,
    "company_id" TEXT,
    "source" TEXT NOT NULL,
    "angle_used" "StrategicAngle" NOT NULL,
    "insight_claim" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "objective" "Objective" NOT NULL,
    "output_type" "OutputType" NOT NULL,
    "output_preview" TEXT NOT NULL,
    "subject_line" TEXT,
    "strategic_angle" TEXT,
    "why_it_fits" TEXT,
    "approach_guidance" TEXT,
    "metadata" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "activation_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_api_calls" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "company_research_id" TEXT,
    "research_report_id" TEXT,
    "activation_asset_id" TEXT,
    "strategy_id" TEXT,
    "company_id" TEXT,
    "provider" "LlmProvider" NOT NULL,
    "model_id" TEXT NOT NULL,
    "operation_kind" "LlmOperationKind" NOT NULL,
    "status" "LlmCallStatus" NOT NULL,
    "prompt_token_count" INTEGER,
    "output_token_count" INTEGER,
    "total_token_count" INTEGER,
    "thoughts_token_count" INTEGER,
    "credit_conversion_rate" DOUBLE PRECISION,
    "input_credits" DOUBLE PRECISION,
    "output_credits" DOUBLE PRECISION,
    "additional_credits" DOUBLE PRECISION,
    "input_credit_margin_rate" DOUBLE PRECISION,
    "output_credit_margin_rate" DOUBLE PRECISION,
    "additional_credit_margin_rate" DOUBLE PRECISION,
    "total_credits" DOUBLE PRECISION,
    "latency_ms" INTEGER,
    "grounding_search_used" BOOLEAN NOT NULL DEFAULT false,
    "client_request_id" TEXT,
    "correlation_id" TEXT,
    "retry_attempt" INTEGER NOT NULL DEFAULT 0,
    "provider_request_id" TEXT,
    "http_status_code" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "metadata" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "llm_api_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");

-- CreateIndex
CREATE INDEX "projects_user_id_is_deleted_idx" ON "projects"("user_id", "is_deleted");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "company_lists_project_id_idx" ON "company_lists"("project_id");

-- CreateIndex
CREATE INDEX "company_lists_project_id_is_deleted_idx" ON "company_lists"("project_id", "is_deleted");

-- CreateIndex
CREATE INDEX "company_lists_created_by_idx" ON "company_lists"("created_by");

-- CreateIndex
CREATE INDEX "company_list_rows_project_id_idx" ON "company_list_rows"("project_id");

-- CreateIndex
CREATE INDEX "company_list_rows_project_id_is_deleted_idx" ON "company_list_rows"("project_id", "is_deleted");

-- CreateIndex
CREATE INDEX "company_list_rows_company_list_id_idx" ON "company_list_rows"("company_list_id");

-- CreateIndex
CREATE INDEX "company_list_rows_company_name_idx" ON "company_list_rows"("company_name");

-- CreateIndex
CREATE INDEX "company_list_rows_created_by_idx" ON "company_list_rows"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "company_research_rows_company_id_key" ON "company_research_rows"("company_id");

-- CreateIndex
CREATE INDEX "company_research_rows_project_id_idx" ON "company_research_rows"("project_id");

-- CreateIndex
CREATE INDEX "company_research_rows_project_id_is_deleted_idx" ON "company_research_rows"("project_id", "is_deleted");

-- CreateIndex
CREATE INDEX "company_research_rows_project_id_research_status_idx" ON "company_research_rows"("project_id", "research_status");

-- CreateIndex
CREATE INDEX "company_research_rows_created_by_idx" ON "company_research_rows"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "company_research_rows_project_id_sort_order_key" ON "company_research_rows"("project_id", "sort_order");

-- CreateIndex
CREATE INDEX "deep_dive_reports_project_id_idx" ON "deep_dive_reports"("project_id");

-- CreateIndex
CREATE INDEX "deep_dive_reports_project_id_is_deleted_idx" ON "deep_dive_reports"("project_id", "is_deleted");

-- CreateIndex
CREATE INDEX "deep_dive_reports_company_id_idx" ON "deep_dive_reports"("company_id");

-- CreateIndex
CREATE INDEX "deep_dive_reports_company_research_id_idx" ON "deep_dive_reports"("company_research_id");

-- CreateIndex
CREATE INDEX "deep_dive_reports_created_by_idx" ON "deep_dive_reports"("created_by");

-- CreateIndex
CREATE INDEX "foundation_strategies_report_id_idx" ON "foundation_strategies"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "foundation_strategies_report_id_angle_key" ON "foundation_strategies"("report_id", "angle");

-- CreateIndex
CREATE INDEX "saved_strategies_project_id_idx" ON "saved_strategies"("project_id");

-- CreateIndex
CREATE INDEX "saved_strategies_project_id_is_deleted_idx" ON "saved_strategies"("project_id", "is_deleted");

-- CreateIndex
CREATE INDEX "saved_strategies_company_research_id_idx" ON "saved_strategies"("company_research_id");

-- CreateIndex
CREATE INDEX "saved_strategies_research_report_id_idx" ON "saved_strategies"("research_report_id");

-- CreateIndex
CREATE INDEX "saved_strategies_company_id_idx" ON "saved_strategies"("company_id");

-- CreateIndex
CREATE INDEX "saved_strategies_created_by_idx" ON "saved_strategies"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "saved_strategies_project_id_company_id_angle_objective_outp_key" ON "saved_strategies"("project_id", "company_id", "angle", "objective", "output_type");

-- CreateIndex
CREATE INDEX "campaign_steps_strategy_id_idx" ON "campaign_steps"("strategy_id");

-- CreateIndex
CREATE INDEX "campaign_steps_strategy_id_step_order_idx" ON "campaign_steps"("strategy_id", "step_order");

-- CreateIndex
CREATE INDEX "campaign_steps_activation_asset_id_idx" ON "campaign_steps"("activation_asset_id");

-- CreateIndex
CREATE INDEX "campaign_steps_strategy_id_is_deleted_idx" ON "campaign_steps"("strategy_id", "is_deleted");

-- CreateIndex
CREATE INDEX "campaign_steps_created_by_idx" ON "campaign_steps"("created_by");

-- CreateIndex
CREATE INDEX "activation_assets_project_id_idx" ON "activation_assets"("project_id");

-- CreateIndex
CREATE INDEX "activation_assets_project_id_is_deleted_idx" ON "activation_assets"("project_id", "is_deleted");

-- CreateIndex
CREATE INDEX "activation_assets_project_id_output_type_idx" ON "activation_assets"("project_id", "output_type");

-- CreateIndex
CREATE INDEX "activation_assets_company_research_id_idx" ON "activation_assets"("company_research_id");

-- CreateIndex
CREATE INDEX "activation_assets_research_report_id_idx" ON "activation_assets"("research_report_id");

-- CreateIndex
CREATE INDEX "activation_assets_company_id_idx" ON "activation_assets"("company_id");

-- CreateIndex
CREATE INDEX "activation_assets_created_by_idx" ON "activation_assets"("created_by");

-- CreateIndex
CREATE INDEX "llm_api_calls_user_id_idx" ON "llm_api_calls"("user_id");

-- CreateIndex
CREATE INDEX "llm_api_calls_user_id_created_at_idx" ON "llm_api_calls"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "llm_api_calls_user_id_is_deleted_idx" ON "llm_api_calls"("user_id", "is_deleted");

-- CreateIndex
CREATE INDEX "llm_api_calls_project_id_idx" ON "llm_api_calls"("project_id");

-- CreateIndex
CREATE INDEX "llm_api_calls_project_id_is_deleted_idx" ON "llm_api_calls"("project_id", "is_deleted");

-- CreateIndex
CREATE INDEX "llm_api_calls_project_id_created_at_idx" ON "llm_api_calls"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "llm_api_calls_operation_kind_idx" ON "llm_api_calls"("operation_kind");

-- CreateIndex
CREATE INDEX "llm_api_calls_provider_model_id_idx" ON "llm_api_calls"("provider", "model_id");

-- CreateIndex
CREATE INDEX "llm_api_calls_correlation_id_idx" ON "llm_api_calls"("correlation_id");

-- CreateIndex
CREATE INDEX "llm_api_calls_client_request_id_idx" ON "llm_api_calls"("client_request_id");

-- CreateIndex
CREATE INDEX "llm_api_calls_status_idx" ON "llm_api_calls"("status");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_is_revoked_idx" ON "refresh_tokens"("user_id", "is_revoked");

-- CreateIndex
CREATE INDEX "users_is_deleted_idx" ON "users"("is_deleted");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_lists" ADD CONSTRAINT "company_lists_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_lists" ADD CONSTRAINT "company_lists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_list_rows" ADD CONSTRAINT "company_list_rows_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_list_rows" ADD CONSTRAINT "company_list_rows_company_list_id_fkey" FOREIGN KEY ("company_list_id") REFERENCES "company_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_list_rows" ADD CONSTRAINT "company_list_rows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_research_rows" ADD CONSTRAINT "company_research_rows_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_research_rows" ADD CONSTRAINT "company_research_rows_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company_list_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_research_rows" ADD CONSTRAINT "company_research_rows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deep_dive_reports" ADD CONSTRAINT "deep_dive_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deep_dive_reports" ADD CONSTRAINT "deep_dive_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deep_dive_reports" ADD CONSTRAINT "deep_dive_reports_company_research_id_fkey" FOREIGN KEY ("company_research_id") REFERENCES "company_research_rows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_strategies" ADD CONSTRAINT "foundation_strategies_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "deep_dive_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_strategies" ADD CONSTRAINT "saved_strategies_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_strategies" ADD CONSTRAINT "saved_strategies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_strategies" ADD CONSTRAINT "saved_strategies_company_research_id_fkey" FOREIGN KEY ("company_research_id") REFERENCES "company_research_rows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_strategies" ADD CONSTRAINT "saved_strategies_research_report_id_fkey" FOREIGN KEY ("research_report_id") REFERENCES "deep_dive_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_steps" ADD CONSTRAINT "campaign_steps_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "saved_strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_steps" ADD CONSTRAINT "campaign_steps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_steps" ADD CONSTRAINT "campaign_steps_activation_asset_id_fkey" FOREIGN KEY ("activation_asset_id") REFERENCES "activation_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_assets" ADD CONSTRAINT "activation_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_assets" ADD CONSTRAINT "activation_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_assets" ADD CONSTRAINT "activation_assets_company_research_id_fkey" FOREIGN KEY ("company_research_id") REFERENCES "company_research_rows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_assets" ADD CONSTRAINT "activation_assets_research_report_id_fkey" FOREIGN KEY ("research_report_id") REFERENCES "deep_dive_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_api_calls" ADD CONSTRAINT "llm_api_calls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_api_calls" ADD CONSTRAINT "llm_api_calls_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_api_calls" ADD CONSTRAINT "llm_api_calls_company_research_id_fkey" FOREIGN KEY ("company_research_id") REFERENCES "company_research_rows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_api_calls" ADD CONSTRAINT "llm_api_calls_research_report_id_fkey" FOREIGN KEY ("research_report_id") REFERENCES "deep_dive_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_api_calls" ADD CONSTRAINT "llm_api_calls_activation_asset_id_fkey" FOREIGN KEY ("activation_asset_id") REFERENCES "activation_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_api_calls" ADD CONSTRAINT "llm_api_calls_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "saved_strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
