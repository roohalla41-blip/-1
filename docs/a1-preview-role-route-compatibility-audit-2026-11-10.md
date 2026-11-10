# A1 / Preview role and route compatibility audit
Date: 2026-11-10

## Scope and safety
Read-only comparison of the live A1 codebase and the isolated A1-Maintenance-Preview codebase. This audit does not modify Supabase, authentication configuration, RLS, SQL/RPC functions, customer records, financial documents, balances, or transactions. No production merge or deployment is authorized by this report.

A1 integration review branch: `integration/preview-core-2026-11-10`
A1 source baseline: `release/restore-build`
Preview source ref: `fix/preview-core-completion-2026-11-10`

## Confirmed role model
Both codebases define the roles `creator`, `admin`, `sarraaf`, `employee`, `customer`, and `user`. Preview normalizes the legacy backend role `exchange` to `sarraaf` in role-level and role-label helpers and includes an explicit legacy home route. A1 has a `normalizeRole` helper, but its route access and role helper usage must be checked consistently before any transfer.

## Route authorization differences
- A1 `src/lib/rbac.js` contains explicit route permissions and its `canAccessRoute` implementation ends with deny-by-default for unlisted routes.
- Preview `src/lib/rbac.js` differs in the route permission set and in its normalization/permission behavior. The Preview contract test explicitly expects both `user` and `customer` to access `/assistant`; this must not be copied into A1 without a deliberate policy decision.
- Preview's contract tests also expect `employee` to access `/cash` but not `/bank` or `/settings`; A1 currently permits `employee` on `/cash`, `/bank`, and `/settings`. This is a material compatibility difference for existing staff.
- Preview adds an `/enterprise` route permission and extensive enterprise navigation keys. These are not proof that each destination has complete backend persistence or accounting workflows.
- A1's `ProtectedRoute` checks authentication, optional required/allowed roles, and then calls `canAccessRoute`. `AdminRoute` separately gates the builder panel and co-creator access. Both mechanisms must be preserved and tested together.

## Release blockers before any RBAC transfer
1. Build a complete route-to-role matrix from the actual A1 `App.jsx` route declarations, including nested routes and guards.
2. Record current A1 role behavior as regression expectations before changing permissions.
3. Decide explicit policy for legacy `exchange` users and verify the backend role payloads.
4. Ensure menu visibility, route guards, feature flags, and backend authorization agree; hiding a menu item is not authorization.
5. Do not loosen A1 access based on Preview tests. Do not tighten access until the effect on existing real users is understood and approved.
6. Treat Preview-only local storage, demo session, tier override, and preview isolation code as non-transferable.

## Other compatibility findings
- Preview's workspace module toggles persist in browser localStorage. They are UI preferences, not a server-enforced permission system.
- Preview's tier catalogue and enterprise module schemas describe UI/workspace availability; they do not establish that all corresponding backend functions, database tables, accounting controls, or persistence are implemented.
- Preview's cross-currency journal-line builder is a pure helper. Its accounting assumptions and account mapping require validation against A1's actual chart of accounts and posting RPCs before use.
- A1 authentication is server-token based and uses its own cache/tenant handling. Preview's local-only authentication path must remain isolated from A1.

## CI validation correction
The first integration workflow run failed before dependency installation because the repository has no committed npm lockfile, while the workflow requested npm cache and `npm ci`. The workflow was adjusted on the integration branch to install from the existing `package.json` without generating a lockfile and still run a build-only check. This is a validation workaround, not a reproducible dependency-lock solution. A successful run is still required before release readiness can be claimed.

## Current release status
NOT READY FOR PRODUCTION RELEASE.
- No executable Preview features have been merged into A1.
- No PR has been merged.
- No production deployment has been triggered by this integration workflow.
- No Supabase or real user/financial data has been changed.
- RBAC compatibility and build validation remain open gates.
