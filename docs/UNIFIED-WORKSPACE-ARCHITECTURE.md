# Unified Exchange Accounting Workspace — Structural Blueprint

Status: architecture baseline for the isolated preview only. This document defines the intended skeleton; it does not claim that every module is implemented or operationally verified.

## 1. Product boundaries and panels

- Public access: welcome, sign-in, registration, password recovery, legal notices.
- Exchanger workspace: daily operations, customer accounts, settlement, accounting, treasury, reporting and organization.
- Customer workspace: personal account, wallet/statement, requests, transfers, orders, messages and support.
- Seller/service workspace: service catalog, requests, acceptance, fulfillment and settlement.
- System builder workspace: global configuration, tenant provisioning, feature catalog, access policy, release controls and platform audit.
- Employee workspace: role-scoped operational tasks; no implicit access to owner or accounting administration.

## 2. Non-disableable system controls

The Settings destination is a protected system-control entry. It must remain visible and reachable from the primary navigation and the all-sections drawer, regardless of module visibility settings. It is not a member of any toggleable business module. The dashboard/home entry is also a protected navigation destination.

Settings owns workspace configuration, module visibility, profile, security, preferences, organization, integrations and system diagnostics. A user may hide business modules, but may not hide the control plane needed to restore them.

## 3. Business module domains

| Domain | Included capabilities |
|---|---|
| Exchange operations | Buy, sell, exchange, conversion, customer-to-customer and internal transfers |
| Customers and counterparties | Customer master, KYC profile, contacts, receivables, payables, statements and limits |
| Cash and treasury | Cashboxes, cashiers, vaults, treasury positions, cash movement and liquidity |
| Banking and settlement | Bank accounts, deposits, withdrawals, reconciliation, payment rails and settlement |
| Remittance | Send/receive, correspondent exchangers, tracking, fees, commissions and settlement |
| Accounting core | Chart of accounts, journal entries, posting rules, general ledger, subledger, trial balance and period close |
| Financial statements | Balance sheet, income statement, cash flow, equity and consolidated reporting |
| Multi-currency | Currency master, rate sources, rate history, valuation, realized/unrealized FX gain/loss |
| Organization | Legal entities, branches, desks, cashiers, accountants, teams and delegated authority |
| Risk and compliance | KYC, AML screening, sanctions review, limits, exceptions and regulatory reports |
| Governance | Approvals, segregation of duties, audit trail, document retention and data governance |
| Analytics | Operational dashboards, financial KPIs, budgets, forecasts, exposure and profitability |
| Digital services | Product catalog, mobile top-ups, digital goods, payment gateway and seller workflows |
| Communications | Notifications, internal chat, customer support and assistant experiences |
| Platform administration | Tenant lifecycle, plans, feature entitlements, configuration, backups and release status |

## 4. Accounting invariants

1. Every posted financial event must produce a balanced journal entry: total debits equal total credits in the transaction's functional currency and in the defined accounting model.
2. Posted records are immutable. Corrections use reversal and replacement entries with links to the original.
3. Draft, pending approval, posted, reversed and rejected are distinct document states.
4. Every financial document has a unique, auditable identifier and links to source operation, actor, branch, business date and timestamps.
5. Currency, exchange rate, rate source, rate timestamp, rounding policy and base/functional currency are explicit.
6. Cashbox, bank, treasury, customer, exchanger and intercompany balances reconcile to their ledger control accounts.
7. Period closing, revaluation and consolidation are controlled workflows with permissions and audit events.

## 5. Shared platform services

- Identity and authentication; role, permission and policy evaluation.
- Tenant/entity/branch context and data isolation.
- Numbering and document lifecycle.
- Double-entry posting engine and account mapping.
- Currency/rate/valuation engine.
- Approval workflow and segregation of duties.
- Audit/event log and immutable history.
- Attachments and document registry.
- Notifications and messaging.
- Search, reporting and export.
- Offline queue and deterministic synchronization (future capability; server remains authority for final document numbers).
- Backup, restore, retention and observability.

## 6. Navigation and module lifecycle

- One canonical feature key per destination; route, navigation item, permission and module membership must use the same key.
- Navigation visibility is presentation only. Route guards and server-side authorization remain mandatory.
- Disabling a module hides its entry points and prevents new use according to policy; it never deletes records, journals, balances or audit history.
- Dependencies must be explicit. A dependent module cannot be enabled unless required prerequisites are available; disabling a prerequisite must warn about dependent modules and must not silently break accounting controls.
- Settings and dashboard are protected destinations and are never controlled by module toggles.
- Every route must be classified as public, exchanger, customer, seller or builder, and receive an explicit access policy.

## 7. Release gates for the skeleton

The skeleton is not complete until:
- Every route is inventoried and assigned to a panel, domain, feature key and permission policy.
- Every navigation destination resolves to a registered route; no dead links or duplicate route identities remain.
- Every module has an owner, dependencies, enable/disable behavior and empty/loading/error states.
- All protected system controls remain reachable for every applicable role.
- Accounting-critical pages are connected to the same document, account, currency and audit concepts.
- Build, route smoke tests, role matrix tests and module-toggle tests pass.
- Preview mode cannot connect to production credentials or production financial data.

## 8. Scope and safety

This blueprint and implementation work apply only to the isolated A1-Maintenance-Preview repository. They must not modify the live A1 repository, its Supabase project, production users, financial records, authentication, policies or deployment configuration.
