-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
INSERT INTO "new_Scan" ("completedAt", "duration", "errorMessage", "finalScore", "id", "originalScore", "projectId", "screenshotPath", "stage", "startedAt", "status") SELECT "completedAt", "duration", "errorMessage", "finalScore", "id", "originalScore", "projectId", "screenshotPath", "stage", "startedAt", "status" FROM "Scan";
DROP TABLE "Scan";
ALTER TABLE "new_Scan" RENAME TO "Scan";
CREATE INDEX "Scan_projectId_startedAt_idx" ON "Scan"("projectId", "startedAt");
CREATE INDEX "Scan_status_stage_idx" ON "Scan"("status", "stage");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
