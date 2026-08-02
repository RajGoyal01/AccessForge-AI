export type AuditIssueInput = {
  id: string;
  ruleId: string;
  title: string;
  impact: string | null;
  selector: string;
  description: string;
  helpUrl: string | null;
};

export type RemediationAdvice = {
  category: string;
  effort: "Small" | "Medium" | "Large";
  recommendedChange: string;
  whyItMatters: string;
  validationSteps: string[];
};

const ruleAdvice: Record<string, RemediationAdvice> = {
  "color-contrast": {
    category: "Visual presentation",
    effort: "Small",
    recommendedChange: "Adjust foreground or background design tokens until normal text reaches at least 4.5:1 and large text reaches at least 3:1.",
    whyItMatters: "Low contrast makes content difficult to perceive for people with low vision, colour-vision differences, or glare-sensitive viewing conditions.",
    validationSteps: ["Measure the rendered colour pair", "Check hover, focus and disabled states", "Re-run the contrast rule at the same viewport"],
  },
  "image-alt": {
    category: "Text alternatives",
    effort: "Small",
    recommendedChange: "Add concise alternative text that communicates the image purpose, or use an empty alt value when the image is purely decorative.",
    whyItMatters: "Screen-reader users need an equivalent description without hearing a filename or an unhelpful generic label.",
    validationSteps: ["Confirm the image purpose with the content owner", "Inspect the accessible name", "Navigate the page with images unavailable"],
  },
  "link-name": {
    category: "Names and semantics",
    effort: "Small",
    recommendedChange: "Give the link a concise accessible name using visible text or an aria-label that describes its destination.",
    whyItMatters: "People using screen readers, voice control, or link lists need to understand and activate the destination.",
    validationSteps: ["Inspect the computed accessible name", "Navigate to the link by keyboard", "Confirm the name describes the destination out of context"],
  },
  "button-name": {
    category: "Names and semantics",
    effort: "Small",
    recommendedChange: "Add visible button text or a concise accessible name that describes the action.",
    whyItMatters: "Unnamed controls are difficult or impossible to operate with screen readers and voice control.",
    validationSteps: ["Inspect the computed accessible name", "Activate with Enter and Space", "Confirm the label describes the resulting action"],
  },
  label: {
    category: "Forms",
    effort: "Small",
    recommendedChange: "Associate a persistent visible label with the form control using for/id or an equivalent native framework pattern.",
    whyItMatters: "A programmatic label explains what data is expected and enlarges the usable click target.",
    validationSteps: ["Click the label and confirm focus moves to the field", "Inspect the accessible name", "Verify errors reference the same field"],
  },
  "heading-order": {
    category: "Content structure",
    effort: "Medium",
    recommendedChange: "Restructure heading levels so they describe the visual hierarchy without skipping logical levels.",
    whyItMatters: "Heading navigation gives assistive-technology users an outline for understanding and moving through the page.",
    validationSteps: ["Review the heading outline", "Navigate by heading with a screen reader", "Confirm styling is independent of heading level"],
  },
  "html-has-lang": {
    category: "Document metadata",
    effort: "Small",
    recommendedChange: "Set the document language on the html element using a valid BCP 47 language tag.",
    whyItMatters: "Assistive technologies use document language to select pronunciation and reading rules.",
    validationSteps: ["Inspect the html lang attribute", "Confirm the value matches the page language", "Re-run the document-language rule"],
  },
  "landmark-one-main": {
    category: "Landmarks and navigation",
    effort: "Small",
    recommendedChange: "Wrap the page’s primary content in exactly one native main element, keeping repeated navigation and footer content outside it.",
    whyItMatters: "A main landmark lets screen-reader users bypass repeated content and move directly to the page’s primary purpose.",
    validationSteps: ["Confirm exactly one main landmark exists", "Navigate to main using a screen reader landmark list", "Re-run the landmark rule"],
  },
  region: {
    category: "Landmarks and navigation",
    effort: "Medium",
    recommendedChange: "Place visible page content inside meaningful native landmarks such as header, nav, main, aside or footer without creating unnecessary nested regions.",
    whyItMatters: "Landmarks provide a reliable page map for assistive-technology users and make long pages faster to navigate.",
    validationSteps: ["Review the complete landmark outline", "Confirm every visible content block belongs to a meaningful region", "Re-run axe and navigate by landmarks"],
  },
};

export function getRemediationAdvice(ruleId: string): RemediationAdvice {
  return ruleAdvice[ruleId] ?? {
    category: "Accessibility semantics",
    effort: "Medium",
    recommendedChange: "Review the affected element against the linked rule guidance and prefer a native semantic HTML correction before adding ARIA.",
    whyItMatters: "The detected condition can prevent some users from perceiving, understanding, or operating this part of the page.",
    validationSteps: ["Reproduce the issue at the recorded selector", "Apply the smallest semantic correction", "Re-run axe and complete a keyboard check"],
  };
}

const impactWeight: Record<string, number> = { CRITICAL: 4, SERIOUS: 3, MODERATE: 2, MINOR: 1 };

export function buildAuditAnalysis(issues: AuditIssueInput[], score: number | null) {
  const severities = { critical: 0, serious: 0, moderate: 0, minor: 0, unknown: 0 };
  const categories = new Map<string, number>();
  for (const issue of issues) {
    const key = issue.impact?.toLowerCase() as keyof typeof severities | undefined;
    if (key && key in severities) severities[key] += 1;
    else severities.unknown += 1;
    const category = getRemediationAdvice(issue.ruleId).category;
    categories.set(category, (categories.get(category) ?? 0) + 1);
  }
  const priorityIssues = [...issues].sort((a, b) => (impactWeight[b.impact ?? ""] ?? 0) - (impactWeight[a.impact ?? ""] ?? 0)).slice(0, 5);
  const healthBand = score === null ? "Pending" : score >= 90 ? "Strong" : score >= 70 ? "Needs attention" : score >= 40 ? "High risk" : "Critical risk";
  return {
    score,
    healthBand,
    totalAffectedElements: issues.length,
    severities,
    categories: [...categories.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    priorityIssues,
    disclaimer: "Automated findings are engineering evidence, not legal or WCAG certification.",
  };
}
