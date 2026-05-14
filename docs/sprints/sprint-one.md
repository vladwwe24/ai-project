# ApplianceTrack — Sprint One Summary

**Completed:** 2026-05-11  
**Steps completed:** 15 of 15  
**Status:** All features implemented, tested, and verified in browser at 390px

---

## What We Built

**ApplianceTrack** is a mobile-first web application for appliance repair technicians. It covers the complete job lifecycle from customer intake through payment collection — all running in the browser with no backend, storing data in localStorage.

A technician opens the app on their phone, picks a day on the timeline, taps a time slot to create a job, works through the job status flow, sends a cost estimate to the customer for digital approval, converts it into an invoice, and marks it paid — all from a single app.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 19 | |
| Language | TypeScript 5.8 | strict mode, noUnusedLocals, noUnusedParameters |
| Bundler | Vite 6 | |
| UI Library | Chakra UI v3 | v3 API differs significantly from v2 |
| Styling | SASS + CSS Modules | global.scss for resets |
| State | React Context + useReducer | one combined AppProvider |
| Routing | React Router v7 | |
| IDs | nanoid | |
| Icons | react-icons | |
| Tests | Vitest + happy-dom | 29 unit tests passing |
| Node | v20.9.0 | older than some dep requirements — use create-vite@6 |

---

## Architecture: Feature Sliced Design (FSD)

The entire codebase follows FSD — a strict 6-layer hierarchy where **each layer may only import from layers below it**.

```
src/
├── app/        Layer 1 — providers, router, global styles
├── pages/      Layer 2 — full-screen route components
├── widgets/    Layer 3 — large composite UI blocks
├── features/   Layer 4 — user-action components
├── entities/   Layer 5 — data models, reducers, display badges
└── shared/     Layer 6 — utilities, storage, low-level UI
```

This means a `feature/` can use an `entity/` but never vice versa. A `widget/` can combine multiple `feature/` and `entity/` components. Pages are thin composition layers — no business logic.

---

## Step-by-Step Work Log

---

### Step 1 — Project Scaffolding

**What we did:**
Set up the Vite + React + TypeScript project from scratch. Configured all tooling, installed all dependencies, and established the FSD folder structure.

**Key decisions:**
- Used `create-vite@6` (not @9) because Node v20.9.0 is too old for the latest version
- Configured the `@/` path alias in both `vite.config.ts` and `tsconfig.app.json` so all imports across the project use `@/entities/...`, `@/shared/...` etc. rather than fragile relative paths
- TypeScript strict mode enabled from day one: `strict`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noUncheckedSideEffectImports`
- Chakra UI v3 wired in `AppProvider.tsx` using its v3 API (`<ChakraProvider value={system}>`)

**Files created:**
- `vite.config.ts`, `tsconfig.app.json`, `index.html`, `package.json`
- `src/app/providers/AppProvider.tsx` — ChakraProvider wrapper
- `src/app/styles/global.scss` — CSS reset, box-sizing, min-height: 100dvh
- `docs/architecture.md`, `docs/checklist.md`, `docs/handoff.md`

---

### Step 2 — TypeScript Types

**What we did:**
Defined all business domain types before writing any logic. These types are the single source of truth for the entire application — every reducer, selector, form, and display component derives from them.

**Entities defined:**

- **Customer** — id, name, phone, email, address, createdAt
- **Job** — id, customerId, applianceType, brand?, model?, issue, status, priority?, scheduledAt, scheduledEnd?, completedAt?, notes?, signature?, createdAt, updatedAt
- **JobStatus** — `NEW | SCHEDULED | IN_PROGRESS | WAITING_PARTS | APPROVED | INVOICED | PAID | COMPLETED | CANCELLED`
- **Estimate** — id, jobId, estimateNumber, lineItems, taxRate, status, approvalToken?, approvedBy?, approvedAt?, sentAt?, createdAt, updatedAt
- **EstimateStatus** — `DRAFT | SENT | APPROVED | REJECTED`
- **Invoice** — id, jobId, invoiceNumber, lineItems, taxRate, status, paidAt?, paidAmount?, paymentMethod?, createdAt, updatedAt
- **InvoiceStatus** — `UNPAID | PARTIAL | PAID | OVERDUE | CANCELLED`
- **LineItem** — id, description, quantity, unitPrice

**Pattern used for enums:**
TypeScript `const enum` is banned by `erasableSyntaxOnly`. We use the const-object pattern instead:
```ts
export const JobStatus = { NEW: 'NEW', SCHEDULED: 'SCHEDULED', ... } as const
export type JobStatus = typeof JobStatus[keyof typeof JobStatus]
```
This gives both runtime values (for switch statements, seed data) and compile-time type narrowing.

**Files created:**
- `src/entities/customer/model/types.ts`
- `src/entities/job/model/types.ts`
- `src/entities/estimate/model/types.ts`
- `src/entities/invoice/model/types.ts`
- `src/entities/line-item/model/types.ts`
- `src/shared/config/storageKeys.ts` — STORAGE_KEYS constants object

---

### Step 3 — localStorage Service Layer

**What we did:**
Built the data persistence layer. All reads and writes to `localStorage` go through a single service object — components never call `localStorage` directly.

**`storage.ts` API:**
```ts
storage.getAll<T>(key)            // returns T[] or []
storage.getById<T>(key, id)       // returns T | undefined
storage.create<T>(key, item)      // appends and persists
storage.update<T>(key, id, patch) // merges patch, persists
storage.remove(key, id)           // filters out and persists
```

**`lib/index.ts` utilities:**
- `nanoid()` — re-exported for ID generation
- `formatCurrency(amount)` — formats as USD using Intl.NumberFormat
- `formatDate(iso)` — formats as "May 11, 2026"
- `formatTime(iso)` — formats as "9:00 AM"
- `generateInvoiceNumber(count)` → `INV-2026-0001`
- `generateEstimateNumber(count)` → `EST-2026-0001`

**`seed.ts`:**
`seedIfEmpty()` runs on app startup. If `CUSTOMERS` key doesn't exist in localStorage, it writes two customers, two jobs, and two invoices so first-time users see a populated app rather than blank screens.

**Files created:**
- `src/shared/api/storage.ts`
- `src/shared/lib/index.ts`
- `src/shared/api/seed.ts`

---

### Step 4 — React Context + useReducer Store

**What we did:**
Built the global state management system. All four data entities (customers, jobs, estimates, invoices) live in a single `AppProvider` component using `useReducer`. Components read state via `useAppState()` and dispatch actions via `useAppDispatch()`.

**Critical architecture decision — pure reducers:**
Early implementation put `localStorage.setItem()` calls inside reducer functions. This caused duplicate records because React StrictMode double-invokes reducers in development. The fix was to make all reducers completely pure (no side effects) and move persistence to `useEffect` hooks:

```ts
useEffect(() => {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(state.customers))
}, [state.customers])
```

One `useEffect` per entity slice. Runs after every state change, never during the reducer invocation itself.

**Each slice file defines:**
- Action union type (`CustomerAction`, `JobAction`, etc.)
- Pure reducer function
- Selector functions (`selectCustomerById`, `selectJobsByCustomer`, etc.)

**Files created:**
- `src/app/providers/AppProvider.tsx` (full implementation)
- `src/entities/customer/model/slice.ts`
- `src/entities/job/model/slice.ts`
- `src/entities/estimate/model/slice.ts`
- `src/entities/invoice/model/slice.ts`

---

### Step 5 — Routing + App Shell

**What we did:**
Set up React Router v7 with all routes and built the responsive app shell — a desktop sidebar + mobile bottom navigation pattern.

**Route structure:**
```
/                    → DashboardPage
/customers           → CustomerListPage
/customers/new       → CustomerFormPage
/customers/:id       → CustomerDetailPage
/customers/:id/edit  → CustomerFormPage
/jobs                → JobListPage
/jobs/:id            → JobDetailPage
/timeline            → TimelinePage
/invoices            → InvoiceListPage
/settings            → SettingsPage
/approve/:token      → PublicApprovalPage (no shell)
```

**App shell layout:**
- Desktop (md+): fixed left sidebar with nav links
- Mobile: top navbar with app title + fixed bottom nav with 5 icons (Dashboard, Jobs, Timeline, Invoices, Customers)
- Main content area scrolls independently between the top and bottom bars
- Bottom nav uses react-icons throughout

**Files created:**
- `src/app/router.tsx`
- `src/widgets/app-shell/ui/AppShell.tsx`
- `src/widgets/app-shell/ui/Navbar.tsx`
- `src/widgets/app-shell/ui/Sidebar.tsx`
- `src/widgets/app-shell/ui/BottomNav.tsx`

---

### Step 6 — Shared UI Components

**What we did:**
Built the reusable display components that appear throughout the app. All status badges use the same const-object enum pattern as the types.

**Components built:**

- **JobStatusBadge** — color-coded Chakra Badge for each JobStatus. NEW=gray, SCHEDULED=blue, IN_PROGRESS=orange, APPROVED=green, INVOICED=purple, PAID=teal, CANCELLED=red
- **PriorityBadge** — LOW=gray, NORMAL=blue, HIGH=orange, URGENT=red
- **EstimateStatusBadge** — DRAFT=gray, SENT=blue, APPROVED=green, REJECTED=red
- **InvoiceStatusBadge** — UNPAID=orange, PARTIAL=yellow, PAID=green, OVERDUE=red, CANCELLED=gray
- **EmptyState** — centered text block for empty list states, takes `title` and optional `description`
- **ConfirmDialog** — Chakra v3 Dialog with `lazyMount + unmountOnExit` for destructive-action confirmation
- **PageHeader** — Flex with title Heading + optional `action` slot for buttons like "+ New" or "Export CSV"

**Chakra UI v3 key patterns established:**
- `colorPalette` not `colorScheme` for colored components
- All dialogs require `lazyMount` and `unmountOnExit` — without these, Zag.js leaves `overflow: hidden` on `<body>` when a dialog component unmounts mid-animation, making the page unclickable

**Files created:**
- `src/entities/job/ui/JobStatusBadge.tsx`
- `src/entities/job/ui/PriorityBadge.tsx`
- `src/entities/estimate/ui/EstimateStatusBadge.tsx`
- `src/entities/invoice/ui/InvoiceStatusBadge.tsx`
- `src/shared/ui/EmptyState.tsx`
- `src/shared/ui/ConfirmDialog.tsx`
- `src/shared/ui/PageHeader.tsx`

---

### Step 7 — Dashboard Page

**What we did:**
Built the home screen — a summary view that gives the technician an at-a-glance picture of the day and business health.

**Four stat cards:**
- **Today's Jobs** — count of jobs scheduled for today
- **Open Jobs** — count of SCHEDULED + IN_PROGRESS jobs
- **This Month** — total earned (PAID invoices where paidAt starts with current YYYY-MM)
- **Outstanding** — sum of all UNPAID + PARTIAL + OVERDUE invoices

**Action Required list:**
Jobs in APPROVED or INVOICED status shown as clickable cards that navigate to job detail. These are jobs that need the technician's attention.

**Bug fixed in Step 15:**
Original implementation read invoices from `storage.getAll()` with an empty dependency array — a stale snapshot. Fixed to use `useAppState().invoices` so marking an invoice paid immediately updates the dashboard stats.

**Files created:**
- `src/pages/dashboard/DashboardPage.tsx`

---

### Step 8 — Settings Page

**What we did:**
Built a settings screen where the technician can configure the default tax rate applied when creating new estimates and invoices.

Settings are stored separately from entities under `app_settings` in localStorage. `getSettings()` returns values with defaults (`defaultTaxRate: 8.5` for Washington state). The save button shows a 2-second "Saved!" confirmation.

**Files created:**
- `src/pages/settings/SettingsPage.tsx`
- `src/shared/config/settings.ts`

---

### Step 9 — Customer Module

**What we did:**
Built the full customer CRUD flow — list with search, create/edit form, and detail view.

**CustomerListPage:** Real-time search by name or phone using `useMemo`. EmptyState when no results.

**CustomerFormPage:** Shared between create and edit. Reads `:id` param — if present, pre-fills from context (edit mode). Dispatches `customer/ADD` or `customer/UPDATE`.

**CustomerDetailPage:** Shows customer info, all jobs for that customer filtered from context, and navigation to each job. Delete button with ConfirmDialog dispatches `customer/REMOVE`.

**Files created:**
- `src/pages/customers/CustomerListPage.tsx`
- `src/pages/customers/CustomerFormPage.tsx`
- `src/pages/customers/CustomerDetailPage.tsx`
- `src/entities/customer/ui/CustomerCard.tsx`

---

### Step 10 — Job Module

**What we did:**
Built the job list, job detail page, and the status advancement workflow.

**Status flow (`statusHelpers.ts`):**
```
NEW → SCHEDULED → IN_PROGRESS → APPROVED → INVOICED → PAID
```
- `getNextStatus(status)` — next status in flow, or null at end
- `getAdvanceLabel(status)` — button label: "Schedule", "Start Work", "Mark Approved", "Generate Invoice", "Mark Paid"
- `isTerminal(status)` — true for PAID and COMPLETED
- `canFinishJob(status)` — true for IN_PROGRESS, APPROVED, INVOICED

**StatusActionBar:** Renders the advance button + optional "Mark Complete" button. Dispatches `job/UPDATE`.

**JobListPage:** Search by appliance type, issue, brand, or customer name. Status filter dropdown. Sorted by scheduledAt descending.

**JobDetailPage:** back button → job info → StatusActionBar → InvoiceWidget → EstimateWidget → Notes textarea.

**Files created:**
- `src/entities/job/model/statusHelpers.ts`
- `src/widgets/job-card/ui/JobCard.tsx`
- `src/features/job-status/ui/StatusActionBar.tsx`
- `src/pages/jobs/JobListPage.tsx`
- `src/pages/jobs/JobDetailPage.tsx`

---

### Step 11 — Timeline + Create Job Modal

**What we did:**
Built the core scheduling interface — a full 24-hour day grid where technicians see all jobs on the schedule and tap to create new ones.

**TimelineGrid:**
- Full 24-hour grid (00:00–24:00), 80px per hour = 1920px total scrollable height
- `JobBlock` components are absolutely positioned using `top` calculated from `scheduledAt`
- Tapping a time slot opens `CreateJobModal` with that timestamp pre-filled
- `DateStrip` — horizontally scrollable day strip for the current month

**timeUtils.ts:**
- `GRID_START_HOUR = 0`, `GRID_END_HOUR = 24`, `HOUR_HEIGHT = 80`
- `isoToGridTop(iso)` — converts ISO timestamp to CSS top pixel value
- `slotToIso(date, clickY)` — converts click position to ISO timestamp
- `toDatetimeLocalValue(iso)` — converts ISO to datetime-local input format

**CreateJobModal:** Customer (native select), Appliance Type, Brand, Model, Issue, Scheduled Time. On submit dispatches `job/ADD` and `invoice/ADD` (auto-creates invoice with one "Inspection" line item).

**Native select pattern established:** All dropdowns throughout the app are plain `<select>` elements with inline styles, not Chakra's Select component.

**Files created:**
- `src/widgets/timeline-grid/lib/timeUtils.ts`
- `src/widgets/timeline-grid/ui/TimelineGrid.tsx`
- `src/widgets/timeline-grid/ui/DateStrip.tsx`
- `src/widgets/timeline-grid/ui/JobBlock.tsx`
- `src/widgets/create-job-modal/ui/CreateJobModal.tsx`
- `src/pages/timeline/TimelinePage.tsx`

---

### Step 12 — Estimate Widget

**What we did:**
Built the full estimate workflow — create a draft with line items, send to customer, customer approves or declines via a public link.

**Design change from spec:** Original plan was one estimate per job. Changed to allow multiple estimates per job. `selectEstimatesByJob` returns an array.

**LineItemEditor:**
- `LineItemRow` — editable or read-only row (description, quantity, unit price, delete)
- `LineItemEditor` — all rows + "Add item" button; read-only when estimate is not DRAFT

**EstimateWidget:** List of estimate cards on JobDetailPage. `+` button always creates a new DRAFT. Tapping a card opens `EstimateDetailModal`.

**EstimateDetailModal:** Full estimate detail. Editable when DRAFT (line items, tax rate). Save / Send / Delete in footer. Shows approval link when SENT, approval info when APPROVED, declined banner when REJECTED.

**Two-state modal pattern:**
`selectedId` (which estimate) and `modalOpen` (dialog visibility) are separate state variables. `closeModal()` only sets `modalOpen = false`, never clears `selectedId`. This lets Chakra run its close animation before the wrapper unmounts. Without this, closing a dialog mid-animation leaves `overflow: hidden` on `<body>`.

**Send flow:** `SendEstimateButton` generates a nanoid token, sets status to SENT, copies `/approve/{token}` to clipboard.

**Public approval page (`/approve/:token`):** No-shell route. Looks up estimate by token. Shows line items, totals, Approve / Decline buttons. Customer enters their name (stored in `approvedBy`).

**calcHelpers.ts:**
- `calcSubtotal(items)` — sum of quantity × unitPrice
- `calcTax(subtotal, rate)` — subtotal × (rate / 100)
- `calcTotal(subtotal, tax)` — subtotal + tax

**Files created:**
- `src/entities/estimate/model/calcHelpers.ts`
- `src/entities/estimate/model/slice.ts`
- `src/widgets/line-item-editor/ui/LineItemRow.tsx`
- `src/widgets/line-item-editor/ui/LineItemEditor.tsx`
- `src/widgets/estimate-widget/ui/EstimateWidget.tsx`
- `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx`
- `src/features/estimate-send/ui/SendEstimateButton.tsx`
- `src/features/estimate-approve/ui/ApprovalForm.tsx`
- `src/pages/estimates/PublicApprovalPage.tsx`

---

### Step 13 — Invoice Widget

**What we did:**
Built the invoice system — one invoice per job, auto-created on job creation, with full line item editing, payment tracking, and overdue detection.

**Key decisions:**
- One invoice per job. `selectInvoiceByJob` returns a single `Invoice | undefined`
- Invoice cannot be deleted, only cancelled
- Auto-created when job is created in CreateJobModal, pre-filled with one "Inspection" line item at $75

**Overdue detection:** On every app startup, `AppProvider` runs `markOverdueInvoices()` before initializing state. Any UNPAID or PARTIAL invoice older than 30 days is automatically marked OVERDUE. Runs synchronously in initial state — no dispatch needed.

**InvoiceWidget (inline, not a modal):** Displays on JobDetailPage. Shows invoice number + status badge + date, editable LineItemEditor (locked when PAID or CANCELLED), tax rate field, subtotal/tax/total, "Import from Estimate" button (visible when an APPROVED estimate exists), Save button when dirty, and PaymentActionBar.

**PaymentActionBar:**
- "Mark Partial" — available when UNPAID or OVERDUE
- "Mark Paid" — available when UNPAID, PARTIAL, or OVERDUE; records `paidAt` timestamp
- Hidden when PAID or CANCELLED

**InvoiceListPage:** Full invoice list with status filter. Each row shows invoice number, customer name, appliance, creation date, total. Clicking navigates to the job. Sorted by createdAt descending.

**Bug fixed:** Old seed data in localStorage lacked `status` field. `escapeCell()` in CSV export received `undefined` and crashed. Fixed to accept `string | undefined | null`, defaulting to `''`.

**Files created/modified:**
- `src/entities/invoice/model/types.ts` — InvoiceStatus + status field
- `src/entities/invoice/model/slice.ts` — pure reducer, selectors
- `src/entities/invoice/ui/InvoiceStatusBadge.tsx` — full status range
- `src/app/providers/AppProvider.tsx` — invoices slice + overdue detection + persistence
- `src/widgets/create-job-modal/ui/CreateJobModal.tsx` — auto invoice creation
- `src/widgets/invoice-widget/ui/InvoiceWidget.tsx`
- `src/features/invoice-payment/ui/PaymentActionBar.tsx`
- `src/pages/jobs/JobDetailPage.tsx` — wired InvoiceWidget
- `src/pages/invoices/InvoiceListPage.tsx` — replaced stub
- `src/shared/api/seed.ts` — status added to seed invoices

---

### Step 14 — CSV Export

**What we did:**
Built invoice export to CSV, accessible from the Invoices page header.

**Export flow:**
1. Tap "Export CSV" on the invoices page
2. Modal opens — two native date inputs (From, To) and a live count: "N invoices will be exported"
3. Optionally set date range
4. Click "Download CSV" — file downloads as `invoices-YYYY-MM-DD.csv`

**CSV columns:** Invoice #, Customer, Appliance, Status, Subtotal, Tax, Total, Created

**`csvExport.ts`:**
- Filters by `createdAt` date range (inclusive, end date extended to 23:59:59)
- Looks up job and customer for each invoice
- Properly escapes CSV cells (values with commas, quotes, or newlines are double-quoted)
- Creates a Blob, generates an object URL, appends a hidden `<a>` to the DOM, triggers click, removes element, revokes URL after 100ms

**Download fix:** Initial implementation called `a.click()` without appending to the DOM — this doesn't trigger a download in Chromium. Fixed by `document.body.appendChild(a)` before click, `removeChild(a)` after. URL revocation delayed by `setTimeout(..., 100)`.

**Files created:**
- `src/features/export/lib/csvExport.ts`
- `src/features/export/ui/ExportModal.tsx`

**Files modified:**
- `src/pages/invoices/InvoiceListPage.tsx` — Export CSV button in PageHeader action slot

---

### Step 15 — Polish, Responsive QA & Tests

**What we did:**
Added a test suite, error boundaries, and fixed several polish issues found during review.

**Unit tests — 29 passing:**

Vitest chosen over Jest because the project uses Vite + ESM + TypeScript path aliases. Jest requires complex babel/ts-jest configuration to handle this. Vitest uses the Vite config natively.

jsdom v29 requires Node >= 20.19.0 (we have 20.9.0). Switched to `happy-dom` — Vitest's recommended environment, no Node version issues.

| Test file | Coverage |
|-----------|---------|
| `calcHelpers.test.ts` | empty list, multi-item, fractional qty, zero/8.5/10% tax, total |
| `statusHelpers.test.ts` | full linear flow, null at end, off-flow statuses, terminal, canFinish, all advance labels |
| `storage.test.ts` | getAll empty/populated, getById hit/miss, create/append, update merge, update throws, remove, remove no-op |

**ErrorBoundary (`src/shared/ui/ErrorBoundary.tsx`):**
React class component (required — function components cannot be error boundaries). Catches render errors, logs with `componentDidCatch`, shows "Something went wrong" + "Try again" button. Wired in `AppShell` wrapping `<Outlet>` — all shell pages are protected.

**InvoiceListPage empty state:**
Raw `<Text>` replaced with `<EmptyState>` component to match the pattern used on Customers and Jobs.

**Dashboard fix:**
`invoices` changed from `storage.getAll()` (stale snapshot) to `useAppState().invoices` (live). The "Outstanding" and "This Month" calculations updated to check `InvoiceStatus` values instead of presence of `paidAt`.

**Files created:**
- `src/shared/ui/ErrorBoundary.tsx`
- `src/test/setup.ts`
- `src/entities/estimate/model/__tests__/calcHelpers.test.ts`
- `src/entities/job/model/__tests__/statusHelpers.test.ts`
- `src/shared/api/__tests__/storage.test.ts`

**Files modified:**
- `vite.config.ts` — test block with happy-dom environment
- `package.json` — test and test:watch scripts
- `src/widgets/app-shell/ui/AppShell.tsx` — ErrorBoundary around Outlet
- `src/pages/invoices/InvoiceListPage.tsx` — EmptyState component
- `src/pages/dashboard/DashboardPage.tsx` — live invoice state + status-based earnings

---

## What the App Can Do Right Now

Complete end-to-end flows that fully work:

1. **Add a customer** — Customers → + New → fill form → Save
2. **Schedule a job** — Timeline → tap a time slot → select customer → fill form → Create Job
3. **Work a job through its lifecycle** — job detail → StatusActionBar: Schedule → Start Work → Mark Approved → Generate Invoice → Mark Paid
4. **Create an estimate** — job detail → Estimates → + → add line items → Save → Send → copy approval link
5. **Approve an estimate as a customer** — open `/approve/{token}` → enter name → Approve
6. **Import estimate into invoice** — job detail → Invoice → Import from Estimate (available when an estimate is APPROVED)
7. **Mark invoice paid** — job detail → Invoice → Mark Paid
8. **Export invoices to CSV** — Invoices → Export CSV → set date range → Download CSV
9. **Search customers** by name or phone number
10. **Search jobs** by appliance, issue, brand, or customer name; filter by status
11. **Filter invoices** by status
12. **View dashboard** — today's job count, open jobs, this month's earnings, outstanding balance, action-required list

---

## Known Constraints & Gotchas

| Constraint | Detail |
|-----------|--------|
| Node v20.9.0 | Too old for create-vite@9 and jsdom@29. Use `npx create-vite@6` and `happy-dom` for tests |
| Chakra UI v3 | `colorPalette` not `colorScheme`; all Dialogs need `lazyMount + unmountOnExit`; use native `<select>` not Chakra Select |
| Pure reducers | Never call `localStorage` inside a reducer — React StrictMode double-invokes them. All persistence is in `useEffect` hooks in AppProvider |
| Modal open/close | Decouple `selectedId` from `modalOpen`. `closeModal()` only sets `modalOpen = false`, never clears the selected item until after the animation completes |
| Timeline grid | `GRID_START_HOUR=0`, `GRID_END_HOUR=24` — full 24-hour grid, do not change |
| Router file | `src/app/router.tsx` (not `src/app/index.tsx` as originally planned) |
| Multiple estimates | `selectEstimatesByJob` returns an array — multiple estimates per job are allowed |
| One invoice per job | `selectInvoiceByJob` returns a single invoice — this is intentional |
| Stale localStorage | Old seed data may lack the `status` field on invoices. Defensive code in `escapeCell` handles this |

---

## Complete File Tree

```
src/
├── app/
│   ├── providers/AppProvider.tsx
│   ├── router.tsx
│   └── styles/global.scss
├── entities/
│   ├── customer/
│   │   ├── model/types.ts, slice.ts
│   │   └── ui/CustomerCard.tsx
│   ├── estimate/
│   │   ├── model/types.ts, slice.ts, calcHelpers.ts
│   │   │        __tests__/calcHelpers.test.ts
│   │   └── ui/EstimateStatusBadge.tsx
│   ├── invoice/
│   │   ├── model/types.ts, slice.ts
│   │   └── ui/InvoiceStatusBadge.tsx
│   ├── job/
│   │   ├── model/types.ts, slice.ts, statusHelpers.ts
│   │   │        __tests__/statusHelpers.test.ts
│   │   └── ui/JobStatusBadge.tsx, PriorityBadge.tsx
│   └── line-item/
│       └── model/types.ts
├── features/
│   ├── estimate-approve/ui/ApprovalForm.tsx
│   ├── estimate-send/ui/SendEstimateButton.tsx
│   ├── export/
│   │   ├── lib/csvExport.ts
│   │   └── ui/ExportModal.tsx
│   ├── invoice-payment/ui/PaymentActionBar.tsx
│   └── job-status/ui/StatusActionBar.tsx
├── pages/
│   ├── customers/CustomerListPage.tsx, CustomerFormPage.tsx, CustomerDetailPage.tsx
│   ├── dashboard/DashboardPage.tsx
│   ├── estimates/PublicApprovalPage.tsx
│   ├── invoices/InvoiceListPage.tsx
│   ├── jobs/JobListPage.tsx, JobDetailPage.tsx
│   ├── settings/SettingsPage.tsx
│   └── timeline/TimelinePage.tsx
├── shared/
│   ├── api/storage.ts, seed.ts
│   │       __tests__/storage.test.ts
│   ├── config/storageKeys.ts, settings.ts
│   ├── lib/index.ts
│   └── ui/EmptyState.tsx, ConfirmDialog.tsx, PageHeader.tsx, ErrorBoundary.tsx
├── test/setup.ts
└── widgets/
    ├── app-shell/ui/AppShell.tsx, Navbar.tsx, Sidebar.tsx, BottomNav.tsx
    ├── create-job-modal/ui/CreateJobModal.tsx
    ├── estimate-widget/ui/EstimateWidget.tsx, EstimateDetailModal.tsx
    ├── invoice-widget/ui/InvoiceWidget.tsx
    ├── job-card/ui/JobCard.tsx
    ├── line-item-editor/ui/LineItemRow.tsx, LineItemEditor.tsx
    └── timeline-grid/
        ├── lib/timeUtils.ts
        └── ui/TimelineGrid.tsx, DateStrip.tsx, JobBlock.tsx
```
