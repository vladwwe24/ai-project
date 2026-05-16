# ApplianceTrack — Session Handoff

**Date:** 2026-05-15
**Session status:** Sprint 2 complete + modal system overhauled + production build verified

---

## What This Project Is

**ApplianceTrack** — mobile-first web app for appliance repair technicians.
Covers the full job lifecycle: customer intake → scheduling on a day timeline → estimates (sent by email, approved via public link) → invoicing → payment tracking.

All data stored in **localStorage** (mock CRUD interface, designed to be swapped for a real API later). No backend. No auth for now.

Full plan: `docs/architecture.md` (FSD structure), `docs/checklist.md` (step-by-step progress), `docs/plan.md` (original sprint 1 plan), and `docs/plan-v2.md` (Sprint 2 spec).

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

### Steps 1–15 (Sprint 1) and S2-0 through S2-6 (Sprint 2)
All previously completed — see `docs/sprints/sprint-one.md` and `docs/plan-v2.md` for the full record. Summary of Sprint 2 steps:

- **S2-0** — `AppModal` shared wrapper (`src/shared/ui/AppModal.tsx`)
- **S2-1** — Estimate widget bug fixes + 6-digit zero-padded estimate numbers
- **S2-2** — Customer creation modal with validation + Nominatim address autocomplete
- **S2-3** — Job creation form: searchable customer dropdown, `+ Customer` quick-create, separate date/start/end time fields, removed `issue` field
- **S2-4** — Job page: StatusActionBar removed, Reschedule modal added
- **S2-5** — Invoice widget: view/edit toggle, Labor/Materials sections, taxable checkboxes, payment confirmation dialogs, auto-complete job on payment
- **S2-6** — Notes widget: `Note[]` type, collapsed/expanded card UI

---

## This Session — Modal System Overhaul + Build Fix

### Session goal
Fix the long-standing **body `pointer-events: none` / `overflow: hidden` leak** that made the app unclickable after closing the estimate modal. Implement a proper React portal system so all modals render into a dedicated DOM node outside the app's component tree.

---

### Fix 1 — EstimateDetailModal migrated to AppModal

**File:** `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx`

**Before:** rolled its own `DialogRoot / DialogBackdrop / DialogPositioner / DialogContent` stack.

**After:** uses `<AppModal>` with:
- `title` — `<Flex>` with estimate number + `EstimateStatusBadge` (works because `AppModal.title` is now `ReactNode`)
- `footer` — Delete / Save / Send buttons, only rendered when `isEditable`
- `children` — body content wrapped in `<Box overflowY="auto" maxH="60vh">`
- `ConfirmDialog` for delete renders as a sibling (outside `AppModal`), unchanged

**`AppModal` change:** `title: string` → `title: ReactNode` (backward-compatible; all existing callers passed plain strings which satisfy `ReactNode`).

---

### Fix 2 — Root cause of the unclickable-body bug

**File:** `src/widgets/estimate-widget/ui/EstimateWidget.tsx`

**Root cause:** `closeModal()` was calling both `setSelectedId(null)` and `setModalOpen(false)` in the same event handler. React batches these into one render, making `displayEstimate` null immediately. This unmounted `EstimateDetailModal` from the React tree before Chakra/Zag could run its close animation and restore `<body>` styles.

**Fix — `closeModal()` now only does one thing:**
```tsx
function closeModal() {
  setModalOpen(false)
  // Never clear selectedId here — clearing it simultaneously unmounts the
  // modal before Chakra's close animation runs, leaking body overflow/pointer-events.
}
```

**Fix — `displayEstimate` logic simplified:**
```tsx
// Before (modalOpen-gated, broken for delete case):
const displayEstimate = modalOpen
  ? (selectedEstimateFromState ?? stableEstimateRef.current)
  : selectedEstimateFromState

// After (always falls back to ref — handles both normal close and delete-while-open):
const displayEstimate = selectedEstimateFromState ?? stableEstimateRef.current
```

With this, `EstimateDetailModal` stays in the React tree (rendered with `open={false}`) while Chakra animates the dialog closed and cleans up body styles. The `stableEstimateRef` covers the delete-while-open case: when the estimate disappears from state, the ref still holds it so the component doesn't unmount mid-animation.

---

### Fix 3 — React Portal system

**Why:** Chakra v3's `DialogPositioner` renders in the normal DOM tree by default (no automatic portal). Parent components with CSS `transform`, `overflow: hidden`, or stacking contexts can clip or trap modal z-indexes.

**`index.html`:** Added `<div id="modal-root"></div>` as a sibling to `<div id="root">`. All modal DOM now renders here.

**New file: `src/shared/ui/ModalPortal.tsx`:**
```tsx
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

export function ModalPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.getElementById('modal-root')!)
}
```

**`AppModal.tsx`:** wrapped its `DialogRoot` in `<ModalPortal>`. Every component that uses `AppModal` gets portal behavior automatically — no changes needed in callers.

**`ConfirmDialog.tsx`:** wrapped its `DialogRoot` in `<ModalPortal>` directly.

**`ExportModal.tsx`:** migrated from raw `DialogRoot` → `AppModal`. Gets portal for free.

**`CreateJobModal.tsx`:** migrated from raw `DialogRoot` → `AppModal`. Gets portal for free. The nested `CreateCustomerModal` (which also uses `AppModal`) portals independently — both land in `#modal-root` as separate `DialogRoot` instances; Chakra/Zag handles z-index stacking.

**Complete modal inventory after this session:**

| Component | Renders via |
|-----------|-------------|
| `AppModal` | `ModalPortal` → `#modal-root` |
| `ConfirmDialog` | `ModalPortal` → `#modal-root` |
| `EstimateDetailModal` | `AppModal` → portal ✓ |
| `CreateCustomerModal` | `AppModal` → portal ✓ |
| `CreateJobModal` | `AppModal` → portal ✓ |
| `ExportModal` | `AppModal` → portal ✓ |
| `PaymentActionBar` (partial) | `AppModal` → portal ✓ |
| `PaymentActionBar` (confirm paid) | `ConfirmDialog` → portal ✓ |
| `JobDetailPage` (reschedule) | `AppModal` → portal ✓ |
| `NotesWidget` (delete note) | `ConfirmDialog` → portal ✓ |

---

### Fix 4 — Production build errors (caught by `tsc -b`, missed by `tsc --noEmit`)

`npm run type-check` uses `tsc --noEmit` which skips test files and doesn't catch all project references. `npm run build` uses `tsc -b` which is stricter. Five pre-existing errors were fixed:

| File | Error | Fix |
|------|-------|-----|
| `src/entities/job/model/types.ts` | `JobStatus.CANCELLED` used in tests but missing from the const object | Added `CANCELLED: 'CANCELLED'` |
| `src/entities/job/ui/JobStatusBadge.tsx` | `Record<JobStatus, string>` maps incomplete after adding CANCELLED | Added `CANCELLED: 'red'` and `'Cancelled'` entries |
| `src/pages/jobs/JobDetailPage.tsx` | `...job` spread in a closure — TypeScript doesn't narrow `job: Job \| undefined` inside inner functions even after an early return guard | Changed to `...job!` |
| `src/widgets/job-card/ui/JobCard.tsx` | `noOfLines` prop removed in Chakra v3 | Replaced with `style={{ WebkitLineClamp: 1, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}` |
| `src/widgets/notes-widget/ui/NotesWidget.tsx` | Same `noOfLines` issue | Same CSS fix, `WebkitLineClamp: 2` |
| `vite.config.ts` | `test` block unknown to Vite's `defineConfig` types | Changed import from `'vite'` → `'vitest/config'` |

**Production build output:**
```
dist/index.html                   0.53 kB │ gzip:   0.32 kB
dist/assets/index-*.css           0.15 kB │ gzip:   0.13 kB
dist/assets/index-*.js          686.23 kB │ gzip: 198.33 kB
✓ built in 4.44s
```
The 686 kB chunk warning is expected (Chakra UI is large). Not an error.

**Preview server:** `npm run preview` → `http://localhost:4173` (or 4174 if 4173 is occupied).

---

## Critical Notes for Next Session

### ⚠️ Modal architecture — THE RULE
`AppModal` is the **only** modal wrapper. Never create a raw `DialogRoot` outside of `AppModal` or `ConfirmDialog`. Both of these wrap in `ModalPortal` which portals to `#modal-root`. Any new modal must use `AppModal`.

### ⚠️ The closeModal pattern — do not revert
When controlling a modal from a parent widget (like `EstimateWidget`), **never** clear the selected item ID in the same call as `setModalOpen(false)`. These batch together and unmount the modal before Chakra can animate. Only call `setModalOpen(false)`. Let `stableEstimateRef` (or similar) keep the data alive for the animation.

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

### ⚠️ Reducers are pure — all storage writes are in AppProvider useEffect
Never add `storage.create/update/remove` calls inside reducer functions.

### ⚠️ StatusActionBar is orphaned
`src/features/job-status/ui/StatusActionBar.tsx` still exists on disk but is not rendered anywhere. Safe to delete.

### ⚠️ LineItem type has optional fields
`taxable?: boolean` and `category?: 'labor' | 'material'` are optional so existing localStorage data is backward-compatible. Treat `undefined` as `true` (taxable) and `'labor'` respectively in all calculations.

### ⚠️ Invoice tax vs estimate tax
`InvoiceWidget` calls `calcTaxableSubtotal(lineItems)` before `calcTax`. `EstimateDetailModal` calls `calcSubtotal(lineItems)` — estimates do not have the taxable concept.

### ⚠️ Job notes type
`notes` on `Job` is `Note[] | undefined`. Old localStorage data with a string `notes` value is silently ignored.

### ⚠️ Nominatim rate limit
Address autocomplete in `CreateCustomerModal` uses a 400ms debounce on `https://nominatim.openstreetmap.org`. Do not remove the debounce.

### ⚠️ Node version constraint
Running Node v20.9.0. `create-vite@9` fails. Use `npx create-vite@6` if scaffolding.

### ⚠️ TypeScript build vs type-check
`npm run type-check` (`tsc --noEmit`) skips test files. `npm run build` (`tsc -b`) is stricter and catches more. Always run `npm run build` before declaring zero errors.

### ⚠️ Native select pattern
Use plain `<select>` with inline styles for simple dropdowns. For searchable dropdowns use controlled text input + dropdown list (as in `CreateJobModal` customer search).

### ⚠️ Timeline grid is full 24-hour (0–24)
`GRID_START_HOUR=0`, `GRID_END_HOUR=24`. Do not change.

---

## What Is NOT Done Yet

| Item | What | Notes |
|------|------|-------|
| E2E | Dashboard shows zeroes on fresh data | Clear localStorage, reload |
| E2E | Create customer → open timeline → tap slot → create job | Full flow with modal + time pickers |
| E2E | Job detail: status flows correctly via automatic transitions | No manual status button |
| E2E | Create estimate → add line items → send → approve via public link | Verify portal + stable-ref fix |
| E2E | Create invoice → mark paid → earnings update on dashboard | Confirm dialogs + job auto-COMPLETED |
| E2E | Export invoice list as CSV with date range | Unchanged from Sprint 1 |
| E2E | Customer search by phone and by name | Unchanged |
| Cleanup | Delete `src/features/job-status/ui/StatusActionBar.tsx` | Orphaned file, no callers |
| Sprint 3 | Push to GitHub | `git remote add origin git@github.com:vladwwe24/appliance-repair-frontend.git && git branch -M main && git push -u origin main` |

---

## Where to Start Next Session

1. Run `npm run build` — must be zero errors (currently clean ✓)
2. Run `npm run preview` → open at `http://localhost:4173`
3. Clear localStorage in DevTools (Application → Storage → Clear All) for a fresh seed
4. Walk through the E2E checklist above
5. Delete `src/features/job-status/ui/StatusActionBar.tsx`
6. Push to GitHub

**Key things to verify in the browser:**
- Open estimate modal → close → page fully clickable (the fix from this session)
- Delete an estimate → no crash, page stays clickable
- Open job creation modal from timeline → close → page fully clickable
- Confirm dialogs (Mark Paid, Delete note, Delete estimate) open and close cleanly
- Customer creation modal from `+ Customer` in CreateJobModal: both modals stack correctly
- All modals appear above all content (portaled to `#modal-root`)

---

## Key Design Decisions Made

### Modal system
- **`ModalPortal`** (`src/shared/ui/ModalPortal.tsx`) — `createPortal` to `#modal-root` in `index.html`. This is the only place `createPortal` is called.
- **`AppModal`** wraps in `ModalPortal`. Any component using `AppModal` automatically gets portal behavior.
- **`ConfirmDialog`** wraps in `ModalPortal` directly (keeps its own compact implementation).
- **`AppModal.title`** is `ReactNode` (not `string`) — allows custom elements like badge rows.

### EstimateWidget stable ref pattern
`stableEstimateRef` holds the last-opened estimate so `EstimateDetailModal` stays in the React tree (with `open={false}`) while Chakra animates closed. `closeModal()` only calls `setModalOpen(false)` — never clears `selectedId`. This is load-bearing; do not revert.

### Data model
- **One invoice per job** — `selectInvoiceByJob` returns a single `Invoice | undefined`. Auto-created at job creation with one "Inspection" line item ($75, Labor category).
- **Multiple estimates per job** — `selectEstimatesByJob` returns `Estimate[]`. Each has a 6-digit zero-padded `estimateNumber` (e.g. `000001`).
- **Pure reducers** — all reducers are side-effect free. localStorage persistence is in `AppProvider` `useEffect` hooks exclusively.
- **`issue` is optional on Job** — removed from creation form. Notes cover freeform descriptions.
- **`notes` on Job is `Note[]`** — each note: `{ id, body, createdAt, updatedAt }`.
- **`JobStatus.CANCELLED`** — added to the const object this session (was in the original DB schema but missing from the TypeScript type).

### UI/UX
- **StatusActionBar removed** — job status advances automatically via business actions.
- **Invoice widget default read-only** — Edit button (top-right) switches to edit mode.
- **Searchable customer field** — `CreateJobModal` uses controlled text input + filtered dropdown.

### Tax
- Invoice tax: **taxable subtotal** only (`calcTaxableSubtotal` — items where `taxable !== false`).
- Estimate tax: **full subtotal** (`calcSubtotal` — all items).

### Routing
- `src/app/router.tsx` (not `src/app/index.tsx`) — do not rename.
- Customer creation is a modal at `/customers`. The `/customers/new` route still exists for editing via `/customers/:id/edit`.
- Public estimate approval at `/approve/:token` renders without the app shell.
