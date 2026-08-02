# Product Specification

AccessForge AI turns accessibility findings into reviewable code fixes and measurable outcomes. The bundled NovaMart demo supports the complete workflow; external websites are audit-only.

## MVP journey

1. Create a bundled-demo or external-audit project.
2. Explore the target with Playwright, run axe-core, and capture screenshots.
3. Inspect normalized issues with visual evidence.
4. For NovaMart only, map an issue to source and generate a proposal.
5. Human-review the exact change, then back up and apply it.
6. Run predefined validation, rescan, compare, and roll back if needed.

## Product boundaries

- No authentication or production deployment in the hackathon MVP.
- No source access or modification for external websites.
- No model-generated command execution.
- Automated checks and scores do not certify WCAG conformance.
