# PolicyLens Frontend Foundation — Architecture Decision

**Status:** Frontend prototype foundation  
**Decision date:** 2026-10-13

## Context

The repository has a modular Python research/backend structure, ingestion and data-validation infrastructure, pluggable model-provider directories, ML experiments, an immutable raw-data policy, and regression tests. There is no frontend app on the existing main branch. Research artifacts must remain unchanged.

## Decision

Add an isolated `frontend/` Next.js App Router application. The frontend is a presentation client and must not import Python research modules or access research files directly. A future versioned API client will call FastAPI endpoints.

Keep the current Python package, data, experiments, result artifacts and pytest suite in place. Do not rename or migrate research code in this phase.

## Experience
- Editorial, calm, mobile-first visual language; avoid generic dashboard styling.
- DM Sans body text, Manrope display text, Lucide line icons, warm neutral background, evergreen accent and real documentary-style photos.
- Home feed: Latest, Trending, Last 24 hours, category and language filters. Server time must enforce the four-day feed window once API-backed.
- Policy detail: original source, full context, Support / Oppose / No opinion, discussion and evidence.
- Accounts: verified registration, stakeholder/occupation field, history, saved discussions and session controls.
- Admin: invitation or pre-created administrator, MFA, audit trail and isolated posting workspace.
- Accessible light/dark mode and reduced-motion support.
- Multilingual architecture must preserve Unicode and source-language metadata. Real localization and content moderation for English, French, Hindi and additional languages remain future work.

## Boundaries and security
- Current content is explicitly fictional and is not model output, annotation data or research findings.
- Authentication forms are visual placeholders until backend auth is implemented.
- Backend owns identity, permissions, rate limits, edit/delete deadlines, reaction uniqueness and result computation.
- Opaque public identifiers may reduce casual enumeration, but are not authorization.
- Use email verification, risk-based challenges, account/network rate limits, abuse reporting and moderation rather than relying on MAC addresses.
- Bound and cursor-paginate public feed queries. Add indexes, observability and load tests before claiming support for 5,000 concurrent users.
- Keep online community records separate from the academic evaluation dataset. Any research export needs provenance, PII minimization, sampling policy and explicit approval.

## Next phases
1. Install the frontend and run TypeScript/build/lint checks; separately rerun the existing Python test suite as baseline.
2. Define versioned API contracts and health/readiness endpoints.
3. Design PostgreSQL schema/migrations for users, roles, consultations, comments, stance responses, reactions, moderation/audit and source evidence.
4. Implement secure sessions, verification, invitation flow and admin MFA.
5. Implement the discussion APIs, 10-minute deletion enforcement, unique reaction constraints and shared rate limiting.
6. Add abuse monitoring, full localization, accessibility, observability and load testing.
7. Document the method separating live community activity from research model conclusions.
