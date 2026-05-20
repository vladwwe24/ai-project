# Sprint 4 Plan — Estimates/Invoices Sync, Payment Logic & UI Standardization

## Pre-flight

**Before S4-1:** Copy this plan to `docs/plan-v4.md` in the project repo (mirrors the sprint planning convention of plan.md / plan-v2.md / plan-v3.md).

---

## Per-step verification workflow

After **every step** (S4-1 through S4-6):
1. `npm run build` — must be zero TypeScript errors
2. `npm run dev` — dev server must start cleanly
3. Open browser at `http://localhost:5173` (390px viewport) — walk the affected flows
4. Open DevTools Console — zero red errors
5. Ask: **"Ready for next step?"** and wait for go-ahead before starting the next step

---

## Context

ApplianceTrack has completed Sprints 1–3. Pain points to fix:
- Estimates have a flat line-item list with no Labor/Materials split and no per-item taxable (should mirror invoices exactly)
- "Apply to Invoice" replaces all invoice items — must change to append so multiple estimates can combine onto one invoice
- Invoices are read-only once Paid/Partial — blocking legitimate post-payment edits
- No `paidAmount` stored when marking fully Paid, so validation and display of "paid so far" are impossible
- Action button styles are inconsistent; card borders/shadows are inconsistent project-wide

---

## Steps

### S4-1 — Fix `markPaid` to store `paidAmount` + show paid amount in UI

**File:** `src/features/invoice-payment/ui/PaymentActionBar.tsx`

- Import calc helpers from `@/entities/estimate/model/calcHelpers`
- In `markPaid()`: compute `total` from `invoice.lineItems` + `invoice.taxRate` → include `paidAmount: total` in the `invoice/UPDATE` payload alongside `paidAt` and `status: PAID`
- `markPartial()` already stores `paidAmount` — no change needed there

**File:** `src/widgets/invoice-widget/ui/InvoiceWidget.tsx` (Totals section)

Add a "Paid" display row below the Total row when `invoice.paidAmount` is set:
```
Total          $340.00
Paid           $340.00   ← new row, shown only when paidAmount exists
Balance due    $  0.00   ← new row: total - paidAmount (shown when paidAmount < total)
```
Use green text for Paid, orange/red for Balance due when > 0.

---

### S4-2 — Create `SectionedLineItemEditor` shared component

**New file:** `src/widgets/line-item-editor/ui/SectionedLineItemEditor.tsx`

Interface:
```ts
interface Props {
  lineItems: LineItem[]
  readOnly?: boolean
  onChange: (items: LineItem[]) => void
}
```

Behavior:
- **Labor section** = items where `item.category !== 'material'` (catches both `'labor'` and any legacy items with no category set)
- **Materials section** = items where `item.category === 'material'`
- Items are **always created with a category** set by which section's `+` was tapped — there is no ambiguous state for new items
- Per-item `taxable` checkbox sub-row in edit mode for **both** sections (estimates and invoices are structurally identical — both can have taxable line items)
- Tax display in both uses `calcTaxableSubtotal` (items where `taxable !== false`)
- `+ Item` button: circular `IconButton` with `MdAdd` icon (`size="xs"`, `variant="ghost"`, `borderRadius="full"`, `colorPalette="blue"`) placed right of the section label
- `addItem(category)` creates: `{ id: nanoid(), description: '', quantity: 1, unitPrice: 0, taxable: true, category }`
- Each section shows column headers (Description / Qty / Price / Total) + rows using `LineItemRow` + taxable checkbox sub-row

**Delete:** `src/widgets/line-item-editor/ui/LineItemEditor.tsx` — becomes unused after S4-3

---

### S4-3 — Both estimate and invoice use `SectionedLineItemEditor`; unify tax logic

**`src/entities/line-item/model/types.ts`:**
- Remove the `// invoice-only` comment from `category` — both estimates and invoices have categories and taxable items

**`src/widgets/estimate-widget/ui/EstimateDetailModal.tsx`:**
- Replace `LineItemEditor` import with `SectionedLineItemEditor`
- Replace `<LineItemEditor ...>` with `<SectionedLineItemEditor lineItems={lineItems} readOnly={!isEditable} onChange={handleLineItemsChange} />`
- Change tax calculation from `calcSubtotal(lineItems)` → `calcTaxableSubtotal(lineItems)` before `calcTax` (now estimates are taxed the same way as invoices — only taxable items contribute to tax)

**`src/widgets/invoice-widget/ui/InvoiceWidget.tsx`:**
- Remove inline `RowView`, `RowEdit`, `Section` components
- Import `SectionedLineItemEditor`
- Replace both `<Section title="Labor" …>` / `<Section title="Materials" …>` blocks with:
  ```tsx
  <SectionedLineItemEditor
    lineItems={lineItems}
    readOnly={!editMode}
    onChange={items => { setLineItems(items); setDirty(true) }}
  />
  ```

---

### S4-4 — Multiple estimates → one invoice (append, not replace)

**`src/widgets/estimate-widget/ui/EstimateDetailModal.tsx`:**
- `handleApplyToInvoice()`: change to **append**:
  ```ts
  lineItems: [...invoice.lineItems, ...lineItems.map(i => ({ ...i, id: nanoid() }))]
  ```
- Update `ConfirmDialog` message: `"This will add this estimate's items to the invoice. Existing items are kept."`
- Add imports: `InvoiceStatus` from `@/entities/invoice/model/types`, calc helpers
- After building `newLineItems`, compute `newTotal`; if `invoice.status === PAID && newTotal > (invoice.paidAmount ?? 0)` → include `status: InvoiceStatus.PARTIAL` in the dispatch payload

**`src/widgets/invoice-widget/ui/InvoiceWidget.tsx`:**
- Remove the `approvedEstimate` lookup, `handleImportFromEstimate()`, and "Import from Estimate" `<Button>` — superseded by the per-estimate "Apply to Invoice" button

---

### S4-5 — Invoice editing when Paid/Partial + payment validation + auto-PARTIAL

**`src/widgets/invoice-widget/ui/InvoiceWidget.tsx`:**

1. **Unlock editing:** replace `isPaid` (blocks edit for PAID + CANCELLED) with `isLocked` (only CANCELLED blocks):
   ```ts
   const isLocked = invoice?.status === InvoiceStatus.CANCELLED
   ```

2. **Validation state:** `const [validationError, setValidationError] = useState<string | null>(null)`

3. **`handleSave()` — validation + auto-PARTIAL:**
   ```ts
   const newTotal = calcTotal(calcSubtotal(lineItems), calcTax(calcTaxableSubtotal(lineItems), taxRate))
   const paid = invoice.paidAmount ?? 0
   const hasPaid = invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.PARTIAL

   if (hasPaid && newTotal < paid) {
     setValidationError(`Total cannot be less than amount already paid (${formatCurrency(paid)})`)
     return
   }
   let newStatus = invoice.status
   if (invoice.status === InvoiceStatus.PAID && newTotal > paid) {
     newStatus = InvoiceStatus.PARTIAL
   }
   setValidationError(null)
   dispatch({ type: 'invoice/UPDATE', payload: { ...invoice, lineItems, taxRate, status: newStatus, updatedAt: new Date().toISOString() } })
   setDirty(false); setEditMode(false)
   ```

4. **Show error in edit-mode actions block:**
   ```tsx
   {validationError && <Text fontSize="xs" color="red.500" w="full">{validationError}</Text>}
   ```

5. **Fix `useEffect`**: remove `isLocked` from conditions that force-exit edit mode; only exit when `isLocked` becomes true (was exiting for isPaid, which we no longer want).

---

### S4-6 — UI/UX standardization

#### Payment buttons — keep semantic colors, make pill-shaped with light variant

**`src/features/invoice-payment/ui/PaymentActionBar.tsx`:**
- "Mark Partial" button: add `borderRadius="full" variant="subtle"` (keep `colorPalette="yellow"`)
- "Mark Paid" button: add `borderRadius="full" variant="subtle"` (keep `colorPalette="green"`)
- "Confirm Deposit" button inside modal: same — `borderRadius="full" variant="subtle"` (keep `colorPalette="yellow"`)

#### Status badge colors — no change (semantic: green=paid, red=overdue, etc.)

#### Project-wide card shadow audit

Replace `borderWidth="1px" borderRadius="md"` with `boxShadow="sm" borderRadius="xl"` on **top-level card containers** (widgets/sections that sit directly on the page background). Inner list items keep `borderWidth="1px" borderRadius="md"`.

Files to audit and update (top-level card containers):
- `src/widgets/invoice-widget/ui/InvoiceWidget.tsx` — outer `<Box>`
- `src/widgets/estimate-widget/ui/EstimateWidget.tsx` — outer `<Box>` (individual estimate list-item boxes inside stay bordered)
- `src/widgets/notes-widget/ui/NotesWidget.tsx` — check outer container
- `src/widgets/attachments-widget/ui/AttachmentsWidget.tsx` — check outer container
- `src/pages/customers/CustomerDetailPage.tsx` — check section cards
- `src/pages/invoices/InvoiceListPage.tsx` — check list item cards
- `src/pages/jobs/JobListPage.tsx` — check job card containers
- `src/entities/customer/ui/CustomerCard.tsx` — check outer `<Box>`

Rule: same container type → same shadow/border style. Top-level page cards use `boxShadow="sm" borderRadius="xl"`; nested list items use `borderWidth="1px" borderRadius="md"`.

---

## Critical constraints to preserve

- **Reducer purity** — no localStorage in reducers; all in `AppProvider` `useEffect`
- **AppModal only** — no raw `DialogRoot` outside `AppModal`/`ConfirmDialog`
- **closeModal pattern** — only `setModalOpen(false)` in `closeModal()`; never clear `selectedId` simultaneously
- **Chakra v3** — `colorPalette` not `colorScheme`; `lazyMount + unmountOnExit` on every `DialogRoot`
- **TypeScript strict** — zero errors from `npm run build` before done
- **LineItem.category** — two possible values only: `'labor'` (default for Labor section) and `'material'`; filter rule: `!== 'material'` → Labor, `=== 'material'` → Materials

---

## Files touched

| File | Action |
|------|--------|
| `src/entities/line-item/model/types.ts` | Edit — remove "invoice-only" comment |
| `src/widgets/line-item-editor/ui/SectionedLineItemEditor.tsx` | **Create new** |
| `src/widgets/line-item-editor/ui/LineItemEditor.tsx` | **Delete** |
| `src/widgets/invoice-widget/ui/InvoiceWidget.tsx` | Major refactor |
| `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx` | Major refactor |
| `src/widgets/estimate-widget/ui/EstimateWidget.tsx` | Outer box shadow |
| `src/widgets/notes-widget/ui/NotesWidget.tsx` | Shadow audit |
| `src/widgets/attachments-widget/ui/AttachmentsWidget.tsx` | Shadow audit |
| `src/features/invoice-payment/ui/PaymentActionBar.tsx` | paidAmount fix + pill buttons |
| `src/pages/jobs/JobListPage.tsx` | Shadow audit |
| `src/pages/customers/CustomerDetailPage.tsx` | Shadow audit |
| `src/pages/invoices/InvoiceListPage.tsx` | Shadow audit |
| `src/entities/customer/ui/CustomerCard.tsx` | Shadow audit |

---

## Verification

1. `npm run build` — zero TypeScript errors
2. `npm run dev` → open at `http://localhost:5173` at 390px
3. Clear localStorage (DevTools → Application → Storage → Clear All) to re-seed

**Key flows to test:**
- Create estimate → add 2 labor + 1 material items → taxable checkbox per row → sections display correctly
- Apply estimate to invoice → items **append**, existing items preserved
- Apply second estimate to same invoice → both estimates' items present
- Mark invoice Paid → then edit → add line item → status auto-changes to Partial; "Paid / Balance due" rows update
- Edit paid invoice → reduce total below paidAmount → error shown, Save blocked
- Mark invoice Partial ($50 deposit) → try to reduce total to $40 → blocked with error
- Payment buttons are pill-shaped with light colors (green/yellow retained, pill style added)
- All top-level card sections (Job Schedule, Status, Customer, Invoice, Estimates, Notes, Attachments) have matching `boxShadow="sm" borderRadius="xl"` on job detail page
