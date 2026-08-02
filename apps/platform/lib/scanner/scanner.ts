import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { AppError } from "@/lib/errors";
import { createScreenshotPath } from "@/lib/storage";
import { calculateAccessibilityScore } from "./scoring";
import type { NormalizedImpact, ScannerResult, ScannedIssue } from "./types";

const VIEWPORT = { width: 1440, height: 900 };
interface AxeNode { target: unknown[]; impact?: string | null; html: string; failureSummary?: string }
interface AxeViolation { id: string; help: string; description: string; helpUrl: string; impact?: string | null; nodes: AxeNode[] }
interface AxeResult { violations: AxeViolation[] }
const normalizeImpact = (impact: string | null | undefined): NormalizedImpact => (["critical", "serious", "moderate", "minor"].includes(impact ?? "") ? impact as NormalizedImpact : "unknown");

async function elementEvidence(page: Page, selector: string) {
  try {
    const locator = page.locator(selector).first();
    if (await locator.count() === 0) return { boundingBox: null, source: null };
    const box = await locator.boundingBox();
    const metadata = await locator.evaluate(element => ({ file: element.getAttribute("data-source-file"), line: element.getAttribute("data-source-line"), component: element.getAttribute("data-component-name") }));
    return { boundingBox: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null, source: metadata.file ? { file: metadata.file, line: metadata.line ? Number(metadata.line) : null, component: metadata.component } : null };
  } catch { return { boundingBox: null, source: null }; }
}

export async function scanPage(input: { scanId: string; targetUrl: string; signal?: AbortSignal }): Promise<ScannerResult> {
  let browser: Browser | null = null;
  try {
    if (input.signal?.aborted) throw new AppError("SCAN_FAILED", "Scan was cancelled.", 409);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: VIEWPORT, acceptDownloads: false });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(20_000);
    await page.goto(input.targetUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
    const title = await page.title();
    const axePath = path.resolve(process.cwd(), "../../node_modules/axe-core/axe.min.js");
    await page.addScriptTag({ content: await readFile(axePath, "utf8") });
    const audit = await page.evaluate(async () => (globalThis as unknown as { axe: { run(): Promise<unknown> } }).axe.run()) as AxeResult;
    const issues: ScannedIssue[] = [];
    for (const violation of audit.violations) for (const node of violation.nodes) {
      const selector = String(node.target[0] ?? "");
      const evidence = selector ? await elementEvidence(page, selector) : { boundingBox: null, source: null };
      issues.push({ ruleId: violation.id, title: violation.help, description: violation.description, helpText: violation.help, helpUrl: violation.helpUrl, impact: normalizeImpact(node.impact ?? violation.impact), selector, htmlSnippet: node.html.slice(0, 4000), failureSummary: node.failureSummary?.slice(0, 4000) ?? "", pageUrl: page.url(), ...evidence });
    }
    const screenshot = await createScreenshotPath(input.scanId);
    await page.screenshot({ path: screenshot.absolutePath, fullPage: true, animations: "disabled", timeout: 15_000 });
    return { pageUrl: page.url(), title, score: calculateAccessibilityScore(issues.map(issue => issue.impact)), screenshotPath: screenshot.storagePath, viewport: VIEWPORT, issues, scannedAt: new Date().toISOString() };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("SCAN_FAILED", error instanceof Error ? `Browser scan failed: ${error.message}` : "Browser scan failed.", 500);
  } finally { await browser?.close().catch(() => undefined); }
}
