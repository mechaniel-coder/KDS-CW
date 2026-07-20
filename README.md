# KDS-CW — Kidz Dat Shr3d (KDSos) Public Website

Live at **[mechaniel-coder.github.io/KDS-CW](https://mechaniel-coder.github.io/KDS-CW/)**, served via GitHub Pages from the `main` branch, root path.

## What this is

This repo holds the **fully static** version of the KDSos public site — plain HTML/CSS/JS, no build step, no backend. It's a mirror of `current-stack/frontend` from the [`KDSos`](https://github.com/mechaniel-coder/KDSos) repo, adapted to run standalone:

- **Home / About / Mission / Story / Vision** — fully live, static content.
- **Shop** — shows the product catalog; checkout shows a "coming soon" message instead of real Stripe checkout.
- **Donate** — shows the giving form; submitting shows a "coming soon" message instead of real Stripe checkout.
- **Contact** — builds a `mailto:` link to `hello@kdsos.org` (**placeholder — replace with the org's real inbox**) instead of submitting to a server.
- **Verify / Join** — guardian membership interest form; submitting builds a `mailto:` link to `hello@kdsos.org` (same placeholder) instead of creating a real account.
- **Admin** (`admin.html`) — shows a static "dashboard unavailable" notice. There's no backend here to authenticate against or query, and this page isn't linked from the site nav.

## Why static-only

The org opted to host directly on GitHub Pages rather than stand up a separate backend host, database, and payment/email provider right now. This keeps the site fully live at zero hosting cost while those pieces are decided later.

## Bringing real backend features online later

The [`KDSos`](https://github.com/mechaniel-coder/KDSos) repo (private) contains two complete, ready-to-deploy backend options:

- `current-stack/backend/` — FastAPI + SQLite/Postgres API
- `nextjs-port/` — a unified Next.js 14 app with its own API routes

Deploying either and pointing this static frontend at it (or swapping in the pre-static version of `frontend/`) would bring real Stripe checkout, real contact/verify form storage, member accounts, and the password-protected admin dashboard online. See each stack's own README in the `KDSos` repo for setup and "before a real launch" hardening steps.

## Code knowledge graph

`graphify-out/` contains a generated code knowledge graph of the full KDSos codebase (both stacks) — open `graphify-out/graph.html` for an interactive view or `graphify-out/GRAPH_REPORT.md` for a plain-language summary.
