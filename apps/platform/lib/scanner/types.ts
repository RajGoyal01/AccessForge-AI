export type NormalizedImpact = "critical" | "serious" | "moderate" | "minor" | "unknown";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScannedIssue {
  ruleId: string;
  title: string;
  description: string;
  helpText: string;
  helpUrl: string;
  impact: NormalizedImpact;
  selector: string;
  htmlSnippet: string;
  failureSummary: string;
  pageUrl: string;
  boundingBox: BoundingBox | null;
  source: { file: string; line: number | null; component: string | null } | null;
}

export interface ScannerResult {
  pageUrl: string;
  title: string;
  httpStatus: number;
  score: number;
  screenshotPath: string;
  screenshotTruncated: boolean;
  viewport: { width: number; height: number };
  issues: ScannedIssue[];
  scannedAt: string;
}

export type ScannerStageEvent =
  | {
      stage: "EXPLORATION_COMPLETED";
      metadata: {
        pageUrl: string;
        title: string;
        httpStatus: number;
        screenshotPath: string;
        screenshotTruncated: boolean;
      };
    }
  | { stage: "AUDIT_STARTED" }
  | { stage: "AUDIT_COMPLETED"; metadata: { issueCount: number; score: number } }
  | { stage: "PROCESSING_RESULTS" };
