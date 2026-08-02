# Threat Model

Protected assets are API keys, local source, backups, screenshots and scan evidence. Trust boundaries exist at external URLs, browser page content, client requests, model output and filesystem paths.

Key mitigations include HTTP(S)-only validation, private-network blocking for external targets, isolated browsers, timeouts, fixed NovaMart source root, traversal/config/dependency restrictions, bounded file context, Zod schemas, model-output limits, exact single-occurrence replacement, file hashes, human approval, verified backups, fixed validation commands and server-derived project capabilities.

The local hackathon MVP has no authentication and should not be exposed directly to an untrusted network. SQLite and in-process orchestration are designed for one local operator, not multi-tenant production concurrency.
