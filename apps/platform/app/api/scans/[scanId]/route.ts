import { db } from "@/lib/db/client";
import { AppError, errorResponse } from "@/lib/errors";
import { buildAuditAnalysis, getRemediationAdvice } from "@/lib/audit/remediation";

export async function GET(request: Request, { params }: { params: Promise<{ scanId: string }> }) {
  try {
    const scan = await db.scan.findUnique({ where: { id: (await params).scanId }, include: { project: true, pageScans: true, issues: { orderBy: { createdAt: "asc" } }, activityEvents: { orderBy: { createdAt: "asc" } } } });
    if (!scan) throw new AppError("NOT_FOUND", "Scan not found.", 404);
    if (new URL(request.url).searchParams.get("format") !== "report") return Response.json({ scan });
    const report = {
      schemaVersion: "1.0", generatedAt: new Date().toISOString(),
      project: { id: scan.project.id, name: scan.project.name, type: scan.project.projectType, targetUrl: scan.project.targetUrl },
      scan: { id: scan.id, status: scan.status, stage: scan.stage, score: scan.finalScore, startedAt: scan.startedAt, completedAt: scan.completedAt },
      analysis: buildAuditAnalysis(scan.issues, scan.finalScore),
      pages: scan.pageScans.map(page => ({ url: page.pageUrl, title: page.title, score: page.score })),
      findings: scan.issues.map(issue => ({ id: issue.id, ruleId: issue.ruleId, impact: issue.impact, title: issue.title, description: issue.description, selector: issue.selector, htmlSnippet: issue.htmlSnippet, failureSummary: issue.failureSummary, helpUrl: issue.helpUrl, advice: getRemediationAdvice(issue.ruleId) })),
    };
    const safeName = scan.project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "accessibility-audit";
    return Response.json(report, { headers: { "content-disposition": `attachment; filename="${safeName}-${scan.id.slice(-8)}.json"`, "cache-control": "private, no-store" } });
  } catch (error) { return errorResponse(error); }
}
