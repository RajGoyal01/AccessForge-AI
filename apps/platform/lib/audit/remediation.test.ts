import { describe, expect, it } from "vitest";
import { buildAuditAnalysis, getRemediationAdvice } from "./remediation";

describe("audit remediation", () => {
  it("returns deterministic rule-specific guidance", () => {
    expect(getRemediationAdvice("image-alt").category).toBe("Text alternatives");
    expect(getRemediationAdvice("unknown-rule").validationSteps).toHaveLength(3);
  });

  it("builds analysis only from supplied findings", () => {
    const analysis = buildAuditAnalysis([
      { id: "1", ruleId: "link-name", title: "Link name", impact: "SERIOUS", selector: "a", description: "", helpUrl: null },
      { id: "2", ruleId: "color-contrast", title: "Contrast", impact: "CRITICAL", selector: "button", description: "", helpUrl: null },
    ], 61);
    expect(analysis.healthBand).toBe("High risk");
    expect(analysis.severities.critical).toBe(1);
    expect(analysis.priorityIssues[0]?.id).toBe("2");
  });
});

