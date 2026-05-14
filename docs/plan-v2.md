# ApplianceTrack — Sprint 2 Plan

**Sprint 1 status:** All 15 steps complete ✅  
**Sprint 2 goal:** UX polish, shared component system, form enhancements, Job page overhaul.

---

## GitHub Setup (run once before coding)

```bash
git remote add origin git@github.com:vladwwe24/appliance-repair-frontend.git
git branch -M main
git push -u origin main
```

---

## Development Rule

One step at a time. After each step:
1. `npm run type-check` — zero errors
2. `npm run dev` — no console errors
3. Verify in browser at **390px width**
4. Confirm ready before moving to next step

---

## Step S2-0 — Shared Modal Component

**Goal:** Create a single reusable modal wrapper used everywhere, fixing the `overflow: hidden; pointer-events: none` body leak that plagues `EstimateDetailModal`.

### Why This Exists
`CreateJobModal` works without body-lock issues. `EstimateDetailModal` does not. The fix is to extract the working Chakra v3 Dialog pattern into `AppModal` and migrate all modals to use it.

### Files
| Action | File |
|--------|------|
| Create | `src/shared/ui/AppModal.tsx` |
| Update | `src/shared/ui/index.ts` (add export) |

### AppModal Props
```ts
interface AppModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
  children: React.ReactNode
}
```

### Design
- Title — top-left, `DialogTitle`
- Close button (✕ icon) — top-right, calls `onClose`
- Body — `DialogBody`, renders `children`
- Footer — optional `footer` prop (action buttons go here)
- Always uses `lazyMount` + `unmountOnExit` on `DialogRoot`

---

## Step S2-1 — Estimate Widget: Bug Fixes + 6-Digit ID

**Goal:** Fix two crashes in the Estimate widget and change ID format.

### Bug 1 — Page becomes unclickable after closing modal
**Cause:** Chakra v3 dialog adds `overflow: hidden; pointer-events: none` to `<body>` but doesn't clean up if component unmounts without proper close animation.  
**Fix:** Migrate `EstimateDetailModal` to use `<AppModal>` (which has `lazyMount` + `unmountOnExit` baked in).

### Bug 2 — Delete estimate crashes with focus-trap error
**Cause:** Same modal unmount issue — dialog is removed from DOM while focus-trap is still active.  
**Fix:** Resolved by AppModal migration (same fix as Bug 1).

### ID Format Change
- **Before:** `EST-2024-0001`
- **After:** `000001` (zero-padded 6-digit number, no prefix)

### Files
| Action | File |
|--------|------|
| Update | `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx` |
| Update | `src/shared/lib/index.ts` — `generateEstimateNumber()` |
| Update | `src/widgets/estimate-widget/ui/EstimateWidget.tsx` |

### Verification
- Open estimate modal → close → page fully clickable ✓
- Create estimate → delete → no crash ✓
- New estimates show 6-digit IDs (e.g., `000001`) ✓

---

## Step S2-2 — Customer Creation Modal

**Goal:** Replace the `/customers/new` page navigation with a popup modal on the Customers list page. Add field validation and address autocomplete.

### Files
| Action | File |
|--------|------|
| Create | `src/features/create-customer/ui/CreateCustomerModal.tsx` |
| Update | `src/pages/customers/CustomerListPage.tsx` |

`CustomerFormPage.tsx` is kept for **editing** existing customers (no changes needed).

### Form Fields & Validation

| Field | Validation Rule |
|-------|----------------|
| Name | Letters, spaces, hyphens, apostrophes only — `/^[A-Za-z\s'-]+$/` |
| Phone | Digits only, auto-formatted to `111-111-1111` on input |
| Email | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` — show error on wrong format |
| Address | Nominatim autocomplete (see below) |
| Zip Code | Prefilled from Nominatim result; manually editable |
| State | Prefilled from Nominatim result; manually editable |

### Address Autocomplete — Nominatim (free, no API key)
1. Debounce address input by **400ms**
2. Call: `https://nominatim.openstreetmap.org/search?q=<encoded>&format=json&addressdetails=1&countrycodes=us&limit=5`
3. Show dropdown of `display_name` results
4. On selection:
   - Fill Address field with structured result
   - Extract `address.postcode` → Zip Code
   - Extract `address.state` → State
5. **Save Nominatim data, not the user's raw input**

### Component API
```ts
interface CreateCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (customerId: string) => void  // for preselecting after creation
}
```

---

## Step S2-3 — Job Creation Form Improvements

**Goal:** 4 targeted changes to `CreateJobModal`.

**File:** `src/widgets/create-job-modal/ui/CreateJobModal.tsx`

### Change 1 — "+ Customer" Quick-Create Button
- Place a `+ Customer` button directly next to the Customer field
- Clicking opens `<CreateCustomerModal>` within the job modal context
- On `onCreated(id)` callback → preselect that customer in the form
- Use local state `pendingCustomerId` to track this

### Change 2 — Remove "Describe the problem" Field
- Remove the `issue` input from the form entirely
- Make `issue?: string` optional in `src/entities/job/model/types.ts`
- No other references needed — notes cover this use case

### Change 3 — Start Time + End Time Fields
- Remove the single date-time picker
- Add two `<input type="time">` fields: **Start Time** and **End Time**
- Date comes from the selected date already passed to the modal
- When opened from timeline slot click (e.g., 10am → 11am block):
  - Start Time: `10:00`
  - End Time: `12:00` (two-hour default window)
- Both fields remain manually editable

### Change 4 — Searchable Customer Dropdown
- Replace native `<select>` with text input + filtered list
- As user types → filter customers by name (case-insensitive contains match)
- Selecting a result sets the internal customer ID
- Pattern: controlled text input + absolutely positioned dropdown list

---

## Step S2-4 — Job Page Overhaul

**File:** `src/pages/jobs/JobDetailPage.tsx`

### 4a — Remove Status Action Bar
- Remove `<StatusActionBar>` from the layout
- Statuses continue to change automatically through business actions:
  - Created → `SCHEDULED`
  - Estimate sent → `ESTIMATE_SENT`
  - Estimate approved → `APPROVED`
  - Invoice paid → `COMPLETED`
- `StatusActionBar.tsx` component can be deleted (no longer rendered anywhere)

### 4b — Reschedule Job
- Add a **Reschedule** button in the job header
- Opens `<AppModal>` with:
  - `<input type="date">` — new date
  - `<input type="time">` — new start time
  - `<input type="time">` — new end time
  - Save button → dispatches `job/UPDATE` with updated `scheduledAt`

---

## Step S2-5 — Invoice Widget (Inspection Widget) Overhaul

This is the largest step. Break into sub-tasks when implementing.

### Files
| Action | File |
|--------|------|
| Update | `src/widgets/invoice-widget/ui/InvoiceWidget.tsx` |
| Update | `src/widgets/line-item-editor/ui/LineItemRow.tsx` |
| Update | `src/widgets/line-item-editor/ui/LineItemEditor.tsx` |
| Update | `src/entities/line-item/model/types.ts` |
| Update | `src/features/invoice-payment/ui/PaymentActionBar.tsx` |
| Update | `src/entities/estimate/model/calcHelpers.ts` |

### 5a — View / Edit Mode Toggle
- **Default:** read-only (all values shown as plain text, no inputs)
- **Edit button** in top-right corner of widget → switches to edit mode
- Edit mode: inputs appear, tax field editable, Save button visible
- Save → dispatches `invoice/UPDATE`, returns to view mode

### 5b — Tax Value Layout Fix
- Tax row value cell: add `flex` / `minWidth: 0` so long values (e.g., `$123.45`) are not clipped by border

### 5c — Taxable Checkbox Per Line Item
- Add `taxable: boolean` to `LineItem` type (default: `true`)
- Each line item row shows a **Taxable** checkbox
- `calcTax()` in `calcHelpers.ts` only sums items where `taxable === true`
- Same change applies to estimates (shared `calcHelpers`)

### 5d — Labor / Materials Sections
- Add `category: 'labor' | 'material'` to `LineItem` type
- `InvoiceWidget` renders two named sections: **Labor** and **Materials**
- Each section has its own **+ Item** button (new item gets that category)
- Seed "Inspection" line item → category: `'labor'`
- Estimates do not use categories (invoice-only feature)

### 5e — Payment Confirmation Dialogs
- **Mark Paid:** `<ConfirmDialog>` — "Confirm full payment received?" → on confirm, dispatch PAID
- **Mark Partial:** `<AppModal>` — "How much was the deposit?" + number input → on confirm, dispatch PARTIAL with `paidAmount`
- Use existing `src/shared/ui/ConfirmDialog.tsx` for the full-payment case

### 5f — Paid → Job Auto-Completed
- When invoice is marked PAID: also dispatch `job/UPDATE` with `status: JobStatus.COMPLETED` and `completedAt: new Date().toISOString()`

---

## Step S2-6 — Notes Widget Redesign

**Goal:** Replace the current plain notes section with a card-based UI that has a collapsed preview and an expand-to-edit mode.

### Files
| Action | File |
|--------|------|
| Create | `src/widgets/notes-widget/ui/NotesWidget.tsx` |
| Update | `src/pages/jobs/JobDetailPage.tsx` |
| Update | `src/entities/job/model/types.ts` |
| Update | `src/shared/api/seed.ts` |

### Data Model Change
`notes` on `Job` changes from `string` to `Note[]`:
```ts
interface Note {
  id: string
  body: string
  createdAt: string
  updatedAt: string
}
```

### Collapsed State (default view)
```
[doc icon]  Private notes          [expand ↕]  [+ add]

  05/09/2026, 8:07 PM
  Appliance: KitchenAid Dishwasher
  Issue: leaking...
```
- Shows the most recent note's timestamp + truncated preview
- `+` button → opens edit mode for a new blank note
- Expand icon → opens the full list/edit view

### Expanded / Edit State
```
[✕]    Edit note    [⋮]    [Save]
────────────────────────────────
[editable textarea — full note body]
```
- ✕ → closes back to collapsed
- Save → dispatches `job/UPDATE` with updated notes array
- ⋮ menu → Delete note option (with confirmation)

---

## Type Changes Summary (Sprint 2)

| Entity | Field Added | Type | Default |
|--------|-------------|------|---------|
| `LineItem` | `taxable` | `boolean` | `true` |
| `LineItem` | `category` | `'labor' \| 'material'` | `'labor'` |
| `Job` | `issue` | `string?` (optional) | — |
| `Job` | `notes` | `Note[]` | `[]` |

---

## Critical Constraints (carried from Sprint 1)

- **Pure reducers** — no `localStorage` calls inside reducer functions; all persistence in `AppProvider` `useEffect`
- **Chakra v3** — always `lazyMount` + `unmountOnExit` on every `DialogRoot` / `AppModal`
- **TypeScript strict** — `noUnusedLocals` + `noUnusedParameters`; zero errors before marking step done
- **Native `<select>`** for any dropdowns not replaced by searchable input
- **Mobile-first** — verify at 390px after every step

---

## Step Order

| Step | Description |
|------|-------------|
| S2-0 | Shared `AppModal` component |
| S2-1 | Estimate widget: bug fixes + 6-digit ID |
| S2-2 | Customer creation modal + validations + address autocomplete |
| S2-3 | Job creation form: quick-create customer, remove issue field, time range, searchable dropdown |
| S2-4 | Job page: remove StatusActionBar + add reschedule |
| S2-5 | Invoice widget overhaul (view/edit, taxable, labor/materials, payment dialogs, auto-complete) |
| S2-6 | Notes widget redesign |
