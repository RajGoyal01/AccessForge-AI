import type { IssueImpact, Project, Scan } from "@prisma/client";
import { writeActivity } from "@/lib/activity";
import { db } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import { scanPage } from "@/lib/scanner/scanner";
import type { ScannerStageEvent } from "@/lib/scanner/types";
import { validateTargetUrl } from "@/lib/security/url-policy";

const controllers = new Map<string, AbortController>();
const queueReservations = new Set<string>();

const prismaImpact = (impact: string): IssueImpact => impact.toUpperCase() as IssueImpact;

const scanInclude = {
  pageScans: true,
  issues: true,
  activityEvents: true,
} as const;

function publicScanError(error: unknown) {
  if (error instanceof AppError) return error;
  return new AppError(
    "SCAN_FAILED",
    "The scan could not be completed because of an internal error. Please retry.",
    500,
    { reason: "INTERNAL_SCAN_ERROR", retryable: true },
  );
}

function durationSince(startedAt: Date | null | undefined) {
  return startedAt ? Math.max(0, Date.now() - startedAt.getTime()) : null;
}

async function safeActivity(input: Parameters<typeof writeActivity>[0]) {
  await writeActivity(input).catch(() => undefined);
}

async function handleScannerStage(scan: Scan, project: Project, event: ScannerStageEvent) {
  switch (event.stage) {
    case "EXPLORATION_COMPLETED":
      await db.scan.update({
        where: { id: scan.id },
        data: { screenshotPath: event.metadata.screenshotPath },
      });
      await safeActivity({
        projectId: project.id,
        scanId: scan.id,
        agent: "EXPLORER",
        eventType: "EXPLORATION_COMPLETED",
        status: "SUCCEEDED",
        message: "The target loaded and its page evidence was captured.",
        metadata: {
          pageUrl: event.metadata.pageUrl,
          title: event.metadata.title,
          httpStatus: event.metadata.httpStatus,
          screenshotTruncated: event.metadata.screenshotTruncated,
        },
      });
      return;
    case "AUDIT_STARTED":
      await db.scan.update({ where: { id: scan.id }, data: { stage: "AUDITING" } });
      await safeActivity({
        projectId: project.id,
        scanId: scan.id,
        agent: "AUDIT",
        eventType: "AUDIT_STARTED",
        status: "RUNNING",
        message: "Running deterministic axe-core accessibility checks.",
      });
      return;
    case "AUDIT_COMPLETED":
      await safeActivity({
        projectId: project.id,
        scanId: scan.id,
        agent: "AUDIT",
        eventType: "AUDIT_COMPLETED",
        status: "SUCCEEDED",
        message: `Accessibility audit found ${event.metadata.issueCount} affected elements.`,
        metadata: event.metadata,
      });
      return;
    case "PROCESSING_RESULTS":
      await db.scan.update({ where: { id: scan.id }, data: { stage: "PROCESSING_RESULTS" } });
      await safeActivity({
        projectId: project.id,
        scanId: scan.id,
        agent: "SYSTEM",
        eventType: "RESULTS_PROCESSING_STARTED",
        status: "RUNNING",
        message: "Saving normalized findings and scan evidence.",
      });
  }
}

/** Creates a durable queued record without holding the request open for browser work. */
export async function queueProjectScan(projectId: string) {
  if (queueReservations.has(projectId)) {
    throw new AppError("CONFLICT", "A scan is already being queued for this project.", 409);
  }

  queueReservations.add(projectId);
  try {
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project || project.status !== "ACTIVE") {
      throw new AppError("NOT_FOUND", "Active project not found.", 404);
    }

    // Validate before persisting work so malformed and private-network targets never enter the queue.
    await validateTargetUrl(project.targetUrl, project.projectType === "BUNDLED_DEMO");
    const running = await db.scan.findFirst({
      where: { projectId, status: { in: ["QUEUED", "RUNNING"] } },
    });
    if (running) throw new AppError("CONFLICT", "A scan is already running for this project.", 409);

    const scan = await db.scan.create({
      data: { projectId, status: "QUEUED", stage: "QUEUED" },
    });
    await safeActivity({
      projectId,
      scanId: scan.id,
      agent: "SYSTEM",
      eventType: "SCAN_QUEUED",
      status: "WAITING",
      message: "Scan accepted and waiting for the controlled browser.",
    });
    return scan;
  } finally {
    queueReservations.delete(projectId);
  }
}

/** Executes one queued scan. The status compare-and-set makes duplicate dispatches harmless. */
export async function executeQueuedScan(scanId: string) {
  const queued = await db.scan.findUnique({ where: { id: scanId }, include: { project: true } });
  if (!queued) throw new AppError("NOT_FOUND", "Scan not found.", 404);

  if (queued.status !== "QUEUED") {
    return db.scan.findUniqueOrThrow({ where: { id: scanId }, include: scanInclude });
  }

  const startedAt = new Date();
  const claimed = await db.scan.updateMany({
    where: { id: scanId, status: "QUEUED" },
    data: { status: "RUNNING", stage: "INITIALIZING", startedAt, errorMessage: null },
  });
  if (claimed.count !== 1) {
    return db.scan.findUniqueOrThrow({ where: { id: scanId }, include: scanInclude });
  }

  const controller = new AbortController();
  controllers.set(scanId, controller);

  try {
    // Revalidate immediately before browser launch to catch target or DNS changes after queuing.
    const bundledDemo = queued.project.projectType === "BUNDLED_DEMO";
    const target = await validateTargetUrl(queued.project.targetUrl, bundledDemo);

    await safeActivity({
      projectId: queued.projectId,
      scanId,
      agent: "EXPLORER",
      eventType: "SCAN_INITIALIZING",
      status: "RUNNING",
      message: "Preparing an isolated browser session.",
    });
    await db.scan.update({ where: { id: scanId }, data: { stage: "EXPLORING" } });
    await safeActivity({
      projectId: queued.projectId,
      scanId,
      agent: "EXPLORER",
      eventType: "EXPLORATION_STARTED",
      status: "RUNNING",
      message: "Opening the approved target and waiting for a stable page state.",
    });

    const result = await scanPage({
      scanId,
      targetUrl: target.toString(),
      bundledDemo,
      signal: controller.signal,
      onStage: (event) => handleScannerStage(queued, queued.project, event),
    });
    if (controller.signal.aborted) {
      throw new AppError("SCAN_FAILED", "The scan was cancelled.", 409, {
        reason: "SCAN_CANCELLED",
        retryable: true,
      });
    }

    const page = await db.pageScan.create({
      data: {
        scanId,
        pageUrl: result.pageUrl,
        title: result.title,
        score: result.score,
        screenshotPath: result.screenshotPath,
        viewportWidth: result.viewport.width,
        viewportHeight: result.viewport.height,
      },
    });

    // Individual writes preserve successfully normalized evidence if a later record fails.
    for (const issue of result.issues) {
      const source = bundledDemo ? issue.source : null;
      await db.issue.create({
        data: {
          scanId,
          pageScanId: page.id,
          ruleId: issue.ruleId,
          title: issue.title,
          description: issue.description,
          helpText: issue.helpText,
          helpUrl: issue.helpUrl,
          impact: prismaImpact(issue.impact),
          selector: issue.selector,
          htmlSnippet: issue.htmlSnippet,
          failureSummary: issue.failureSummary,
          boundingX: issue.boundingBox?.x,
          boundingY: issue.boundingBox?.y,
          boundingWidth: issue.boundingBox?.width,
          boundingHeight: issue.boundingBox?.height,
          sourceFile: source?.file,
          sourceLine: source?.line,
          sourceConfidence: source ? 0.98 : null,
          repairAvailable: bundledDemo && Boolean(source?.file),
        },
      });
    }

    const completedAt = new Date();
    await db.scan.update({
      where: { id: scanId },
      data: {
        status: "COMPLETED",
        stage: "COMPLETED",
        originalScore: result.score,
        finalScore: result.score,
        screenshotPath: result.screenshotPath,
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
      },
    });
    await safeActivity({
      projectId: queued.projectId,
      scanId,
      agent: "SYSTEM",
      eventType: "SCAN_COMPLETED",
      status: "SUCCEEDED",
      message: `Scan completed with a transparent score of ${result.score}/100.`,
      metadata: {
        score: result.score,
        issueCount: result.issues.length,
        httpStatus: result.httpStatus,
        screenshotTruncated: result.screenshotTruncated,
      },
    });

    return db.scan.findUniqueOrThrow({ where: { id: scanId }, include: scanInclude });
  } catch (error) {
    const appError = publicScanError(error);
    const completedAt = new Date();

    if (controller.signal.aborted) {
      await db.scan.updateMany({
        where: { id: scanId, status: "RUNNING" },
        data: {
          status: "CANCELLED",
          completedAt,
          duration: durationSince(startedAt),
          errorMessage: "Cancelled by user.",
        },
      });
      await safeActivity({
        projectId: queued.projectId,
        scanId,
        agent: "SYSTEM",
        eventType: "SCAN_CANCELLED",
        status: "FAILED",
        message: "The scan was cancelled and browser resources were released.",
      });
    } else {
      await db.scan.updateMany({
        where: { id: scanId, status: "RUNNING" },
        data: {
          status: "FAILED",
          completedAt,
          duration: durationSince(startedAt),
          errorMessage: appError.message.slice(0, 500),
        },
      });
      await safeActivity({
        projectId: queued.projectId,
        scanId,
        agent: "SYSTEM",
        eventType: "SCAN_FAILED",
        status: "FAILED",
        message: appError.message,
        metadata:
          typeof appError.details === "object" && appError.details !== null
            ? (appError.details as Record<string, unknown>)
            : { reason: appError.code },
      });
    }
    throw appError;
  } finally {
    if (controllers.get(scanId) === controller) controllers.delete(scanId);
  }
}

/** Compatibility path for evaluation and integration code that needs the completed result. */
export async function startProjectScan(projectId: string) {
  const queued = await queueProjectScan(projectId);
  return executeQueuedScan(queued.id);
}

/**
 * Starts queued work after the HTTP response is free to render the live scan page.
 * The durable QUEUED record and compare-and-set execution keep duplicate dispatches safe.
 */
export function dispatchQueuedScan(scanId: string) {
  setTimeout(() => {
    void executeQueuedScan(scanId).catch(() => undefined);
  }, 0);
}

export function cancelScan(scanId: string) {
  const controller = controllers.get(scanId);
  if (!controller) return false;
  controller.abort();
  return true;
}
