# Plan v3 — Timeline Improvements + Job Page Redesign

## Context

Sprint 3 targets two areas:
1. **Timeline**: Job blocks currently render at a fixed 1-hour height regardless of actual end time, and overlapping jobs stack on top of each other instead of appearing side-by-side.
2. **Job page**: The current layout is a simple top-to-bottom list of widgets with no visual hierarchy. The reference design (Jobber-style) shows a rich page with a header image, action buttons, structured card sections, and attachments.

Development rules from `docs/checklist.md`: each step is done only after `npm run dev` runs clean, `npm run type-check` passes with zero errors, and feature is verified in browser at 390px width.

---

## Step S3-1 — Job Data Model Extensions

**Goal:** Add fields needed by both the timeline fix and the new job page before touching UI.

### Files to modify

**`src/entities/job/model/types.ts`**
- Add `Attachment` interface: `{ id: string; dataUrl: string; createdAt: string }`
- Add to `Job` interface:
  - `name?: string` — editable job name, defaults to `"Job for {customer name}"`
  - `jobNumber?: string` — sequential human-readable number (e.g., `"20288"`)
  - `scheduledEndAt?: string` — ISO end datetime (enables correct timeline height)
  - `attachments?: Attachment[]` — local image attachments

**`src/shared/lib/index.ts`**
- Add `generateJobNumber(totalJobCount: number): string` — zero-padded 5-digit number, e.g. `String(totalJobCount + 1).padStart(5, '0')`

**`src/widgets/create-job-modal/ui/CreateJobModal.tsx`**
- In `handleCreate`: build and save `scheduledEndAt` from `scheduledDate + endTime`
- Auto-set `name` as `"Job for {customerName}"`
- Generate `jobNumber` via `generateJobNumber(jobs.length)` (needs `jobs` from `useAppState`)

**`src/shared/api/seed.ts`**
- Add `name`, `jobNumber`, `scheduledEndAt` to each seeded job for consistency

### Verification
- `npm run type-check` — zero errors
- Create a new job; confirm `scheduledEndAt`, `name`, `jobNumber` appear in localStorage

---

## Step S3-2 — Timeline: Duration + Overlapping Jobs

**Goal:** Blocks render with correct height based on duration; overlapping jobs display side-by-side.

### Files to modify

**`src/widgets/timeline-grid/lib/timeUtils.ts`**
- Add `isoToBlockHeight(startIso: string, endIso?: string): number`:
  ```ts
  // Returns pixel height for a job block
  // Falls back to HOUR_HEIGHT (80px) if no endIso or endIso <= startIso
  export function isoToBlockHeight(startIso: string, endIso?: string): number {
    if (!endIso) return HOUR_HEIGHT
    const startMs = new Date(startIso).getTime()
    const endMs = new Date(endIso).getTime()
    const durationHours = (endMs - startMs) / 3_600_000
    if (durationHours <= 0) return HOUR_HEIGHT
    return Math.max(durationHours * HOUR_HEIGHT, 24) // min 24px to stay readable
  }
  ```
- Keep `BLOCK_HEIGHT` export for backward compat but it won't be used by JobBlock anymore

**`src/widgets/timeline-grid/ui/TimelineGrid.tsx`**
- Add overlap detection + column assignment before rendering JobBlocks:
  ```
  Algorithm:
  1. Sort jobs by scheduledAt (ascending)
  2. Greedy column assignment: for each job, find the first column whose last-end ≤ job.start; assign it; else open a new column
  3. Determine totalColumns per job = widest group that job belongs to (scan all jobs whose time range overlaps this job and take max(columnIndex)+1)
  4. Pass columnIndex and totalColumns to JobBlock
  ```
- Pass `height` (from `isoToBlockHeight`) to JobBlock

**`src/widgets/timeline-grid/ui/JobBlock.tsx`**
- Replace fixed `height={BLOCK_HEIGHT}` with `height` prop
- Add `columnIndex: number` and `totalColumns: number` props
- Calculate `left` and `right` dynamically:
  ```ts
  const LABEL_LEFT = 56
  const GUTTER = 8
  const availableWidth = `calc(100% - ${LABEL_LEFT}px - ${GUTTER}px)`
  // Each column gets equal share; gap 2px between columns
  left = `calc(${LABEL_LEFT}px + ${columnIndex} * (${availableWidth} / ${totalColumns}))`
  right = `calc(${GUTTER}px + ${totalColumns - columnIndex - 1} * (${availableWidth} / ${totalColumns}))`
  ```
- Show time range in block: `"9:00 AM – 11:00 AM"` using `formatTime(scheduledAt)` + `formatTime(scheduledEndAt)`

### Verification
- Schedule a 2-hour job (e.g. 2 PM–4 PM); block should span 160px on the grid
- Create two jobs at same time (e.g. 10 AM–12 PM and 10:30 AM–11:30 AM); they appear side-by-side
- Browser at 390px — blocks don't overflow

---

## Step S3-3 — Job Page Full Redesign + Attachments Widget

**Goal:** Replace the current simple layout with a structured, card-based page matching the reference screenshots.

### New layout structure (JobDetailPage)

```
┌──────────────────────────────┐
│  [← back]          [• • •]  │  ← floating over image
│                              │
│   [address/location image]   │  200px tall, gray bg + pin icon placeholder
│                              │
├──────────────────────────────┤
│  Job #20288                  │  small gray label
│  Job for Mjellma Berisha     │  bold 2xl
│                              │
│  [Invoice]  [Pay]            │  action buttons row (Approve hidden unless approved)
├──────────────────────────────┤
│  📅 Job Schedule             │  Card
│  From   Sat May 16  12:00p  │
│  To     Sat May 16   2:00p  │
│  ● VH   Vladyslav H.         │  avatar initials
├──────────────────────────────┤
│  🔧 Job status    Finished ▸ │  Card — shows status; tap opens status picker
│  ─────────────────────────── │
│  $ Paid in full              │  green $ icon when status = PAID
├──────────────────────────────┤
│  👤 Customer                 │  Card
│  Mjellma Berisha    💬        │  name + message icon (stub)
│  18402 NE 27th Way …  📍     │  address + map icon (stub)
│  Customer History   1  ›     │  taps to /customers/:id
├──────────────────────────────┤
│  ≡ Line Items  ⤢  ✏          │  InvoiceWidget (existing, kept as-is)
├──────────────────────────────┤
│  📋 Estimates            +   │  EstimateWidget (existing, kept as-is)
├──────────────────────────────┤
│  📄 Private Notes        +   │  NotesWidget (existing, kept as-is)
├──────────────────────────────┤
│  📎 Attachments      ↑  📷   │  New AttachmentsWidget
│  [thumbnail grid]            │
└──────────────────────────────┘
```

### "..." (Settings) Menu
- Only two items: **Edit Job Name**, **Edit Job Number**
- Each opens a small inline modal (re-use `AppModal`) with an Input and Save button
- Dispatches `job/UPDATE` with updated `name` / `jobNumber`

### Reschedule (Appointment card)
- The Appointment card has a pencil/edit icon (bottom-right, matching reference screenshot)
- Clicking it opens an `AppModal` titled "Reschedule Job" with three fields:
  - **Date** — `<input type="date">` pre-filled with current scheduled date (native calendar picker activates on focus)
  - **Start Time** — `<input type="time">` pre-filled with current start time
  - **End Time** — `<input type="time">` pre-filled with current end time (or start + 2h)
- Save dispatches `job/UPDATE` with new `scheduledAt` and `scheduledEndAt`
- This replaces the old "Reschedule" button that was in the page header

### Status section detail
- The card shows the current status label (e.g. "Finished") right-aligned; tapping opens a native `<select>` inside an `AppModal` to change status
- "Paid in full" row shows a green `$` icon when `status === 'PAID'`, otherwise a muted grey icon

### Files to create/modify

**`src/widgets/attachments-widget/ui/AttachmentsWidget.tsx`** (new)
- Props: `jobId: string`
- Reads `job.attachments` from state
- Upload button: `<input type="file" accept="image/*">` → reads file as base64 dataUrl → dispatches `job/UPDATE` with new attachment appended
- Camera button: `<input type="file" accept="image/*" capture="environment">` → same flow
- Displays thumbnails in a 3-column grid; tap thumbnail opens full-screen view (simple `<img>` in `AppModal`)
- Delete thumbnail: long-press or X button overlay (confirm dialog before removing)

**`src/pages/jobs/JobDetailPage.tsx`** (full rewrite)
- Remove: Reschedule button from header
- Add: all sections described above; reschedule now lives in Appointment card as pencil icon
- Reuse: `InvoiceWidget`, `EstimateWidget`, `NotesWidget`, new `AttachmentsWidget`
- Job name/number edit modals use `AppModal`
- Status change modal uses `AppModal` + native `<select>`
- Reschedule modal (Date + Start Time + End Time) triggered from Appointment card edit icon

**`src/widgets/estimate-widget/ui/EstimateDetailModal.tsx`**
- Add **"Apply to Invoice"** button (only when the estimate has line items)
- On tap: show a `ConfirmDialog` — _"This will replace all current invoice line items with this estimate's items. Continue?"_
- On confirm: look up the job's invoice via `selectInvoiceByJob`; dispatch `invoice/UPDATE` with line items copied from the estimate (same `description`, `quantity`, `unitPrice`; generate new `id` for each copied item)
- Purpose: saves user from manually re-entering numbers that already exist in the estimate

**`src/entities/job/model/types.ts`**
- No additional fields needed for the status section (summary removed)

### Verification
- 390px: all card sections visible, no horizontal overflow
- "..." menu shows only two items; both edit modals work and persist
- Status section reflects correct states (finished/paid)
- Attachments: upload an image → thumbnail appears → tap opens full size → delete removes it
- InvoiceWidget, EstimateWidget, NotesWidget still function as before

---

## Data model summary (new fields on Job)

```ts
export interface Attachment {
  id: string
  dataUrl: string   // base64 data URL
  createdAt: string
}

export interface Job {
  // ... existing fields ...
  name?: string          // "Job for Mjellma Berisha"
  jobNumber?: string     // "20288"
  scheduledEndAt?: string  // ISO — end of appointment
  attachments?: Attachment[]
}
```

---

## Critical files

| File | Change |
|------|--------|
| `src/entities/job/model/types.ts` | Add 5 new fields + Attachment interface |
| `src/shared/lib/index.ts` | Add `generateJobNumber` |
| `src/widgets/timeline-grid/lib/timeUtils.ts` | Add `isoToBlockHeight` |
| `src/widgets/timeline-grid/ui/JobBlock.tsx` | Dynamic height + column layout props |
| `src/widgets/timeline-grid/ui/TimelineGrid.tsx` | Overlap detection algorithm |
| `src/widgets/create-job-modal/ui/CreateJobModal.tsx` | Save endAt, name, jobNumber |
| `src/pages/jobs/JobDetailPage.tsx` | Full rewrite (new card layout) |
| `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx` | Add "Apply to Invoice" button + confirm flow |
| `src/widgets/attachments-widget/ui/AttachmentsWidget.tsx` | New file |
| `src/shared/api/seed.ts` | Add new fields to seed data |

## Reused without change
- `InvoiceWidget` — embedded as-is in new job page layout
- `EstimateWidget` — embedded as-is (EstimateDetailModal gets the Apply button)
- `NotesWidget` — embedded as-is
- `AppModal` — used for edit-name, edit-number, status, summary, reschedule, attachment modals
- `ConfirmDialog` — used in attachment delete and "Apply to Invoice" confirmation
