import { z } from "zod";
import { ISSUE_IMPACTS, PROJECT_STATUSES, PROJECT_TYPES, RISK_LEVELS } from "./constants";

const optionalText = z.string().trim().max(2_000).optional().nullable();

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: optionalText,
  projectType: z.enum(PROJECT_TYPES),
  targetUrl: z.url().refine((url) => ["http:", "https:"].includes(new URL(url).protocol), "Only HTTP(S) URLs are allowed"),
  localSourceRoot: z.string().trim().max(500).optional().nullable(),
  framework: z.string().trim().max(80).optional().nullable(),
  status: z.enum(PROJECT_STATUSES).default("ACTIVE"),
}).superRefine((value, context) => {
  if (value.projectType === "BUNDLED_DEMO" && !value.localSourceRoot) {
    context.addIssue({ code: "custom", path: ["localSourceRoot"], message: "Bundled demo projects require a source root" });
  }
  if (value.projectType === "EXTERNAL_AUDIT" && value.localSourceRoot) {
    context.addIssue({ code: "custom", path: ["localSourceRoot"], message: "External audit projects cannot define a source root" });
  }
});

export const createScanSchema = z.object({ projectId: z.string().cuid() });

export const issueEvidenceSchema = z.object({
  ruleId: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(240),
  impact: z.enum(ISSUE_IMPACTS),
  selector: z.string().trim().min(1).max(4_000),
  boundingBox: z.object({ x: z.number(), y: z.number(), width: z.number().nonnegative(), height: z.number().nonnegative() }).optional(),
});

export const repairProposalSchema = z.object({
  issueId: z.string().cuid(),
  targetFile: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(1).max(4_000),
  originalCode: z.string().max(100_000),
  proposedCode: z.string().max(100_000),
  unifiedDiff: z.string().max(200_000),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(RISK_LEVELS),
  generatedBy: z.string().trim().min(1).max(120),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateScanInput = z.infer<typeof createScanSchema>;
export type RepairProposalInput = z.infer<typeof repairProposalSchema>;
