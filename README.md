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

External websites are audit-only. Only NovaMart may participate in source mapping and human-approved repair workflows.

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

## Current status

The repository currently contains the monorepo and database foundation. Features not yet implemented are not presented as working: browser scanning, source mapping, repair application, evaluation, and the premium UI remain later build phases.
