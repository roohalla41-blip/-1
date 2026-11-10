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


## Verified source-code correction and exact route findings
A subsequent direct read of the complete A1 and Preview `rbac.js` files and A1 route declarations refines the comparison above:

- Both A1 and Preview `canAccessRoute` deny unknown/unlisted routes by default. The earlier statement that A1's unknown routes were open was incorrect and is superseded by this verified source read.
- A1 `normalizeRole` maps `exchange` only in the helper itself; A1's `getRoleLevel`, `getRoleLabel`, `getRolePanel`, `canAccessRoute`, and navigation helpers do not consistently call it. Preview normalizes role aliases in these helpers and includes `HOME_BY_ROLE.exchange`. This is a consistency gap for legacy `exchange` role values in A1; it is not evidence of an access bypass.
- A1 allows `employee` to access `/bank` and `/settings` in its route matrix. Preview removes those two permissions and its contract test asserts they are denied. Tightening these in A1 would change current staff access and therefore requires a documented policy decision and explicit approval.
- A1 and Preview both use explicit route permissions and deny unknown routes. Preview additionally defines the `/enterprise` route family and corresponding role permissions.
- A1 `App.jsx` places the main exchanger pages inside `ProtectedRoute(allowedRoles=['creator','admin','sarraaf','employee'])`; customer pages inside `ProtectedRoute(requiredRole='customer')`; builder pages inside `AdminRoute`; seller and receipt pages inside authenticated-only `ProtectedRoute` groups. The assistant route is declared outside these wrappers and is controlled by `FeatureGate`, so its actual public/feature behavior must be considered separately from the role matrix.
- A1 `AdminRoute` permits `creator` and `admin` and has a separate co-creator access lookup for builder paths. That behavior must remain intact; it is not equivalent to simply allowing every Preview role with a high numeric role level.
- A1's `FeatureGate` uses server-provided feature status and displays disabled/updating states. Preview's workspace route guard adds client-local module toggles and tier gating. Those local toggles are a presentation/workspace control and must not be mistaken for server authorization.

## Revised recommendation
Do not port the Preview RBAC file wholesale. A future narrow A1 change may centralize legacy-role normalization, but only after tests demonstrate that current A1 role behavior is preserved for all six roles, co-creators, nested customer paths, builder paths, and every route in `App.jsx`. Do not change employee permissions as part of a mechanical transfer.
