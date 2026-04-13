-- CreateEnum
CREATE TYPE "UserVerificationStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "verification_status" "UserVerificationStatus" NOT NULL DEFAULT 'PENDING';

-- Existing accounts: already approved (product decision).
UPDATE "users" SET "verification_status" = 'SUCCESS';

-- CreateIndex
CREATE INDEX "users_verification_status_idx" ON "users"("verification_status");
