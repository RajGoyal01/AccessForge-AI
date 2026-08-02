import type { NormalizedImpact } from "./types";
export const IMPACT_WEIGHTS: Record<NormalizedImpact, number> = { critical: 25, serious: 10, moderate: 5, minor: 2, unknown: 1 };
export function calculateAccessibilityScore(impacts: NormalizedImpact[]) { return Math.max(0, Math.min(100, 100 - impacts.reduce((sum, impact) => sum + IMPACT_WEIGHTS[impact], 0))); }
