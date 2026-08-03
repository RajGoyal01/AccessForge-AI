# Architecture

```text
apps/platform        Next.js control plane, Prisma, agents, review UI
apps/novamart        only source tree eligible for repair
packages/shared      types, constants, Zod schemas
storage              generated screenshots, backups, reports
docs                 product and engineering guidance
```

The platform uses Prisma/SQLite and service-layer database access. The stage-based orchestrator sequences Explorer, Audit, Context, Repair, Human Approval, and Evaluation while recording real activity events. `Project.projectType` is a server-enforced capability boundary: `BUNDLED_DEMO` may reach repair stages, while `EXTERNAL_AUDIT` stops after reporting.

Artifacts remain in controlled storage; the database stores controlled relative paths. Structured entities hold queryable scan evidence. `ActivityEvent.metadata` is JSON because event payloads vary, while issue bounding boxes use explicit numeric columns.

Playwright runs in a fresh server-side browser context, injects the pinned axe-core bundle, captures screenshots and bounding boxes, then closes resources on every exit path. The URL policy normalizes public addresses, rechecks redirects and DNS results, blocks private/reserved destinations, and converts browser failures into safe, actionable responses. Scan work is queued before the HTTP response returns; the command centre polls real activity events and stops at a terminal state rather than inventing percentages.

The scan experience presents this as a multimodal evidence pipeline, not as a claim that a language model independently verified the result: browser-rendered DOM and navigation evidence, deterministic axe findings, and screenshot/coordinate context are kept visibly distinct.

Repair proposals are validated structured data. Applying one requires explicit approval, an unchanged base hash, an exact single replacement and a timestamped backup. Evaluation uses only fixed NovaMart commands before a comparable rescan and regression comparison.
