-- CreateTable
CREATE TABLE "TemporaryBackend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "contractJson" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "lastAccessedAt" DATETIME,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "TemporaryBackend_status_expiresAt_idx" ON "TemporaryBackend"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "TemporaryBackend_createdAt_idx" ON "TemporaryBackend"("createdAt");
