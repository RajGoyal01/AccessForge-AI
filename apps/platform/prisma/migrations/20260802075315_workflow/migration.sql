-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN "formatPassed" BOOLEAN;

-- AlterTable
ALTER TABLE "Repair" ADD COLUMN "appliedFileHash" TEXT;
ALTER TABLE "Repair" ADD COLUMN "assumptions" TEXT;
ALTER TABLE "Repair" ADD COLUMN "issueSummary" TEXT;
ALTER TABLE "Repair" ADD COLUMN "originalFileHash" TEXT;
ALTER TABLE "Repair" ADD COLUMN "proposedApproach" TEXT;
ALTER TABLE "Repair" ADD COLUMN "userImpact" TEXT;
ALTER TABLE "Repair" ADD COLUMN "validationSteps" TEXT;
