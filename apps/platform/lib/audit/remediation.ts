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

const familyAdvice: Array<{ matches: RegExp; advice: RemediationAdvice }> = [
  {
    matches: /(^aria-|aria$|role|duplicate-id-aria)/,
    advice: {
      category: "ARIA and assistive technology",
      effort: "Medium",
      recommendedChange: "Prefer the equivalent native HTML element; where ARIA is necessary, use a valid role and only supported states and properties with references that resolve to elements on the page.",
      whyItMatters: "Invalid or incomplete accessibility semantics can expose the wrong name, role, state, or relationship to assistive technologies.",
      validationSteps: ["Inspect the computed accessibility tree", "Test the control with keyboard and a screen reader", "Re-run the recorded axe rule"],
    },
  },
  {
    matches: /(label|form|input|select|autocomplete)/,
    advice: {
      category: "Forms and validation",
      effort: "Medium",
      recommendedChange: "Give every control a persistent programmatic label, suitable input purpose, clear instructions, and an error relationship that is announced when validation fails.",
      whyItMatters: "People must be able to identify fields, understand required input, and recover from errors without relying on visual position alone.",
      validationSteps: ["Inspect each field's accessible name and description", "Submit invalid data and confirm the error is announced", "Complete the form using only a keyboard"],
    },
  },
  {
    matches: /(contrast|color|link-in-text-block)/,
    advice: {
      category: "Visual presentation",
      effort: "Small",
      recommendedChange: "Update the relevant colour and state tokens so text, controls, focus indicators, and non-text UI remain distinguishable in every interactive state.",
      whyItMatters: "Users with low vision or colour-vision differences need sufficient contrast and non-colour cues to perceive content and interaction state.",
      validationSteps: ["Measure the rendered foreground and background colours", "Check focus, hover, disabled, and error states", "Re-run the rule at desktop and mobile viewports"],
    },
  },
  {
    matches: /(image|object|svg|area-alt)/,
    advice: {
      category: "Text alternatives",
      effort: "Small",
      recommendedChange: "Provide a concise accessible alternative that communicates the asset's purpose, or explicitly hide it from assistive technology when it is decorative.",
      whyItMatters: "Non-visual users need the same meaning or function without hearing a filename, raw SVG, or empty control.",
      validationSteps: ["Confirm whether the asset is informative, functional, or decorative", "Inspect its computed accessible name", "Review the experience with images unavailable"],
    },
  },
  {
    matches: /(button|link-name|nested-interactive|tabindex|accesskey|target-size)/,
    advice: {
      category: "Keyboard and interaction",
      effort: "Medium",
      recommendedChange: "Use a native interactive element with a unique accessible name, predictable keyboard activation, visible focus, and an adequate pointer target.",
      whyItMatters: "Keyboard, switch, screen-reader, and voice-control users rely on consistent control semantics and activation behavior.",
      validationSteps: ["Reach and identify the control using Tab and Shift+Tab", "Activate it using the expected keyboard keys", "Inspect its accessible name, role, state, and target size"],
    },
  },
  {
    matches: /(heading|title|lang|meta-viewport|meta-refresh)/,
    advice: {
      category: "Document structure",
      effort: "Small",
      recommendedChange: "Correct the document metadata and semantic outline so the page has a descriptive title, valid language, usable viewport, and logical heading sequence.",
      whyItMatters: "Reliable document structure helps users orient themselves, choose the correct pronunciation rules, and navigate content efficiently.",
      validationSteps: ["Review the page title, language, and viewport metadata", "Inspect the heading outline without considering visual size", "Navigate the page by headings with assistive technology"],
    },
  },
  {
    matches: /(landmark|region|bypass|skip-link)/,
    advice: {
      category: "Landmarks and navigation",
      effort: "Medium",
      recommendedChange: "Organize visible content into a clear set of native landmarks and provide a working way to bypass repeated navigation.",
      whyItMatters: "Landmarks and bypass links let keyboard and screen-reader users reach the primary content without traversing repeated controls.",
      validationSteps: ["Review the landmark list and ensure labels are unique", "Activate the skip link and verify focus placement", "Navigate the page using landmarks only"],
    },
  },
  {
    matches: /(table|td-|th-|scope-|caption)/,
    advice: {
      category: "Data tables",
      effort: "Medium",
      recommendedChange: "Use native table structure with a descriptive caption and correctly scoped headers that identify every data cell.",
      whyItMatters: "Screen readers require explicit row and column relationships to communicate tabular information meaningfully.",
      validationSteps: ["Inspect the table header relationships", "Navigate cell by cell with a screen reader", "Confirm layout-only content is not exposed as a data table"],
    },
  },
  {
    matches: /(^list$|listitem|definition-list|dlitem)/,
    advice: {
      category: "Lists and grouping",
      effort: "Small",
      recommendedChange: "Use native list containers and valid list children so related items are exposed as one meaningful group.",
      whyItMatters: "Correct grouping announces the number and structure of related items and improves navigation for assistive-technology users.",
      validationSteps: ["Inspect the rendered list semantics", "Confirm every item has the correct parent container", "Navigate into and out of the list with a screen reader"],
    },
  },
  {
    matches: /(audio|video|caption|marquee|blink)/,
    advice: {
      category: "Media and motion",
      effort: "Large",
      recommendedChange: "Provide equivalent captions or transcripts and ensure animated, blinking, or automatically playing content can be paused or reduced.",
      whyItMatters: "People who cannot hear media or who are sensitive to motion need an equivalent and controllable experience.",
      validationSteps: ["Review captions or transcripts against the media", "Test pause and reduced-motion behavior", "Verify controls are named and keyboard operable"],
    },
  },
];

export function getRemediationAdvice(ruleId: string): RemediationAdvice {
  const normalizedRuleId = ruleId.trim().toLowerCase();
  return ruleAdvice[normalizedRuleId] ?? familyAdvice.find(({ matches }) => matches.test(normalizedRuleId))?.advice ?? {
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
