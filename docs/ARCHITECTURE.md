# Architecture

```text
apps/platform        Next.js control plane, Prisma, agents, review UI
apps/novamart        only source tree eligible for repair
packages/shared      types, constants, Zod schemas
storage              generated screenshots, backups, reports
docs                 product and engineering guidance
```

The platform uses Prisma/SQLite and service-layer database access. A persisted orchestrator will sequence Explorer, Audit, Context, Repair, Human Approval, and Evaluation. `Project.projectType` is a server-enforced capability boundary: `BUNDLED_DEMO` may reach repair stages, while `EXTERNAL_AUDIT` stops after reporting.

Artifacts remain in controlled storage; the database stores controlled relative paths. Structured entities hold queryable scan evidence. `ActivityEvent.metadata` is JSON because event payloads vary, while issue bounding boxes use explicit numeric columns.
