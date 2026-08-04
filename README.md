# AccessForge AI

From accessibility issues to verified code fixes.

## Workspace

```text
apps/platform       platform on http://localhost:3000
apps/novamart       bundled demo target on http://localhost:3001
packages/shared     shared types, constants, and validation
storage             screenshots, backups, and reports
docs                architecture and operating guidance
```

External websites are audit-only. Only NovaMart may participate in source mapping and human-approved repair workflows. You can enter a public address with or without `https://`; the platform normalizes it server-side, rejects private or unsupported destinations, and returns an actionable result when a public site blocks browser automation.

## Setup

```powershell
npm install
Copy-Item .env.example apps/platform/.env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Verify with `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`. Reset local demo data with `npm run db:reset`.

## Implemented MVP

- Professional responsive command-centre UI and realistic NovaMart storefront
- Project management with bundled-demo and external-audit capability boundaries
- Real Playwright + axe scans, screenshots, bounding boxes, weighted score and activity events
- A cinematic, responsive scan command centre with real agent-stage updates, evidence markers and reduced-motion support
- Real public-website audit workspaces with prioritized remediation guidance and downloadable JSON analysis
- Secure NovaMart source mapping with limited context and path-traversal protection
- Deterministic demo recipes plus optional structured OpenAI proposal provider
- Human approval, SHA-256 validation, timestamped backups, exact replacement and rollback
- Fixed-command typecheck/tests, real rescan, comparison and regression detection
- Guided demo, readiness settings, scan inspector, repair review and evaluation pages
- Temporary Backend Lab: safe, expiring mock JSON endpoints for prototype frontends (no uploaded code, real database, or secrets)

Run `npm run dev`, then open [AccessForge AI](http://localhost:3000) and [NovaMart](http://localhost:3001). For the fastest demo: Projects → NovaMart → Start accessibility audit → open the cart-link issue → Generate proposal → Approve and apply → Run evaluation.

Demo mode is enabled by default and needs no API key. Set `OPENAI_API_KEY` and `OPENAI_MODEL` only when you deliberately want the optional OpenAI repair provider.

The transparent score is an engineering signal, not legal or WCAG certification. External websites remain audit-only: AccessForge suggests changes but never modifies a public website or claims access to its source.

## Temporary Backend Lab

Open `/backend-lab` to define up to six `GET` or `POST` JSON endpoints for a frontend prototype. Each endpoint is rate-limited, stored locally, and expires after 30 minutes, 1 hour, or 3 hours. This is deliberately a mock-data bridge, not a production backend: it never runs uploaded frontend code, executes commands, connects to third-party systems, or stores personal, production, or secret data.
