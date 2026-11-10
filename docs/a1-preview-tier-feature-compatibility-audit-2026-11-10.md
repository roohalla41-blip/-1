# A1 / Preview tier and feature compatibility audit
Date: 2026-11-10

## Scope and safety
Read-only source comparison of A1 `release/restore-build` and A1-Maintenance-Preview `fix/preview-core-completion-2026-11-10`, plus a CI-only adjustment on A1's isolated integration branch. No production code, live Supabase data, schema, authentication, RLS, SQL/RPC, financial records, or customer data was changed. No merge, PR, or deployment was performed.

## Executive finding
Preview's Basic / Professional / Enterprise catalogue is a useful product-planning specification, but it is not a deployable entitlement system. It combines descriptive feature lists, navigation keys, client-side workspace filtering, and local-storage tier overrides. Those mechanisms do not prove server-side authorization, persisted feature availability, complete accounting workflows, or safe financial posting.

A1 already has a different, server-backed feature-control path through `FeatureSetting`, `useFeatures()`, `FeatureGate`, and profile plan/quota fields. Preview tier code must not replace or bypass that path.

## A1 mechanisms confirmed
- `useFeatures()` reads `FeatureSetting` records from Supabase.
- A1's `visibleNavItems()` applies feature records and profile plan / paid-end fields to navigation.
- A1's `FeatureGate` uses server-provided feature status and can show disabled/updating states.
- A1's `useSarraafProfile()` retrieves the current exchange profile from the server.
- A1's financial mutations post through `ledgerApi`; financial transaction data is not the same as a browser-local workspace preference.

## Preview tier implementation findings
- Canonical keys are `basic`, `professional`, and `enterprise`; aliases `standard` and `pro` map to Professional, while `special` maps to Enterprise.
- The default tier is Basic.
- `getTierForUser()` reads Preview-only overrides and grants from localStorage when the preview-only configuration flag is set.
- Outside that preview-only branch, the tier can still be read from profile/user fields or a per-user localStorage key.
- `saveExchangeTier()` writes the selected tier to localStorage.
- `canTierAccessNavKey()` checks only whether a string appears in a tier's `navKeys`; it does not check a server authorization policy or whether the target page's backend is complete.
- Enterprise's `modules: ['all']` and extensive navigation list are catalogue declarations, not evidence of implemented modules.

## Cross-check against A1 routes and feature catalog
A1 has live route/page implementations for core operations including dashboard, customers, transfers, cash, bank, currencies, reports, journal, general ledger, journal entry, balance sheet (FeatureGate), reconciliation, conversion, online products, payment gateway (FeatureGate), wallet, and support.

However, many Preview tier keys are not represented as matching A1 feature-catalog keys or dedicated A1 routes in the inspected route table. Examples include chart of accounts, trial balance, income/expense, document center, approvals, treasury, cost centers, fiscal periods, period close, fixed assets, accounts receivable/payable, budgets, intercompany, multi-company, KYC, AML screening, FX exposure/revaluation, consolidation, internal controls, and data governance. These must be classified as planned / not yet implemented until their actual A1 pages, persistence, backend authorization, and end-to-end workflows are verified.

The A1 feature catalogue also explicitly marks some functions as updating, including balance sheet, mobile recharge, PUBG UC, and payment integrations. This guardrail must remain effective; a Preview tier listing must never make an updating or unsafe feature live.

## Tier-by-tier compatibility conclusion
### Basic
The listed core functions broadly align with existing A1 operational pages. But the catalogue includes accounting capabilities (such as chart of accounts and trial balance) whose dedicated A1 implementation was not established by the inspected route list. Do not represent every Basic bullet as production-complete solely because a related journal or ledger page exists.

### Professional
Multi-cash, treasury, approvals, document center, and broader staff / branch workflows require explicit verification. A1 has cash and bank pages and a Safe entity, but that alone does not prove multi-cash transfer controls, treasury workflow, reconciliation persistence, approval trails, or multi-branch isolation. No new entitlement should be activated from Preview metadata.

### Enterprise
The majority of advanced enterprise items are not proven present as A1 routes or complete backend workflows in this audit. They remain roadmap specifications, not releasable features. Do not expose them as active or grant access based on the Preview `modules: ['all']` declaration.

## Safe integration design recommendation
1. Keep A1's existing server-backed `FeatureSetting`, `FeatureGate`, profile plan, and authorization behavior as the authority.
2. Port only the tier descriptions and canonical labels as non-authoritative metadata after route/feature mapping is complete.
3. Create an explicit mapping table from each tier key to an existing A1 feature key, A1 route, backend capability, and verification status. Unmapped keys remain unavailable / updating.
4. Do not use localStorage tier overrides, demo grants, or Preview session logic in A1.
5. Do not change current employee permissions, builder access, payment guards, or customer access as part of tier integration.
6. Before enabling paid tiers, define server-side entitlements, effective dates, audit history, downgrade behavior, and failure-safe behavior. This requires a separate approved design and controlled database migration; none is authorized here.
7. Test that tier presentation cannot grant access to a route or financial operation that A1's server-side authorization denies.

## CI status and workflow adjustment
The previously inspected run `42887064657` is now confirmed `completed / cancelled`, with no jobs reported. It did not validate the test suite or build. The workflow's concurrency setting had `cancel-in-progress: true`, which can cancel earlier validation runs when another commit arrives in the same concurrency group. On this isolated integration branch only, it has been changed to `false` so subsequent runs queue rather than cancel an in-progress validation. This does not trigger deployment and does not modify production branches.

## Release status
NOT READY FOR PRODUCTION RELEASE.
- No Preview executable feature has been merged into A1.
- Tier entitlement mapping remains incomplete.
- CI test/build success remains unverified.
- No PR, merge, or deployment has occurred.
- No live Supabase or real financial/customer data has been changed.
