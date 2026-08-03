import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type Response as PlaywrightResponse,
} from "playwright";
import { AppError } from "@/lib/errors";
import { validateTargetUrl } from "@/lib/security/url-policy";
import { createScreenshotPath } from "@/lib/storage";
import { calculateAccessibilityScore } from "./scoring";
import type {
  BoundingBox,
  NormalizedImpact,
  ScannedIssue,
  ScannerResult,
  ScannerStageEvent,
} from "./types";

const VIEWPORT = { width: 1440, height: 900 };
const NAVIGATION_TIMEOUT_MS = 30_000;
const PAGE_READY_TIMEOUT_MS = 8_000;
const AUDIT_TIMEOUT_MS = 35_000;
const SCREENSHOT_TIMEOUT_MS = 20_000;
const MAX_SCREENSHOT_HEIGHT = 16_000;
const MAX_REDIRECTS = 10;
const EVIDENCE_BATCH_SIZE = 20;
const MAX_AFFECTED_ELEMENTS = 1_000;

let axeSourcePromise: Promise<string> | null = null;

function loadAxeSource() {
  axeSourcePromise ??= readFile(
    path.resolve(process.cwd(), "../../node_modules/axe-core/axe.min.js"),
    "utf8",
  );
  return axeSourcePromise;
}

interface AxeNode {
  target: unknown[];
  impact?: string | null;
  html: string;
  failureSummary?: string;
}

interface AxeViolation {
  id: string;
  help: string;
  description: string;
  helpUrl: string;
  impact?: string | null;
  nodes: AxeNode[];
}

interface AxeResult {
  violations: AxeViolation[];
}

export interface ScanPageInput {
  scanId: string;
  targetUrl: string;
  bundledDemo: boolean;
  signal?: AbortSignal;
  onStage?: (event: ScannerStageEvent) => void | Promise<void>;
}

const normalizeImpact = (impact: string | null | undefined): NormalizedImpact =>
  (["critical", "serious", "moderate", "minor"].includes(impact ?? "")
    ? (impact as NormalizedImpact)
    : "unknown");

function axeSelector(target: unknown[]) {
  const firstSelector = target.find((part): part is string => typeof part === "string");
  return firstSelector?.slice(0, 2_000) ?? "";
}

function validBoundingBox(box: BoundingBox | null): BoundingBox | null {
  if (!box) return null;
  if (![box.x, box.y, box.width, box.height].every(Number.isFinite)) return null;
  if (box.width <= 0 || box.height <= 0) return null;
  return box;
}

async function elementEvidence(page: Page, selector: string, collectSourceMetadata: boolean) {
  try {
    const locator = page.locator(selector).first();
    if (await locator.count() === 0) return { boundingBox: null, source: null };

    const boundingBox = validBoundingBox(await locator.boundingBox());
    if (!collectSourceMetadata) return { boundingBox, source: null };

    const metadata = await locator.evaluate((element) => ({
      file: element.getAttribute("data-source-file"),
      line: element.getAttribute("data-source-line"),
      component: element.getAttribute("data-component-name"),
    }));
    const parsedLine = metadata.line ? Number(metadata.line) : null;

    return {
      boundingBox,
      source: metadata.file
        ? {
            file: metadata.file.slice(0, 500),
            line: parsedLine !== null && Number.isInteger(parsedLine) && parsedLine > 0 ? parsedLine : null,
            component: metadata.component?.slice(0, 200) ?? null,
          }
        : null,
    };
  } catch {
    return { boundingBox: null, source: null };
  }
}

function scannerError(
  message: string,
  reason: string,
  status = 502,
  retryable = true,
  code: "SCAN_FAILED" | "TARGET_UNAVAILABLE" = "TARGET_UNAVAILABLE",
) {
  return new AppError(code, message, status, { reason, retryable });
}

/** Converts browser implementation details into stable, actionable public errors. */
export function normalizeScannerError(error: unknown) {
  if (error instanceof AppError) return error;
  const rawMessage = error instanceof Error ? error.message : "";
  const message = rawMessage.toLowerCase();

  if (message.includes("executable doesn't exist") || message.includes("browser was not found")) {
    return scannerError(
      "The browser engine is not ready. Install Playwright Chromium and try again.",
      "BROWSER_NOT_INSTALLED",
      503,
      false,
      "SCAN_FAILED",
    );
  }
  if (message.includes("timeout") || message.includes("timed out")) {
    return scannerError(
      "The website took too long to respond. Confirm it is publicly reachable, then retry the scan.",
      "BROWSER_TIMEOUT",
      504,
    );
  }
  if (message.includes("err_name_not_resolved")) {
    return scannerError(
      "The website address could not be resolved. Check the address and try again.",
      "DNS_LOOKUP_FAILED",
      422,
    );
  }
  if (message.includes("err_connection_refused") || message.includes("err_connection_closed")) {
    return scannerError(
      "The website refused the browser connection. Confirm it is online and publicly accessible.",
      "CONNECTION_REFUSED",
    );
  }
  if (message.includes("err_cert") || message.includes("certificate")) {
    return scannerError(
      "The website's secure connection could not be verified. Fix its TLS certificate before scanning.",
      "TLS_ERROR",
      422,
      false,
    );
  }
  if (message.includes("target page, context or browser has been closed")) {
    return scannerError("The scan was cancelled.", "SCAN_CANCELLED", 409, true, "SCAN_FAILED");
  }

  return scannerError(
    "The controlled browser could not complete this scan. Check that the website is public and try again.",
    "BROWSER_ERROR",
    502,
    true,
    "SCAN_FAILED",
  );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, error: AppError) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(error), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function waitForStablePage(page: Page) {
  await page
    .waitForFunction(() => document.readyState === "complete", undefined, {
      timeout: PAGE_READY_TIMEOUT_MS,
    })
    .catch(() => undefined);
  await page.waitForLoadState("networkidle", { timeout: 4_000 }).catch(() => undefined);
  await page
    .evaluate(() => Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 2_000))]))
    .catch(() => undefined);
}

async function captureScreenshot(page: Page, scanId: string) {
  const screenshot = await createScreenshotPath(scanId);
  const dimensions = await page.evaluate(() => ({
    width: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0),
    height: Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0),
  }));
  const screenshotTruncated = dimensions.height > MAX_SCREENSHOT_HEIGHT;

  try {
    if (screenshotTruncated) {
      await page.screenshot({
        path: screenshot.absolutePath,
        clip: {
          x: 0,
          y: 0,
          width: Math.min(Math.max(dimensions.width, 1), VIEWPORT.width),
          height: MAX_SCREENSHOT_HEIGHT,
        },
        animations: "disabled",
        timeout: SCREENSHOT_TIMEOUT_MS,
      });
    } else {
      await page.screenshot({
        path: screenshot.absolutePath,
        fullPage: true,
        animations: "disabled",
        timeout: SCREENSHOT_TIMEOUT_MS,
      });
    }
  } catch {
    await page.screenshot({
      path: screenshot.absolutePath,
      fullPage: false,
      animations: "disabled",
      timeout: SCREENSHOT_TIMEOUT_MS,
    });
    return { ...screenshot, screenshotTruncated: true };
  }

  return { ...screenshot, screenshotTruncated };
}

function assertUsableResponse(response: PlaywrightResponse | null) {
  if (!response) {
    throw scannerError("The website did not return a document.", "EMPTY_RESPONSE");
  }
  const status = response.status();
  if (status === 401 || status === 403) {
    throw scannerError(
      "The website refused the controlled browser. Public pages that block automated access cannot be scanned.",
      "ACCESS_DENIED",
      status,
      false,
    );
  }
  if (status === 429) {
    throw scannerError("The website is rate-limiting requests. Wait briefly, then retry.", "RATE_LIMITED", 429);
  }
  if (status >= 400 && status < 500) {
    throw scannerError(`The website returned HTTP ${status}. Check the target URL and try again.`, "HTTP_CLIENT_ERROR", 422, false);
  }
  if (status >= 500) {
    throw scannerError(`The website returned HTTP ${status}. Retry when the site is healthy.`, "HTTP_SERVER_ERROR", 502);
  }
  return status;
}

async function configureNetworkPolicy(context: BrowserContext, page: Page, bundledDemo: boolean) {
  const approvedResourceOrigins = new Map<string, Promise<URL>>();
  let blockedNavigationError: AppError | null = null;
  let navigationRequests = 0;

  await context.route("**/*", async (route) => {
    const request = route.request();
    let requestedUrl: URL;
    try {
      requestedUrl = new URL(request.url());
    } catch {
      await route.abort("blockedbyclient");
      return;
    }

    if (["about:", "blob:", "data:"].includes(requestedUrl.protocol)) {
      await route.continue();
      return;
    }
    if (!["http:", "https:"].includes(requestedUrl.protocol)) {
      await route.abort("blockedbyclient");
      return;
    }

    const isMainNavigation = request.isNavigationRequest() && request.frame() === page.mainFrame();
    try {
      if (isMainNavigation) {
        navigationRequests += 1;
        if (navigationRequests > MAX_REDIRECTS + 1) {
          throw scannerError("The website redirected too many times.", "TOO_MANY_REDIRECTS", 422, false);
        }
        // A fresh DNS check for every main-frame redirect prevents redirect-based SSRF.
        await validateTargetUrl(request.url(), bundledDemo);
      } else {
        const key = requestedUrl.origin;
        let validation = approvedResourceOrigins.get(key);
        if (!validation) {
          validation = validateTargetUrl(request.url(), bundledDemo);
          approvedResourceOrigins.set(key, validation);
        }
        await validation;
      }
      await route.continue();
    } catch (error) {
      if (isMainNavigation) blockedNavigationError = normalizeScannerError(error);
      await route.abort("blockedbyclient");
    }
  });

  return () => blockedNavigationError;
}

export async function scanPage(input: ScanPageInput): Promise<ScannerResult> {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let abortPage: (() => void) | null = null;

  try {
    if (input.signal?.aborted) {
      throw new AppError("SCAN_FAILED", "The scan was cancelled.", 409, {
        reason: "SCAN_CANCELLED",
        retryable: true,
      });
    }

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: VIEWPORT,
      acceptDownloads: false,
      serviceWorkers: "block",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
    page.setDefaultTimeout(5_000);
    page.on("dialog", (dialog) => void dialog.dismiss().catch(() => undefined));

    const blockedNavigation = await configureNetworkPolicy(context, page, input.bundledDemo);
    abortPage = () => void page.close().catch(() => undefined);
    input.signal?.addEventListener("abort", abortPage, { once: true });

    let response: PlaywrightResponse | null;
    try {
      response = await page.goto(input.targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
    } catch (error) {
      const policyError = blockedNavigation();
      if (policyError) throw policyError;
      throw error;
    }

    const httpStatus = assertUsableResponse(response);
    // Revalidate the final URL after redirects, independently of request interception.
    await validateTargetUrl(page.url(), input.bundledDemo);
    await waitForStablePage(page);

    const title = (await page.title()).slice(0, 500);
    const screenshot = await captureScreenshot(page, input.scanId);
    await input.onStage?.({
      stage: "EXPLORATION_COMPLETED",
      metadata: {
        pageUrl: page.url(),
        title,
        httpStatus,
        screenshotPath: screenshot.storagePath,
        screenshotTruncated: screenshot.screenshotTruncated,
      },
    });

    await input.onStage?.({ stage: "AUDIT_STARTED" });
    // Inject the pinned local axe bundle as trusted in-memory content. Loading it by
    // file URL would be correctly blocked by the page network policy.
    try {
      await page.addScriptTag({ content: await loadAxeSource() });
    } catch {
      throw scannerError(
        "The page loaded, but the accessibility engine could not be initialized. Try the scan again.",
        "AUDIT_INITIALIZATION_FAILED",
        502,
        true,
        "SCAN_FAILED",
      );
    }

    let audit: AxeResult;
    try {
      audit = (await withTimeout(
        page.evaluate(async () =>
          (globalThis as unknown as { axe: { run(): Promise<unknown> } }).axe.run(),
        ),
        AUDIT_TIMEOUT_MS,
        scannerError(
          "The page loaded, but accessibility analysis took too long. Try the scan again.",
          "AUDIT_TIMEOUT",
          504,
        ),
      )) as AxeResult;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw scannerError(
        "The page loaded, but its accessibility analysis could not finish. Try the scan again.",
        "AUDIT_EXECUTION_FAILED",
        502,
        true,
        "SCAN_FAILED",
      );
    }

    await input.onStage?.({ stage: "PROCESSING_RESULTS" });
    const pendingIssues = audit.violations.flatMap((violation) =>
      violation.nodes.map((node) => ({ violation, node, selector: axeSelector(node.target) })),
    ).slice(0, MAX_AFFECTED_ELEMENTS);
    const issues: ScannedIssue[] = [];

    for (let offset = 0; offset < pendingIssues.length; offset += EVIDENCE_BATCH_SIZE) {
      const batch = pendingIssues.slice(offset, offset + EVIDENCE_BATCH_SIZE);
      const scannedBatch = await Promise.all(
        batch.map(async ({ violation, node, selector }) => {
          const evidence = selector
            ? await elementEvidence(page, selector, input.bundledDemo)
            : { boundingBox: null, source: null };
          return {
            ruleId: violation.id,
            title: violation.help,
            description: violation.description,
            helpText: violation.help,
            helpUrl: violation.helpUrl,
            impact: normalizeImpact(node.impact ?? violation.impact),
            selector,
            htmlSnippet: node.html.slice(0, 4_000),
            failureSummary: node.failureSummary?.slice(0, 4_000) ?? "",
            pageUrl: page.url(),
            ...evidence,
          } satisfies ScannedIssue;
        }),
      );
      issues.push(...scannedBatch);
    }

    const score = calculateAccessibilityScore(issues.map((issue) => issue.impact));
    await input.onStage?.({ stage: "AUDIT_COMPLETED", metadata: { issueCount: issues.length, score } });

    return {
      pageUrl: page.url(),
      title,
      httpStatus,
      score,
      screenshotPath: screenshot.storagePath,
      screenshotTruncated: screenshot.screenshotTruncated,
      viewport: VIEWPORT,
      issues,
      scannedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw normalizeScannerError(error);
  } finally {
    if (abortPage) input.signal?.removeEventListener("abort", abortPage);
    await context?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
  }
}
