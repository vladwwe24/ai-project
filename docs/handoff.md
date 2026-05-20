# ApplianceTrack — Session Handoff

**Date:** 2026-05-19
**Session status:** Sprint 4 + dark/light theme complete, ready for cleanup + deploy

---

## What This Project Is

**ApplianceTrack** — mobile-first web app for appliance repair technicians.
Covers the full job lifecycle: customer intake → scheduling on a day timeline → estimates (sent by email, approved via public link) → invoicing → payment tracking.

All data stored in **localStorage** (mock CRUD interface, designed to be swapped for a real API later). No backend. No auth for now.

Full plan: `docs/architecture.md` (FSD structure), `docs/plan.md` (Sprint 1), `docs/plan-v2.md` (Sprint 2), `docs/plan-v3.md` (Sprint 3), `docs/plan-v4.md` (Sprint 4).

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
| Tests | Vitest + happy-dom (29 unit tests passing) |
| Node | v20.9.0 (important: too old for create-vite@9 — use @6 if re-scaffolding) |

---

## What Is Done

### Steps 1–15 (Sprint 1)
All complete. Covers: project scaffolding, TypeScript types, localStorage service, React context + reducers, routing + app shell, shared UI components, dashboard, settings, customer module, job module, timeline + create-job modal, estimate widget, invoice widget, CSV export, polish + tests (29 unit tests).

### Sprint 2 — S2-0 through S2-6
- **S2-0** — `AppModal` shared wrapper (`src/shared/ui/AppModal.tsx`)
- **S2-1** — Estimate widget bug fixes + 6-digit zero-padded estimate numbers
- **S2-2** — Customer creation modal with validation + Nominatim address autocomplete
- **S2-3** — Job creation form: searchable customer dropdown, `+ Customer` quick-create, separate date/start/end time fields
- **S2-4** — Job page: StatusActionBar removed, Reschedule modal added
- **S2-5** — Invoice widget: view/edit toggle, Labor/Materials sections, taxable checkboxes, payment confirmation dialogs, auto-complete job on payment
- **S2-6** — Notes widget: `Note[]` type, collapsed/expanded card UI

### Modal System Overhaul (between Sprint 2 and 3)
- `src/shared/ui/ModalPortal.tsx` — `createPortal` to `#modal-root`; `AppModal` wraps in `ModalPortal`; `AppModal.title` is `ReactNode`
- Fixed body `pointer-events: none` / `overflow: hidden` leak in EstimateWidget (stable ref + `closeModal` only calls `setModalOpen(false)`)
- Production build verified clean

### Sprint 3 — S3-1 through S3-3
- **S3-1** — `Attachment` interface + `name?`, `jobNumber?`, `scheduledEndAt?`, `attachments?` on `Job`; `generateJobNumber` + `formatTime` in `src/shared/lib/index.ts`; `CreateJobModal` saves all new fields; seed bumped to v4
- **S3-2** — Timeline: `isoToBlockHeight` in timeUtils; greedy column-assignment overlap algorithm in `TimelineGrid`; `JobBlock` accepts `height`/`columnIndex`/`totalColumns`, shows time range label
- **S3-3** — `AttachmentsWidget` (new) with camera/upload, 3-column thumbnail grid, full-size preview, delete confirm; `JobDetailPage` full rewrite (Jobber-style card layout); `EstimateDetailModal` "Apply to Invoice" button + confirm dialog

### Sprint 4

**S4-1 — Fix `markPaid` to store `paidAmount` + show paid amount in UI**
- `src/features/invoice-payment/ui/PaymentActionBar.tsx` — `markPaid()` computes total from line items and stores `paidAmount: total` in `invoice/UPDATE` payload
- `src/widgets/invoice-widget/ui/InvoiceWidget.tsx` — added "Paid" row (green) and "Balance due" row (orange) below Total; both gated on `invoice.paidAmount !== undefined`

**S4-2 — Create `SectionedLineItemEditor` shared component**
- `src/widgets/line-item-editor/ui/SectionedLineItemEditor.tsx` — created with props `{ lineItems, readOnly?, onChange }`; Labor section (`category !== 'material'`), Materials section (`category === 'material'`); per-section circular `IconButton` + `MdAdd`; per-item taxable checkbox sub-row in edit mode
- `src/widgets/line-item-editor/ui/LineItemEditor.tsx` — **deleted**
- `src/features/estimate-approve/ui/ApprovalForm.tsx` and `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx` updated to import `SectionedLineItemEditor`
- Build verified zero errors

**S4-3 — Both estimate and invoice use `SectionedLineItemEditor`; unify tax logic**
- `src/entities/line-item/model/types.ts` — `category` is now **required** (linter removed `?`); stale `// invoice-only` comment removed
- `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx` — tax now uses `calcTaxableSubtotal` (unified with invoice)
- `src/widgets/invoice-widget/ui/InvoiceWidget.tsx` — removed inline `RowView`/`RowEdit`/`Section`; replaced both section blocks with `<SectionedLineItemEditor>`
- `src/widgets/create-job-modal/ui/CreateJobModal.tsx` — default "Inspection" line item gets `category: 'labor'`
- `src/entities/estimate/model/__tests__/calcHelpers.test.ts` — test helper updated with `category: 'labor'`
- Build verified zero errors

**S4-4 — Multiple estimates → one invoice (append, not replace)**
- `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx` — `handleApplyToInvoice` now appends `[...invoice.lineItems, ...estimate.lineItems]` (new IDs via nanoid); computes `newTotal` and auto-sets status to `PARTIAL` if `invoice.status === PAID && newTotal > paidAmount`; confirm dialog message updated
- `src/widgets/invoice-widget/ui/InvoiceWidget.tsx` — removed `approvedEstimate`, `handleImportFromEstimate()`, and "Import from Estimate" button; `useEffect` now watches `invoice?.updatedAt` so widget re-syncs immediately after external updates (fixes double-apply bug)
- `src/shared/api/seed.ts` — bumped to **v5**; all line items now have explicit `category` and `taxable` fields

**S4-5 — Invoice editing when Paid/Partial + payment validation + auto-PARTIAL**
- `src/widgets/invoice-widget/ui/InvoiceWidget.tsx` — replaced `isPaid` with `isLocked` (only `CANCELLED` blocks editing; PAID/PARTIAL are now editable); added `validationError` state; `handleSave()` validates total ≥ paidAmount and auto-derives status: `total > paid → PARTIAL`, `total ≤ paid → PAID`; error shown above Cancel/Save; Cancel clears error; useEffect dependency updated to `isLocked`
- Build verified zero errors

**S4-6 — UI/UX standardization: pill buttons + card shadow audit**
- `src/features/invoice-payment/ui/PaymentActionBar.tsx` — Mark Partial, Mark Paid, Confirm Deposit buttons now `variant="subtle" borderRadius="full"`
- All top-level card outer boxes across the app swapped from `borderWidth="1px" borderRadius="md"` to `boxShadow="sm" borderRadius="xl"`:
  - `src/widgets/invoice-widget/ui/InvoiceWidget.tsx`
  - `src/widgets/estimate-widget/ui/EstimateWidget.tsx` (outer only; inner list items stay bordered)
  - `src/widgets/notes-widget/ui/NotesWidget.tsx` (both edit and collapsed views)
  - `src/widgets/attachments-widget/ui/AttachmentsWidget.tsx`
  - `src/pages/customers/CustomerDetailPage.tsx` (contact info card; nested job items stay bordered)
  - `src/pages/invoices/InvoiceListPage.tsx` (list item cards)
  - `src/widgets/job-card/ui/JobCard.tsx`
  - `src/entities/customer/ui/CustomerCard.tsx`
  - `src/pages/dashboard/DashboardPage.tsx` (StatCard + Action Required items)
- All `gray.50` hover states replaced with `bg.subtle` (semantic token, adapts to dark mode)
- Build verified zero errors

**Dark/Light Theme**
- `src/app/styles/_theme-light.scss` — CSS custom properties for light theme on `:root`
- `src/app/styles/_theme-dark.scss` — CSS custom properties for dark theme on `.dark` class (deep navy-indigo: bg `#0e1523`, surface `#16213e`, nav `#0a1018`)
- `src/app/styles/global.scss` — imports both theme files via `@use`; applies `var(--app-bg)` on `body` with 0.25s transition
- `src/shared/lib/ThemeContext.tsx` — `ThemeProvider` + `useTheme` hook; toggles `.dark` class on `<html>` (aligns with Chakra v3's `_dark` condition); persists to `localStorage`; applies class synchronously in `useState` initializer to prevent theme flash
- `src/app/providers/AppProvider.tsx` — wrapped with `ThemeProvider`
- `src/widgets/app-shell/ui/Navbar.tsx` — sun/moon icon toggle button (top-right, mobile); uses `var(--app-nav-bg)`
- `src/widgets/app-shell/ui/Sidebar.tsx` — sun/moon icon toggle at bottom; dark-aware active/hover states via Chakra `_dark` prop; uses `var(--app-nav-bg)`
- `src/widgets/app-shell/ui/BottomNav.tsx` — `var(--app-nav-bg)` instead of `bg="white"`; `fg.muted` for inactive items; `blue.500` for active
- `src/widgets/attachments-widget/ui/AttachmentsWidget.tsx` — `var(--app-surface)` instead of `bg="white"`
- Build verified zero errors

---

## Critical Notes for Next Session

### ⚠️ Modal architecture — THE RULE
`AppModal` is the **only** modal wrapper. Never create a raw `DialogRoot` outside of `AppModal` or `ConfirmDialog`. Both wrap in `ModalPortal` → `#modal-root`. Any new modal must use `AppModal`.

### ⚠️ The closeModal pattern — do not revert
When controlling a modal from a parent widget (like `EstimateWidget`), **never** clear the selected item ID in the same call as `setModalOpen(false)`. Only call `setModalOpen(false)`. Let `stableEstimateRef` keep the data alive for the animation.

### ⚠️ Chakra UI v3 API (differs from v2)
```tsx
import { ChakraProvider } from '@chakra-ui/react'
import { system } from '@chakra-ui/react/preset'
<ChakraProvider value={system}>{children}</ChakraProvider>
```
- `colorPalette` not `colorScheme`
- Dialog: `DialogRoot`, `DialogPositioner`, `DialogContent`, etc. (compound components)
- **Always add `lazyMount` + `unmountOnExit` to every `DialogRoot`** — omitting these causes `overflow: hidden; pointer-events: none` to leak onto `<body>` after close
- `noOfLines` prop **does not exist** in v3 — use `style={{ WebkitLineClamp: N, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}`
- **`ColorModeProvider` and `useColorMode` do NOT exist in Chakra v3** — use the custom `ThemeContext` (`src/shared/lib/ThemeContext.tsx`) instead

### ⚠️ Theme system — how dark mode works
Chakra v3's `_dark` condition selector is `.dark &` (class on an ancestor). Our `ThemeProvider` toggles `.dark` on `document.documentElement`. The SASS files also use `.dark { ... }`. Both systems stay in sync automatically. Do not use `data-theme` attribute — Chakra v3 does not use it.

### ⚠️ CSS custom properties for backgrounds
Components that had `bg="white"` hardcoded now use `style={{ background: 'var(--app-surface)' }}` or `style={{ background: 'var(--app-nav-bg)' }}`. Do not add new `bg="white"` hardcoding — use CSS vars or semantic tokens (`bg.subtle`, `fg.muted`, `border.subtle`).

### ⚠️ Reducers are pure — all storage writes are in AppProvider useEffect
Never add `storage.create/update/remove` calls inside reducer functions.

### ⚠️ `LineItem.category` is now required
`category: 'labor' | 'material'` is **required** (not optional) after S4-3. Every place that creates a `LineItem` must set it. Filter rule: `item.category !== 'material'` → Labor; `item.category === 'material'` → Materials. `taxable` remains optional (defaults to `true` when undefined).

### ⚠️ `InvoiceWidget` useEffect watches `invoice?.updatedAt`
The dependency array is `[invoice?.id, invoice?.updatedAt, isLocked]`. This ensures local `lineItems` state re-syncs whenever the invoice is externally updated. Do not remove `invoice?.updatedAt` from deps. Note: was `isPaid` before S4-5 — now `isLocked`.

### ⚠️ `InvoiceWidget` edit lock is `isLocked`, not `isPaid`
After S4-5: only `CANCELLED` invoices block editing (`isLocked = invoice?.status === InvoiceStatus.CANCELLED`). PAID and PARTIAL invoices are editable. `handleSave()` auto-derives new status: `total > paidAmount → PARTIAL`, `total ≤ paidAmount → PAID`.

### ⚠️ `paidAmount` on Invoice
`markPaid()` stores `paidAmount: total` (computed from line items at payment time). `markPartial()` also stores `paidAmount`. The "Paid" / "Balance due" display rows in `InvoiceWidget` are gated on `invoice.paidAmount !== undefined`.

### ⚠️ StatusActionBar is orphaned
`src/features/job-status/ui/StatusActionBar.tsx` still exists on disk but is not rendered anywhere. Safe to delete (deferred cleanup).

### ⚠️ Attachments stored as base64 in localStorage
`AttachmentsWidget` converts images to data URLs via `FileReader.readAsDataURL`. Large images will bloat localStorage. Known tradeoff for the no-backend constraint.

### ⚠️ Nominatim rate limit
Address autocomplete in `CreateCustomerModal` uses a 400ms debounce on `https://nominatim.openstreetmap.org`. Do not remove the debounce.

### ⚠️ Node version constraint
Running Node v20.9.0. `create-vite@9` fails. Use `npx create-vite@6` if scaffolding.

### ⚠️ TypeScript build vs type-check
`npm run type-check` (`tsc --noEmit`) skips test files. `npm run build` (`tsc -b`) is stricter. Always run `npm run build` before declaring zero errors.

### ⚠️ Seed version is now v5
`src/shared/api/seed.ts` checks `localStorage.getItem('seed_version') === 'v5'`. All seed line items have `category` and `taxable` set. Page reload triggers re-seed automatically (no manual clear needed when version bumps).

### ⚠️ Native select pattern
Use plain `<select>` with inline styles for simple dropdowns. For searchable dropdowns use controlled text input + dropdown list.

### ⚠️ Timeline grid is full 24-hour (0–24)
`GRID_START_HOUR=0`, `GRID_END_HOUR=24`. Do not change.

---

## What Is NOT Done Yet

| Step | What | Key files |
|------|------|-----------|
| Cleanup | Delete orphaned `StatusActionBar.tsx` | `src/features/job-status/ui/StatusActionBar.tsx` |
| Deploy | Push to GitHub | `git remote add origin git@github.com:vladwwe24/appliance-repair-frontend.git && git branch -M main && git push -u origin main` |

---

## Where to Start Next Session

**Cleanup — delete orphaned StatusActionBar**

```bash
# 1. Delete the orphaned file
rm src/features/job-status/ui/StatusActionBar.tsx

# 2. Verify nothing imports it
npm run build   # must be zero errors

# 3. Deploy to GitHub
git add -A
git commit -m "Sprint 4 complete: estimates/invoices sync, payment logic, UI polish, dark theme"
git remote add origin git@github.com:vladwwe24/appliance-repair-frontend.git
git branch -M main
git push -u origin main
```

---

## Key Design Decisions Made

### Modal system
- **`ModalPortal`** (`src/shared/ui/ModalPortal.tsx`) — `createPortal` to `#modal-root` in `index.html`. This is the only place `createPortal` is called.
- **`AppModal`** wraps in `ModalPortal`. Any component using `AppModal` automatically gets portal behavior.
- **`ConfirmDialog`** wraps in `ModalPortal` directly (keeps its own compact implementation).
- **`AppModal.title`** is `ReactNode` (not `string`) — allows custom elements like badge rows.

### EstimateWidget stable ref pattern
`stableEstimateRef` holds the last-opened estimate so `EstimateDetailModal` stays in the React tree (with `open={false}`) while Chakra animates closed. `closeModal()` only calls `setModalOpen(false)` — never clears `selectedId`. This is load-bearing; do not revert.

### Timeline overlap layout
Greedy column assignment: jobs sorted by start time; each assigned to the first column whose last-end ≤ job.start, or a new column if all overlap. `totalColumns` for each job computed by scanning all overlapping jobs and taking `max(columnIndex) + 1`. `JobBlock` receives `columnIndex` and `totalColumns` and calculates its own `left`/`width`.

### Dark/Light theme system
- **`ThemeProvider`** (`src/shared/lib/ThemeContext.tsx`) — toggles `.dark` class on `document.documentElement`. Persists to `localStorage` under key `app-color-mode`. Applies synchronously in `useState` initializer to avoid flash.
- **SASS files** — `_theme-light.scss` (`:root`) and `_theme-dark.scss` (`.dark`) define CSS custom properties: `--app-bg`, `--app-surface`, `--app-nav-bg`, `--app-hover`. Dark palette: deep navy-indigo (`#0e1523` / `#16213e` / `#0a1018`).
- **Chakra `_dark` prop** aligns automatically because Chakra v3's dark condition is `.dark &` — same class we toggle.
- **Toggle button** in `Navbar` (mobile, top-right) and `Sidebar` (desktop, bottom). Sun icon in dark mode, moon icon in light mode.

### Data model
- **One invoice per job** — `selectInvoiceByJob` returns a single `Invoice | undefined`. Auto-created at job creation with one "Inspection" line item ($75, Labor category).
- **Multiple estimates per job** — `selectEstimatesByJob` returns `Estimate[]`. Each has a 6-digit zero-padded `estimateNumber`.
- **Pure reducers** — all reducers are side-effect free. localStorage persistence is in `AppProvider` `useEffect` hooks exclusively.
- **`issue` is optional on Job** — removed from creation form. Notes cover freeform descriptions.
- **`notes` on Job is `Note[]`** — each note: `{ id, body, createdAt, updatedAt }`.
- **`attachments` on Job is `Attachment[]`** — each attachment: `{ id, dataUrl, createdAt }`. Data URLs stored directly in localStorage.
- **`name`, `jobNumber`, `scheduledEndAt` on Job** — set at creation; editable via "..." menu (name/number) and reschedule modal (scheduledEndAt).
- **`JobStatus.CANCELLED`** — present in the const object; manual selection via status picker modal on job detail page.
- **`paidAmount` on Invoice** — stored when marking Paid (full computed total) or Partial (user-entered deposit). Used for "Paid" / "Balance due" display rows and edit validation.
- **`LineItem.category` is required** — `'labor' | 'material'`, set at item creation. Filter: `!== 'material'` → Labor, `=== 'material'` → Materials. `taxable` is optional (default `true`).

### UI/UX
- **StatusActionBar removed** — job status advances via manual picker modal in JobDetailPage.
- **Invoice widget default read-only** — Edit button (top-right) switches to edit mode. Only CANCELLED locks editing; PAID/PARTIAL are editable with payment validation.
- **Searchable customer field** — `CreateJobModal` uses controlled text input + filtered dropdown.
- **Job page hero** — 180px gray area with location pin icon; acts as placeholder for a future map or photo.
- **Tech avatar** — hardcoded initials "VH" / "Vladyslav H." in Job Schedule card (single-technician assumption).
- **SectionedLineItemEditor** — shared widget used by both `EstimateDetailModal` and `InvoiceWidget`; Labor/Materials split by `category`; taxable checkbox per item in edit mode.
- **Card shadow standard** — top-level page cards use `boxShadow="sm" borderRadius="xl"`; nested list items use `borderWidth="1px" borderRadius="md"`.
- **Payment buttons** — pill-shaped (`borderRadius="full" variant="subtle"`) with semantic colors (green=paid, yellow=partial).

### Tax
- Both invoice and estimate tax: **taxable subtotal only** (`calcTaxableSubtotal` — items where `taxable !== false`). Unified in S4-3.

### Routing
- `src/app/router.tsx` (not `src/app/index.tsx`) — do not rename.
- Customer creation is a modal at `/customers`. The `/customers/new` route still exists for editing via `/customers/:id/edit`.
- Public estimate approval at `/approve/:token` renders without the app shell.
