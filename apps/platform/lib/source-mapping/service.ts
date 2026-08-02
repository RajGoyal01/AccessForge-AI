import { readFile, stat } from "node:fs/promises";
import { db } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import { resolveNovaMartPath } from "./safe-path";

export type SourceContextResult =
  | { available: false; message: string }
  | { available: true; component: string | null; relativePath: string; line: number; confidence: number; code: string; startLine: number };

export async function getIssueSourceContext(issueId: string): Promise<SourceContextResult> {
  const issue = await db.issue.findUnique({ where: { id: issueId }, include: { scan: { include: { project: true } } } });
  if (!issue) throw new AppError("NOT_FOUND", "Issue not found.", 404);
  if (issue.scan.project.projectType !== "BUNDLED_DEMO") return { available: false, message: "Source mapping is unavailable for external audit projects." };
  if (!issue.sourceFile) return { available: false, message: "No development source metadata was found for this element." };
  const safe = resolveNovaMartPath(issue.sourceFile);
  const fileStat = await stat(safe.absolutePath);
  if (fileStat.size > 500_000) throw new AppError("FORBIDDEN", "Source file is too large to inspect.", 403);
  const content = (await readFile(safe.absolutePath, "utf8")).replace(/(api[_-]?key|secret|token)\s*[:=]\s*['\"][^'\"]+/gi, "$1 = '[REDACTED]'");
  const lines = content.split(/\r?\n/);
  const line = Math.max(1, issue.sourceLine ?? 1);
  const start = Math.max(0, line - 6);
  return { available: true, component: issue.sourceFile, relativePath: safe.relativePath, line, confidence: issue.sourceConfidence ?? 0.9, code: lines.slice(start, Math.min(lines.length, line + 5)).join("\n"), startLine: start + 1 };
}
