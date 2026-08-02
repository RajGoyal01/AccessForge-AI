-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectType" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "localSourceRoot" TEXT,
    "framework" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "stage" TEXT NOT NULL DEFAULT 'QUEUED',
    "originalScore" INTEGER,
    "finalScore" INTEGER,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "duration" INTEGER,
    "screenshotPath" TEXT,
    "errorMessage" TEXT,
    CONSTRAINT "Scan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PageScan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "title" TEXT,
    "score" INTEGER,
    "screenshotPath" TEXT,
    "viewportWidth" INTEGER NOT NULL,
    "viewportHeight" INTEGER NOT NULL,
    CONSTRAINT "PageScan_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "pageScanId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "helpText" TEXT,
    "helpUrl" TEXT,
    "impact" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "selector" TEXT NOT NULL,
    "htmlSnippet" TEXT,
    "failureSummary" TEXT,
    "boundingX" REAL,
    "boundingY" REAL,
    "boundingWidth" REAL,
    "boundingHeight" REAL,
    "sourceFile" TEXT,
    "sourceLine" INTEGER,
    "sourceConfidence" REAL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "repairAvailable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Issue_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Issue_pageScanId_fkey" FOREIGN KEY ("pageScanId") REFERENCES "PageScan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Repair" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "targetFile" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "originalCode" TEXT NOT NULL,
    "proposedCode" TEXT NOT NULL,
    "unifiedDiff" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "approvedAt" DATETIME,
    "appliedAt" DATETIME,
    "backupPath" TEXT,
    "errorMessage" TEXT,
    CONSTRAINT "Repair_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Repair_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repairId" TEXT NOT NULL,
    "originalScanId" TEXT NOT NULL,
    "newScanId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "originalScore" INTEGER,
    "newScore" INTEGER,
    "resolvedIssueCount" INTEGER NOT NULL DEFAULT 0,
    "remainingIssueCount" INTEGER NOT NULL DEFAULT 0,
    "regressionCount" INTEGER NOT NULL DEFAULT 0,
    "buildPassed" BOOLEAN,
    "typecheckPassed" BOOLEAN,
    "testsPassed" BOOLEAN,
    "targetIssueResolved" BOOLEAN,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evaluation_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "Repair" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_originalScanId_fkey" FOREIGN KEY ("originalScanId") REFERENCES "Scan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_newScanId_fkey" FOREIGN KEY ("newScanId") REFERENCES "Scan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "scanId" TEXT,
    "repairId" TEXT,
    "agent" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "Repair" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Project_status_updatedAt_idx" ON "Project"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Project_projectType_idx" ON "Project"("projectType");

-- CreateIndex
CREATE INDEX "Scan_projectId_startedAt_idx" ON "Scan"("projectId", "startedAt");

-- CreateIndex
CREATE INDEX "Scan_status_stage_idx" ON "Scan"("status", "stage");

-- CreateIndex
CREATE INDEX "PageScan_scanId_pageUrl_idx" ON "PageScan"("scanId", "pageUrl");

-- CreateIndex
CREATE INDEX "Issue_scanId_impact_status_idx" ON "Issue"("scanId", "impact", "status");

-- CreateIndex
CREATE INDEX "Issue_pageScanId_ruleId_idx" ON "Issue"("pageScanId", "ruleId");

-- CreateIndex
CREATE INDEX "Issue_sourceFile_idx" ON "Issue"("sourceFile");

-- CreateIndex
CREATE INDEX "Repair_projectId_status_idx" ON "Repair"("projectId", "status");

-- CreateIndex
CREATE INDEX "Repair_issueId_status_idx" ON "Repair"("issueId", "status");

-- CreateIndex
CREATE INDEX "Evaluation_repairId_createdAt_idx" ON "Evaluation"("repairId", "createdAt");

-- CreateIndex
CREATE INDEX "Evaluation_status_idx" ON "Evaluation"("status");

-- CreateIndex
CREATE INDEX "ActivityEvent_projectId_createdAt_idx" ON "ActivityEvent"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_scanId_createdAt_idx" ON "ActivityEvent"("scanId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_repairId_createdAt_idx" ON "ActivityEvent"("repairId", "createdAt");
