# Workspace Module Blueprint — Professional Global Accounting Skeleton

Status: target architecture for the isolated preview. This is a specification and implementation checklist; a listed capability is not considered operational until its page, service, permissions, tests and audit trail are implemented and verified.

## Product principle

Hesab Sarraf is a configurable accounting and financial-management workspace, not merely a currency-exchange transaction form. It must serve a small single-cashier exchange office as well as a multi-branch, multi-entity operation. Each tenant activates only the modules it needs, while shared accounting controls remain consistent.

## Standard internal structure required in every module

Every navigation icon opens a complete module workspace with the following areas, where applicable:

1. **Overview** — purpose, key balances/KPIs, period and entity context, alerts, pending work and recent activity.
2. **Registers** — searchable, filterable, paginated master records with create/view/edit/archive governed by permission.
3. **Operations** — guided workflows for the module's real business events; draft, review, approval, posting and reversal states are explicit.
4. **Work queues** — pending, rejected, overdue, exception and approval tasks with owner and due date.
5. **Statements and history** — immutable event history, source-document links, attachments and drill-down to journal lines.
6. **Reconciliation and controls** — validation, matching, exception resolution, limits, segregation of duties and period controls.
7. **Reports and analytics** — operational and financial reports, filters, comparison periods, export/print and drill-through.
8. **Configuration** — numbering, policies, currencies, thresholds, templates, mappings and module-specific defaults.
9. **Access and audit** — role/permission matrix, approval policy, actor/time/device context, and traceable configuration changes.

Not every module needs nine visible tabs. The module must expose only relevant functions, but must not omit controls, history, reports or configuration that are essential to its domain.

## Shared page contract

- Persistent page identity: module name, purpose, current legal entity/branch, financial period, active currency context and last refresh.
- Consistent command bar: primary action, secondary actions, search, filters, export and help.
- Responsive layout: desktop navigation + data tables; mobile cards, compact filters and action sheets; no horizontal overflow for essential workflows.
- Every data view has loading, empty, error, permission-denied and stale/offline states.
- Every operation declares required fields, validation, duplicate protection, confirmation, authorization, document number, posting result and recovery path.
- Never show a button that silently does nothing. Unimplemented actions must be visibly marked as planned/under construction and must not imply that a transaction has been saved.
- Financial totals are currency-aware. Do not add unlike currencies without a defined reporting currency and valuation method.
- No hard deletion of posted financial history. Correct posted activity with linked reversal/replacement documents.
- Module visibility is not authorization. Routes and server-side policies enforce permissions independently of navigation.

## Cash module — required professional structure

The Cash workspace is divided into:

- **Overview:** total cash position by currency and location; opening/current/available balance; daily inflow/outflow; pending approvals; unreconciled amount; latest movements.
- **Cashboxes and vaults:** cashbox register, location, currency, status, opening balance, assigned custodian, allowed denominations, min/max thresholds and linked ledger account.
- **Cash receipts:** source, payer, customer/counterparty, currency, amount, exchange rate if relevant, fee, reference, attachments, cashier and receipt number.
- **Cash payments:** beneficiary, purpose, payment method, authorization, available-balance check, supporting documents and payment voucher.
- **Internal transfers:** cashbox-to-cashbox, cashbox-to-bank, vault-to-teller and branch transfers; source/destination, in-transit state where relevant, dual acknowledgement and balanced posting.
- **Cashier and shift management:** cashier identity, assigned cashboxes, opening float, shift start/end, handover, counted cash, expected cash and supervisor sign-off.
- **Cash count and reconciliation:** denomination count, book balance, counted balance, variance, reason code, investigation, approved adjustment and locked reconciliation record.
- **Cash limits and controls:** transaction ceilings, dual control, restricted hours, negative-balance prevention, approval thresholds and separation of duties.
- **Cash reports:** cash position, daily cashbook, receipts/payments, cashbox statement, cashier shift, transfer register, variance and liquidity forecast.
- **Cash configuration:** cashbox numbering, receipt/voucher numbering, supported currencies, denominations, posting mappings, business-day calendar and approval rules.

Cash accounting invariants:
- Every receipt/payment/transfer creates a source document and balanced ledger posting when posted.
- A transfer reduces the source and increases the destination; it must never create or destroy cash.
- Cashbox balance, cash-control ledger and treasury position must reconcile by currency and entity.
- Opening balances are traceable to approved opening documents; they are not silently overwritten.
- A cashier cannot approve their own restricted adjustment when segregation-of-duties policy forbids it.
- Reversal preserves the original document and links the correcting entry.

## Module-specific skeletons

| Module | Required internal areas and specialist workflows |
|---|---|
| Dashboard | Entity/branch context; financial KPIs; liquidity by currency; pending work; daily operations; alerts; drill-through to source records |
| Customers | Customer register; individuals/businesses; KYC profile; contacts; documents; risk/credit limits; balances; statement; receivables/payables; notes; lifecycle |
| Customer detail | Identity and contact; compliance; account balances by currency; transaction history; invoices/receipts; credit; communication; audit |
| Customer debts | Aging buckets; due/overdue items; payment allocation; reminders; dispute/collection status; write-off approval |
| Exchange / trade | Buy/sell ticket; customer/counterparty; currency pair; bid/ask/deal rate; rate source/time; spread/fee; quote expiry; cash settlement; journal preview; confirmation; cancellation/reversal |
| Currency conversion | Source/destination amounts; rate and source; rounding; fees; gain/loss; quote; confirmation; settlement and accounting trace |
| Currency master and rates | ISO code; precision; active status; base/reporting currencies; rate sources; buy/sell rates; effective time; rate history; rate approvals; stale-rate alerts |
| Cash | Cashboxes/vaults; receipts; payments; transfers; cashier shifts; cash count; reconciliation; limits; reports; configuration |
| Bank | Bank/account register; currency; deposits; withdrawals; transfers; statements; bank fees; imported statement matching; reconciliation; signatories; reports |
| Treasury | Consolidated liquidity; cash and bank positions; cash forecasts; funding needs; inter-branch liquidity; limits; treasury transfers; maturity and settlement calendar |
| Remittance send | Sender/beneficiary; destination/correspondent; payout method; principal/fee/FX; compliance checks; tracking number; approvals; dispatch; status timeline |
| Remittance receive | Incoming instruction; identity match; beneficiary verification; payout; partial/failed payout; proof of delivery; settlement and reconciliation |
| Remittance book | Unified remittance register; search/tracking; statuses; correspondent balances; fees; settlement batches; exceptions; aging and reports |
| Accounting journal entry | Header; posting date/period; source; debit/credit lines; account/subledger; currency/rate; branch/cost center; attachments; validation; approval; posting; reversal |
| Journal | Posted/draft register; source filters; document drill-down; debit/credit totals; period lock; reversal links; export |
| General ledger | Account tree; opening/debit/credit/closing balances; drill-down to journal and source document; currency/entity/branch filters |
| Chart of accounts | Multi-level account tree; account type/nature; control accounts; posting restrictions; currency policy; effective dates; version history |
| Subsidiary ledger | Customer/vendor/branch/cashbox dimensions; open items; allocations; aging; account statement; reconciliation to control account |
| Trial balance | Opening/movement/closing; debit-credit balance; account levels; branch/entity/currency; period comparison; imbalance diagnostics |
| Financial statements | Balance sheet; profit and loss; cash flow; equity; notes; reporting currency; comparative periods; consolidation; export |
| Reconciliation | Matching rules; statement import; unmatched items; partial matches; tolerances; variance reasons; reviewer approval; final lock |
| Reports | Report catalog; saved filters; date/entity/branch/currency dimensions; drill-down; scheduled output; PDF/Excel/CSV; access policy |
| Profit and loss | Revenue/expense mapping; realized FX; fees/spread; branch/product/customer profitability; comparative period; drill-down |
| Receivables/payables | Counterparty open items; invoices; due dates; allocations; aging; settlement; disputes; credit terms; control-account reconciliation |
| Fiscal periods | Fiscal calendar; period open/close; adjustment windows; locks; opening balances; carry-forward; audit |
| Period close | Close checklist; unposted documents; reconciliation status; FX revaluation; accruals; approvals; closing journals; controlled reopen |
| Cost centers | Cost/profit center hierarchy; allocations; budgets; actuals; variance; branch/desk/employee profitability |
| Budgets and forecasts | Versioned budgets; scenarios; assumptions; approvals; cash forecast; actual vs budget; variance analysis |
| Fixed assets | Asset register; acquisition; category; location/custodian; depreciation; impairment; transfer/disposal; ledger reconciliation |
| Multi-company and branches | Legal entities; branches; books; functional currency; intercompany rules; consolidated reporting; data isolation |
| Inter-exchange accounts | Correspondent register; bilateral balances; settlement instructions; fee/rate agreements; confirmation; matching; disputes |
| KYC / AML / compliance | Risk profile; identity checks; document expiry; screening cases; review queue; decisions/reasons; escalation; restricted access; audit |
| Approvals | Policy designer; amount/role thresholds; sequential/parallel approval; delegation; self-approval prevention; SLA; rejected/recalled work |
| Audit log | Searchable immutable events; actor/action/object; before/after diff; timestamp; source device/session; export under permission |
| Document center | Document register; type/version; links to customer/source/journal; retention; access; expiry; search; download audit |
| Tax and standards | Country tax profile; jurisdiction; tax codes; account mapping; reporting framework; versioned rules; filing periods; review trail |
| FX exposure/revaluation | Net open position; valuation rates; rate timestamp/source; unrealized/realized gain-loss; scenarios; approval; revaluation journal |
| Consolidation | Entity mapping; intercompany elimination; translation; minority interest where applicable; consolidated statements; audit |
| Internal controls/data governance | Risk-control matrix; access reviews; retention; privacy requests; data classification; exception register; control testing |
| Agents and agency network | Agent register; contracts; limits; commission; branch/territory; settlement; performance; access and audit |
| Digital products/payment gateway | Catalog; providers; pricing; availability; order lifecycle; seller acceptance; fulfillment; refunds; settlement; commissions; provider reconciliation |
| Customer workspace | Personal account; wallet/statement; transfers; orders; requests; messages; profile/security; support; privacy and consent |
| Seller workspace | Service catalog; incoming requests; accept/reject; fulfillment; proof; settlement; commissions; disputes |
| Backup and recovery | Backup schedule; scope; encryption; retention; integrity checks; restore rehearsal; recovery approval; audit |
| Assistant and support | Context-scoped help; searchable knowledge; voice input/output; suggestions; explicit confirmation before any financial action; support ticket tracking |
| Builder/platform administration | Tenant provisioning; plan/entitlements; module catalog; role templates; feature rollout; platform audit; release health; backup controls |

## Dependency and configuration model

- Modules declare prerequisites (for example, Cash depends on Currency, Document Numbering, Posting Engine, Chart of Accounts and Audit).
- A tenant may choose a simple starter package or an advanced enterprise package; optional modules can be enabled later.
- Disabling a module hides entry points and prevents new operations according to policy. It never deletes data, posted journals, balances, documents or audit history.
- A module cannot be disabled if it is the only control path for an unresolved accounting dependency; show impact and require a controlled migration/approval.
- Country, language, calendar, timezone, number/date format, base currency, functional currency, reporting currency and rounding policy are tenant settings—not hard-coded assumptions.

## Implementation status rule

A blueprint entry is not proof of implementation. Track each capability independently as:
- Planned — defined in architecture only.
- UI skeleton — visible page/navigation, not connected to real workflow.
- Connected — service/data integration exists in preview.
- Controlled — permissions, validation, audit and error handling are implemented.
- Verified — automated tests and end-to-end scenario pass.

No production readiness claim is allowed until tenant isolation, authorization, accounting invariants, backup/restore, reconciliation and operational tests are independently verified.
