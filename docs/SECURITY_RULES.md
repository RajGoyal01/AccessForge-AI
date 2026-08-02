# Security Rules

- External websites are audit-only.
- Only the server-configured NovaMart root is repairable.
- Never trust client-supplied capabilities, roots, commands, or approval state.
- Never execute AI-generated commands.
- Validate model output and paths; reject traversal, absolute paths, symlink escapes, secrets, dependencies, generated output, and Git metadata.
- Apply proposals to disposable copies first. Canonical changes require explicit approval, backup, base/hash checks, and rollback metadata.
- Permit HTTP(S) targets only and block unsafe/private destinations and redirects.
- Keep browser contexts credential-free and close them on all exit paths.
- Keep keys server-only; redact secrets and absolute paths from prompts, logs, errors, and responses.
- Seed history must remain clearly marked `demoOnly` and must never appear as live data.
