# ApplianceTrack — Session Handoff

**Date:** 2026-05-11  
**Session status:** Step 12 complete, ready to begin Step 13

---

## What This Project Is

**ApplianceTrack** — mobile-first web app for appliance repair technicians.
Covers the full job lifecycle: customer intake → scheduling on a day timeline → estimates (sent by email, approved via public link) → invoicing → payment tracking.

All data stored in **localStorage** (mock CRUD interface, designed to be swapped for a real API later). No backend. No auth for now.

Full plan: `docs/architecture.md` (FSD structure), `docs/checklist.md` (step-by-step progress), and the original plan file at `docs/plan.md` in the project root.

---

## Tech Stack (locked in)

| Layer | Choice |
|-------|--------|
| Framework | React 19 |
| Language | TypeScript 5.8 (strict mode, `noUnusedLocals`, `noUnusedParameters`) |
| Bundler | Vite 6 |
| UI | Chakra UI **v3** |
| Styling | SASS (CSS Modules `*.module.scss`) |
| State | React Context + useReducer |
| Routing | React Router v7 |
| IDs | nanoid |
| Icons | react-icons |
| Tests | Jest + React Testing Library (not yet configured) |
| Node | v20.9.0 (important: too old for create-vite@9 — use @6 if re-scaffolding) |

---

## What Is Done (Steps 1–12 ✅)

### Step 1 — Project Scaffolding + Docs
- `vite.config.ts`, `tsconfig.app.json`, `index.html`, `package.json` — all configured
- `src/app/providers/AppProvider.tsx` — ChakraProvider with Chakra v3 API
- `src/app/styles/global.scss` — CSS reset, box-sizing, `min-height: 100dvh`
- `docs/architecture.md`, `docs/checklist.md`, `docs/handoff.md`
- Verified: `npm run type-check` zero errors, dev server runs

### Step 2 — TypeScript Types
- `src/entities/customer/model/types.ts`
- `src/entities/job/model/types.ts` — includes `COMPLETED` in `JobStatus`, `scheduledAt` required, `completedAt?`, `signature?`
- `src/entities/estimate/model/types.ts` — includes `estimateNumber: string`, `approvalToken?`, `approvedBy?`
- `src/entities/invoice/model/types.ts` — `invoiceNumber` format `INV-YYYY-NNNN`
- `src/entities/line-item/model/types.ts`
- `src/shared/config/storageKeys.ts` — `STORAGE_KEYS` constants

### Step 3 — localStorage Service Layer
- `src/shared/api/storage.ts` — `getAll`, `getById`, `create`, `update`, `remove`
- `src/shared/lib/index.ts` — `nanoid`, `formatCurrency`, `formatDate`, `formatTime`, `generateInvoiceNumber`, `generateEstimateNumber`
- `src/shared/api/seed.ts` — `seedIfEmpty()` called in `main.tsx`

### Step 4 — React Context + useReducer Store
- `src/app/providers/AppProvider.tsx` — holds `customers[]`, `jobs[]`, `estimates[]`
- **All reducers are pure** — zero storage calls inside reducers
- **localStorage persistence via `useEffect`** — three effects in `AppProvider` write each slice on state change; this fixed a React StrictMode double-invoke bug that was creating duplicate records
- `src/entities/customer/model/slice.ts`
- `src/entities/job/model/slice.ts`
- `src/entities/estimate/model/slice.ts`

### Step 5 — Routing + App Shell
- `src/app/router.tsx` — all routes defined (note: file is `router.tsx`, not `app/index.tsx` as per checklist)
- `src/widgets/app-shell/ui/AppShell.tsx`
- `src/widgets/app-shell/ui/Navbar.tsx`
- `src/widgets/app-shell/ui/Sidebar.tsx`
- `src/widgets/app-shell/ui/BottomNav.tsx` — react-icons, mobile bottom nav

### Step 6 — Shared UI Components
- `src/entities/job/ui/JobStatusBadge.tsx`
- `src/entities/job/ui/PriorityBadge.tsx`
- `src/entities/estimate/ui/EstimateStatusBadge.tsx`
- `src/entities/invoice/ui/InvoiceStatusBadge.tsx`
- `src/shared/ui/EmptyState.tsx`
- `src/shared/ui/ConfirmDialog.tsx`
- `src/shared/ui/PageHeader.tsx`

### Step 7 — Dashboard Page
- `src/pages/dashboard/DashboardPage.tsx` — job counter stat cards, earnings summary, action-required jobs list

### Step 8 — Settings Page
- `src/pages/settings/SettingsPage.tsx` — Default Tax Rate field, save with timeout feedback
- `src/shared/config/settings.ts` — `getSettings()`, `saveSettings()` backed by localStorage

### Step 9 — Customer Module
- `src/pages/customers/CustomerListPage.tsx` — search by name or phone
- `src/pages/customers/CustomerFormPage.tsx`
- `src/pages/customers/CustomerDetailPage.tsx`
- `src/entities/customer/ui/CustomerCard.tsx`

### Step 10 — Job Module
- `src/entities/job/model/statusHelpers.ts` — `getNextStatus`, `getAdvanceLabel`, `isTerminal`, `canFinishJob`
- `src/widgets/job-card/ui/JobCard.tsx`
- `src/features/job-status/ui/StatusActionBar.tsx`
- `src/pages/jobs/JobListPage.tsx`
- `src/pages/jobs/JobDetailPage.tsx` — header → StatusActionBar → Invoice placeholder → EstimateWidget → Notes

### Step 11 — Timeline + Create Job Modal
- `src/widgets/timeline-grid/lib/timeUtils.ts` — `GRID_START_HOUR=0`, `GRID_END_HOUR=24`, `HOUR_HEIGHT=80`, helpers
- `src/widgets/timeline-grid/ui/DateStrip.tsx`
- `src/widgets/timeline-grid/ui/JobBlock.tsx`
- `src/widgets/timeline-grid/ui/TimelineGrid.tsx`
- `src/widgets/create-job-modal/ui/CreateJobModal.tsx`
- `src/pages/timeline/TimelinePage.tsx`

### Step 12 — Estimate Widget
- `src/entities/estimate/model/calcHelpers.ts` — `calcSubtotal`, `calcTax`, `calcTotal`
- `src/entities/estimate/model/slice.ts` — `selectEstimatesByJob` (returns **array** — multiple per job), `selectEstimateByToken`
- `src/widgets/line-item-editor/ui/LineItemRow.tsx` — editable/read-only row (description, qty, unit price, delete)
- `src/widgets/line-item-editor/ui/LineItemEditor.tsx` — row list + "Add item" button
- `src/widgets/estimate-widget/ui/EstimateWidget.tsx` — list of estimate cards; `MdAdd` icon always in header; `selectedId` + `modalOpen` decoupled state
- `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx` — Chakra v3 Dialog with `lazyMount` + `unmountOnExit`; editable line items + tax rate; Save / Send / Delete in footer; approval link shown when SENT
- `src/features/estimate-send/ui/SendEstimateButton.tsx` — generates `nanoid()` token, sets status SENT, copies approval link to clipboard
- `src/features/estimate-approve/ui/ApprovalForm.tsx` — public approve/decline form with customer name input
- `src/pages/estimates/PublicApprovalPage.tsx` — no-shell page at `/approve/:token`; looks up estimate by token via context
- Verified: `npm run type-check` zero errors, dev server runs

---

## Critical Notes for Next Session

### ⚠️ Multiple estimates per job (design change from original spec)
`selectEstimatesByJob` returns an array. Each job can have many estimates. `EstimateWidget` renders a list of estimate cards (estimateNumber + createdAt + status badge); tapping one opens `EstimateDetailModal`. The `+` (MdAdd) icon in the widget header always creates a new estimate. Estimate numbers are formatted `EST-YYYY-NNNN` using `generateEstimateNumber(estimates.length)`.

### ⚠️ Reducers are pure — all storage writes are in AppProvider useEffect
Never add `storage.create/update/remove` calls inside reducer functions — React StrictMode double-invokes reducers, which caused duplicate localStorage records. The three `useEffect` hooks in `AppProvider` are the only place state is persisted to localStorage.

### ⚠️ Chakra v3 Dialog body-style cleanup — use `lazyMount` + `unmountOnExit`
Chakra v3's `DialogRoot` (Zag.js state machine) applies `overflow: hidden` to `<body>` when a dialog opens. If the React component is unmounted without the dialog going through its proper close transition, the body styles are never removed and the page becomes unclickable. **Fix**: always add `lazyMount` and `unmountOnExit` props to every `DialogRoot`. Also decouple dialog visibility (`open` boolean state) from whether the wrapper component is in the tree — keep the wrapper mounted while an item is selected, control visibility with the `open` prop.

### ⚠️ EstimateDetailModal open/close pattern
In `EstimateWidget`, `selectedId` (which estimate) and `modalOpen` (dialog visibility) are two separate pieces of state. `closeModal()` only sets `modalOpen = false` — it never clears `selectedId`. This allows Chakra to run its close animation and cleanup before the wrapper unmounts. When reopening the same estimate, only `modalOpen` needs to change.

### ⚠️ Invoice section in JobDetailPage is still a placeholder
`JobDetailPage.tsx` has a bordered placeholder box for the Invoice section. It will be replaced in Step 13.

### ⚠️ router.tsx, not app/index.tsx
Checklist specifies `src/app/index.tsx` but the actual file is `src/app/router.tsx`. Do not rename it.

### ⚠️ Chakra UI v3 API (differs from v2)
```tsx
import { ChakraProvider } from '@chakra-ui/react'
import { system } from '@chakra-ui/react/preset'
<ChakraProvider value={system}>{children}</ChakraProvider>
```
- `ChakraProvider` takes a `value` prop, not `theme`
- `colorPalette` not `colorScheme` for colored components
- Dialog uses `DialogRoot`, `DialogPositioner`, `DialogContent`, etc. (compound components)
- Always add `lazyMount` + `unmountOnExit` to every `DialogRoot`
- Always check v3 docs — many component props changed from v2

### ⚠️ Native select pattern — do not use Chakra v3 Select
Use a plain native `<select>` with inline styles and `var(--chakra-colors-border)` for the border. Established in `JobListPage` and `CreateJobModal`.

### ⚠️ TypeScript strict mode quirks
- `noUnusedLocals` and `noUnusedParameters` are ON — unused imports = type error
- `erasableSyntaxOnly` is ON — no `const enum`, no decorators
- `noUncheckedSideEffectImports` is ON — side-effect imports must be intentional

### ⚠️ Node version constraint
- Running Node v20.9.0 — `create-vite@9` fails on this version
- If scaffolding anything new: use `npx create-vite@6`

### ⚠️ Timeline grid is full 24-hour (0–24), not 12am–12pm
`GRID_START_HOUR=0`, `GRID_END_HOUR=24`. Do not change.

### ⚠️ CreateJobModal does NOT auto-create an Invoice
`CreateJobModal` only dispatches `job/ADD`. Invoice auto-creation must be added in Step 13 when `AppProvider` gains invoice state.

---

## What Is NOT Done Yet

| Step | What | Key files |
|------|------|-----------|
| 13 | Invoice Widget | `widgets/invoice-widget/ui/InvoiceWidget.tsx`, `pages/invoices/InvoiceListPage.tsx` (replace stub), `entities/invoice/model/slice.ts`, `features/invoice-payment/ui/PaymentActionBar.tsx` — also add invoice auto-creation to `CreateJobModal` and `AppProvider` |
| 14 | CSV Export | `features/export/lib/csvExport.ts`, `features/export/ui/ExportModal.tsx` |
| 15 | Polish + Tests | Unit tests for storage, statusHelpers, calcHelpers; 375px/390px QA; touch targets ≥ 44px; empty states; error boundaries |

---

## Where to Start Next Session

**Begin Step 13 — Invoice Widget.**

0. Read `docs/plan.md` development rules and follow them
1. Run `npm run type-check` — must be zero errors before starting
2. Implement in this order:
   1. `src/entities/invoice/model/slice.ts` — pure reducer (ADD/UPDATE, no REMOVE); `selectInvoiceByJob`, `selectInvoicesByStatus`
   2. `src/app/providers/AppProvider.tsx` — add `invoices: Invoice[]` to `AppState`, wire `invoiceReducer`, add `useEffect` persistence for `STORAGE_KEYS.INVOICES`
   3. `src/widgets/create-job-modal/ui/CreateJobModal.tsx` — dispatch `invoice/ADD` alongside `job/ADD`; pre-fill with one "Inspection" line item
   4. `src/widgets/invoice-widget/ui/InvoiceWidget.tsx` — shows invoice for the job; `LineItemEditor` (editable until PAID); tax field; totals; Import from Estimate button
   5. `src/features/invoice-payment/ui/PaymentActionBar.tsx` — Mark Paid / Mark Partial buttons; advances `InvoiceStatus`
   6. `src/pages/invoices/InvoiceListPage.tsx` — replace stub; list all invoices with status filter; sorted by createdAt desc
   7. Wire `InvoiceWidget` into the Invoice placeholder section of `JobDetailPage.tsx`
   8. Overdue detection on app load: in `AppProvider` (or `main.tsx`), on mount check all invoices where status is UNPAID and createdAt is > 30 days ago, mark them OVERDUE
3. Run `npm run type-check` — zero errors
4. Verify in browser at 390px

**Key decisions for Step 13:**
- One invoice per job (unlike estimates which allow many) — `selectInvoiceByJob` returns a single invoice
- Invoice cannot be deleted (only cancelled)
- Invoice is auto-created when job is created, with a single "Inspection" line item pre-filled
- "Import from Estimate" copies line items from the most recently approved estimate
- Invoice numbers format: `INV-YYYY-NNNN` via `generateInvoiceNumber(invoices.length)`
