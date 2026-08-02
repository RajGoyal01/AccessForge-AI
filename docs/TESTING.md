# Testing

Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` from the repository root. Playwright Chromium must be installed with `npm exec -w @accessforge/platform playwright install chromium` for real scans.

The unit suite covers validation, scoring, path traversal, exact replacement, hashing and scan comparison. The verified golden flow uses the real API, browser, axe, SQLite, source mapping, backup, validation commands and rescan. A final Chromium smoke pass covered every application route, and axe reported zero violations on the landing, dashboard, projects, scan, repair and evaluation views.

Tests use deterministic repair recipes and do not call paid AI services. Expanded cross-browser, high-concurrency and manual screen-reader testing remain follow-up work.
