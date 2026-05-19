# ApplianceTrack — Session Handoff

**Date:** 2026-05-19
**Session status:** Sprint 3 complete (S3-1, S3-2, S3-3), ready for E2E QA + GitHub push

---

## What This Project Is

**ApplianceTrack** — mobile-first web app for appliance repair technicians.
Covers the full job lifecycle: customer intake → scheduling on a day timeline → estimates (sent by email, approved via public link) → invoicing → payment tracking.

All data stored in **localStorage** (mock CRUD interface, designed to be swapped for a real API later). No backend. No auth for now.

Full plan: `docs/architecture.md` (FSD structure), `docs/checklist.md` (step-by-step progress), `docs/plan.md` (original sprint 1 plan), `docs/plan-v2.md` (Sprint 2 spec), `docs/plan-v3.md` (Sprint 3 spec).

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

### Modal System Overhaul (between Sprint 2 and 3)
- `src/shared/ui/ModalPortal.tsx` — `createPortal` to `#modal-root`
- `src/shared/ui/AppModal.tsx` — wraps in `ModalPortal`; `title: ReactNode`
- Fixed body `pointer-events: none` / `overflow: hidden` leak in EstimateWidget
- All modals portaled to `#modal-root`; production build verified clean

### Sprint 3 — S3-1: Job Data Model Extensions
- **`src/entities/job/model/types.ts`** — Added `Attachment` interface (`id`, `dataUrl`, `createdAt`); added `name?`, `jobNumber?`, `scheduledEndAt?`, `attachments?` to `Job`
- **`src/shared/lib/index.ts`** — Added `generateJobNumber(totalJobCount)` (5-digit zero-padded), `formatTime(iso)`
- **`src/widgets/create-job-modal/ui/CreateJobModal.tsx`** — Saves `scheduledEndAt` (from end time field), auto-sets `name` as "Job for {customerName}", generates `jobNumber` via `generateJobNumber(jobs.length)`
- **`src/shared/api/seed.ts`** — Bumped to `SEED_VERSION = 'v4'`; 6 customers, 7 jobs (today + tomorrow), all with `name`, `jobNumber`, `scheduledEndAt`; matching invoices and estimates

### Sprint 3 — S3-2: Timeline Duration + Overlapping Jobs
- **`src/widgets/timeline-grid/lib/timeUtils.ts`** — Added `isoToBlockHeight(startIso, endIso?)` (pixel height from duration, min 24px); `toDatetimeLocalValue` helper
- **`src/widgets/timeline-grid/ui/TimelineGrid.tsx`** — Greedy column-assignment algorithm: sorts jobs by start, assigns first available column, computes `totalColumns` per job by scanning overlapping jobs; passes layout to `JobBlock`
- **`src/widgets/timeline-grid/ui/JobBlock.tsx`** — Accepts `height`, `columnIndex`, `totalColumns` props; calculates `left`/`width` dynamically; shows time range label ("9:00 AM – 11:00 AM")

### Sprint 3 — S3-3: Job Page Redesign + Attachments
- **`src/widgets/attachments-widget/ui/AttachmentsWidget.tsx`** (new) — Upload button + camera button (`capture="environment"`); reads files as base64 dataUrl; dispatches `job/UPDATE`; 3-column thumbnail grid; tap opens full-size `AppModal`; delete via `ConfirmDialog`
- **`src/pages/jobs/JobDetailPage.tsx`** — Full rewrite: hero image area (180px, gray bg + pin icon), job label + bold title, action button row (Invoice / Pay), Job Schedule card (dates + tech avatar), Job Status card (status picker via `AppModal` + native `<select>`, paid indicator), Customer card (name, address, history count → `/customers/:id`), then InvoiceWidget → EstimateWidget → NotesWidget → AttachmentsWidget; "..." menu opens Settings `AppModal` (Edit Job Name / Edit Job Number); Reschedule via pencil icon in schedule card
- **`src/widgets/estimate-widget/ui/EstimateDetailModal.tsx`** — Added "Apply to Invoice" button (visible when invoice exists and estimate has line items); `ConfirmDialog` warns before replacing invoice line items; on confirm dispatches `invoice/UPDATE` with items copied from estimate (new IDs)

---

## Critical Notes for Next Session

### ⚠️ Modal architecture — THE RULE
`AppModal` is the **only** modal wrapper. Never create a raw `DialogRoot` outside of `AppModal` or `ConfirmDialog`. Both wrap in `ModalPortal` → `#modal-root`. Any new modal must use `AppModal`.

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

### ⚠️ Attachments stored as base64 in localStorage
`AttachmentsWidget` converts images to data URLs via `FileReader.readAsDataURL`. Large images will bloat localStorage quickly. This is a known tradeoff for the no-backend constraint.

### ⚠️ Nominatim rate limit
Address autocomplete in `CreateCustomerModal` uses a 400ms debounce on `https://nominatim.openstreetmap.org`. Do not remove the debounce.

### ⚠️ Node version constraint
Running Node v20.9.0. `create-vite@9` fails. Use `npx create-vite@6` if scaffolding.

### ⚠️ TypeScript build vs type-check
`npm run type-check` (`tsc --noEmit`) skips test files. `npm run build` (`tsc -b`) is stricter and catches more. Always run `npm run build` before declaring zero errors.

### ⚠️ Native select pattern
Use plain `<select>` with inline styles for simple dropdowns (as in JobDetailPage status modal). For searchable dropdowns use controlled text input + dropdown list (as in `CreateJobModal` customer search).

### ⚠️ Timeline grid is full 24-hour (0–24)
`GRID_START_HOUR=0`, `GRID_END_HOUR=24`. Do not change.

### ⚠️ Seed version is now v4
`src/shared/api/seed.ts` checks `localStorage.getItem('seed_version') === 'v4'`. On first load after clearing storage it seeds 6 customers and 7 jobs. Clear localStorage in DevTools to re-trigger seed.

---

## What Is NOT Done Yet

| Item | What | Notes |
|------|------|-------|
| E2E | Dashboard shows zeroes on fresh data | Clear localStorage, reload |
| E2E | Create customer → open timeline → tap slot → create job | Full flow with modal + time pickers |
| E2E | Job detail: all status flows via status picker modal | Check all `JobStatus` values |
| E2E | Create estimate → add line items → send → approve via public link | Verify portal + stable-ref fix |
| E2E | Apply estimate to invoice — confirm line items replace correctly | New S3-3 feature |
| E2E | Upload attachment → thumbnail → full-size view → delete | New AttachmentsWidget |
| E2E | Create invoice → mark paid → earnings update on dashboard | Confirm dialogs + job auto-COMPLETED |
| E2E | Export invoice list as CSV with date range | Unchanged from Sprint 1 |
| E2E | Customer search by phone and by name | Unchanged |
| Cleanup | Delete `src/features/job-status/ui/StatusActionBar.tsx` | Orphaned file, no callers |
| Deploy | Push to GitHub | `git remote add origin git@github.com:vladwwe24/appliance-repair-frontend.git && git branch -M main && git push -u origin main` |

---

## Where to Start Next Session

1. Run `npm run build` — must be zero errors
2. Run `npm run dev` → open at `http://localhost:5173`
3. Clear localStorage in DevTools (Application → Storage → Clear All) — triggers seed v4
4. Walk through the E2E checklist above item by item
5. Delete `src/features/job-status/ui/StatusActionBar.tsx`
6. Push to GitHub

**Key things to verify in the browser at 390px:**
- Timeline: create two overlapping jobs (e.g. 10–12 and 10:30–11:30) → they appear side-by-side; a 2-hour job spans 160px
- Job page: all card sections visible, no horizontal overflow; "..." menu → edit name + number; status picker; reschedule modal
- Attachments: upload image → thumbnail grid; tap → full-size modal; delete → confirm → removed
- Estimate "Apply to Invoice": opens confirm dialog; on confirm replaces invoice line items
- Open/close all modals — body stays fully clickable throughout

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
Greedy column assignment: jobs sorted by start time; each assigned to the first column whose last-end ≤ job.start, or a new column if all overlap. `totalColumns` for each job is computed by scanning all jobs that overlap it and taking `max(columnIndex) + 1`. `JobBlock` receives `columnIndex` and `totalColumns` and calculates its own `left`/`width` from those values.

### Data model
- **One invoice per job** — `selectInvoiceByJob` returns a single `Invoice | undefined`. Auto-created at job creation with one "Inspection" line item ($75, Labor category).
- **Multiple estimates per job** — `selectEstimatesByJob` returns `Estimate[]`. Each has a 6-digit zero-padded `estimateNumber` (e.g. `000001`).
- **Pure reducers** — all reducers are side-effect free. localStorage persistence is in `AppProvider` `useEffect` hooks exclusively.
- **`issue` is optional on Job** — removed from creation form. Notes cover freeform descriptions.
- **`notes` on Job is `Note[]`** — each note: `{ id, body, createdAt, updatedAt }`.
- **`attachments` on Job is `Attachment[]`** — each attachment: `{ id, dataUrl, createdAt }`. Data URLs stored directly in localStorage.
- **`name`, `jobNumber`, `scheduledEndAt` on Job** — set at creation; editable via "..." menu (name/number) and reschedule modal (scheduledEndAt).
- **`JobStatus.CANCELLED`** — present in the const object; manual selection available via status picker modal.

### UI/UX
- **StatusActionBar removed** — job status advances via manual picker modal in JobDetailPage.
- **Invoice widget default read-only** — Edit button (top-right) switches to edit mode.
- **Searchable customer field** — `CreateJobModal` uses controlled text input + filtered dropdown.
- **Job page hero** — 180px gray area with location pin icon; acts as placeholder for a future map or photo.
- **Tech avatar** — hardcoded initials "VH" / "Vladyslav H." in Job Schedule card (single-technician assumption).

### Tax
- Invoice tax: **taxable subtotal** only (`calcTaxableSubtotal` — items where `taxable !== false`).
- Estimate tax: **full subtotal** (`calcSubtotal` — all items).

### Routing
- `src/app/router.tsx` (not `src/app/index.tsx`) — do not rename.
- Customer creation is a modal at `/customers`. The `/customers/new` route still exists for editing via `/customers/:id/edit`.
- Public estimate approval at `/approve/:token` renders without the app shell.
