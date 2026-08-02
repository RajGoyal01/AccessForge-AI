import type {
  AGENTS, EVALUATION_STATUSES, EVENT_STATUSES, ISSUE_IMPACTS, ISSUE_STATUSES,
  PROJECT_STATUSES, PROJECT_TYPES, REPAIR_STATUSES, RISK_LEVELS, SCAN_STAGES, SCAN_STATUSES,
} from "./constants";

export type ProjectType = (typeof PROJECT_TYPES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ScanStatus = (typeof SCAN_STATUSES)[number];
export type ScanStage = (typeof SCAN_STAGES)[number];
export type IssueImpact = (typeof ISSUE_IMPACTS)[number];
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export type RepairStatus = (typeof REPAIR_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];
export type AgentName = (typeof AGENTS)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface BoundingBox { x: number; y: number; width: number; height: number }
