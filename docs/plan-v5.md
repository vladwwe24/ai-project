# Sprint 5 Plan — Dark/Light Mode Consistency + Full Color Extraction

## Per-step verification workflow

After **every step** (S5-1 through S5-10):
1. `npm run build` — must be zero TypeScript errors
2. `npm run dev` — dev server must start cleanly
3. Open browser at `http://localhost:5173` (390px viewport) — walk the affected flows in both light and dark mode
4. Open DevTools Console — zero red errors
5. Ask: **"Ready for next step?"** and wait for go-ahead before starting the next step

---

## Context

ApplianceTrack has a CSS custom property theme system (`--app-bg`, `--app-surface`, etc.) in `_theme-light.scss` and `_theme-dark.scss`. The `.dark` class on `<html>` switches themes.

Two problems to fix:

1. **Visual bugs in dark mode:**
   - `AppModal` (`DialogContent`) has no background → appears fully black
   - 3 cards on Job Detail page have `bg="white"` → appear white on dark navy background
   - Timeline job blocks use `bg="blue.100"` → too light in dark mode
   - Native `<select>` filters on Job List and Invoice List use `background: 'white'`
   - Autocomplete dropdowns in modals use `bg="white"`
   - Export modal date inputs use `background: 'white'`

2. **No central color control:** Status badge colors, semantic text colors, and info/success/error banner colors are hardcoded Chakra tokens scattered across the codebase (`colorPalette="green"`, `color="green.600"`, `bg="green.50"`). Goal: every color controllable from `_theme-light.scss` and `_theme-dark.scss` only.

---

## Steps

### S5-1 — Extend theme files with all CSS custom properties

**Files:** `src/app/styles/_theme-light.scss`, `src/app/styles/_theme-dark.scss`

These two files become the **single source of truth** for every color in the app.

Add to `_theme-light.scss` (`:root, [data-theme='light']`):

```scss
/* semantic text colors */
--color-success: #16a34a;
--color-warning: #d97706;
--color-error:   #dc2626;
--color-info:    #2563eb;

/* status badge bg + fg — 9 semantic groups */
--badge-success-bg: #dcfce7;  --badge-success-fg: #15803d;
--badge-danger-bg:  #fee2e2;  --badge-danger-fg:  #b91c1c;
--badge-warning-bg: #fef9c3;  --badge-warning-fg: #854d0e;
--badge-info-bg:    #dbeafe;  --badge-info-fg:    #1d4ed8;
--badge-neutral-bg: #f3f4f6;  --badge-neutral-fg: #4b5563;
--badge-orange-bg:  #ffedd5;  --badge-orange-fg:  #c2410c;
--badge-purple-bg:  #ede9fe;  --badge-purple-fg:  #6d28d9;
--badge-teal-bg:    #ccfbf1;  --badge-teal-fg:    #0f766e;
--badge-cyan-bg:    #cffafe;  --badge-cyan-fg:    #0e7490;

/* status banners (inline info/success/error message boxes) */
--banner-info-bg:    #eff6ff;  --banner-info-fg:    #1d4ed8;
--banner-success-bg: #f0fdf4;  --banner-success-fg: #166534;
--banner-error-bg:   #fef2f2;  --banner-error-fg:   #dc2626;

/* timeline job block */
--job-block-bg:       #bfdbfe;
--job-block-hover-bg: #93c5fd;
--job-block-border:   #3b82f6;
--job-block-fg:       #1e3a5f;
```

Add to `_theme-dark.scss` (`.dark`) — same variable names, dark-palette values:

```scss
/* semantic text colors */
--color-success: #4ade80;
--color-warning: #fb923c;
--color-error:   #f87171;
--color-info:    #60a5fa;

/* status badge bg + fg */
--badge-success-bg: #14532d;  --badge-success-fg: #86efac;
--badge-danger-bg:  #450a0a;  --badge-danger-fg:  #fca5a5;
--badge-warning-bg: #422006;  --badge-warning-fg: #fcd34d;
--badge-info-bg:    #1e3a5f;  --badge-info-fg:    #93c5fd;
--badge-neutral-bg: #1f2937;  --badge-neutral-fg: #9ca3af;
--badge-orange-bg:  #431407;  --badge-orange-fg:  #fdba74;
--badge-purple-bg:  #2e1065;  --badge-purple-fg:  #c4b5fd;
--badge-teal-bg:    #042f2e;  --badge-teal-fg:    #5eead4;
--badge-cyan-bg:    #083344;  --badge-cyan-fg:    #67e8f9;

/* status banners */
--banner-info-bg:    #0c1a3d;  --banner-info-fg:    #93c5fd;
--banner-success-bg: #052e16;  --banner-success-fg: #86efac;
--banner-error-bg:   #1a0000;  --banner-error-fg:   #fca5a5;

/* timeline job block */
--job-block-bg:       #1e3a5f;
--job-block-hover-bg: #1a3358;
--job-block-border:   #3b82f6;
--job-block-fg:       #bfdbfe;
```

**Verification:** `npm run build` — zero errors. No visual change yet (vars unused).

---

### S5-2 — Fix `AppModal` black background

**File:** `src/shared/ui/AppModal.tsx` (line 39)

`DialogContent` has no explicit background; Chakra's default in dark mode renders black.

```tsx
// before
<DialogContent maxW={maxW} w="full" mx={4}>

// after
<DialogContent maxW={maxW} w="full" mx={4} style={{ background: 'var(--app-surface)' }}>
```

**Verification:** Open any modal (Create Job, Estimate detail, etc.) in dark mode — background must be navy (`#16213e`), not black.

---

### S5-3 — Status badge components → CSS vars

Replace Chakra's `colorPalette` prop (hardcoded color string) with inline `style` overrides using the new CSS vars. Keeps `variant="subtle"` for Chakra's sizing/padding/border-radius.

**`src/entities/job/ui/JobStatusBadge.tsx`**

Replace `colorMap` (Chakra palette names) with `varMap` (CSS var key names):

```tsx
const varMap: Record<JobStatus, string> = {
  NEW:           'neutral',
  SCHEDULED:     'info',
  IN_PROGRESS:   'warning',
  WAITING_PARTS: 'purple',
  ESTIMATE_SENT: 'cyan',
  APPROVED:      'teal',
  INVOICED:      'orange',
  PAID:          'success',
  COMPLETED:     'neutral',
  CANCELLED:     'danger',
}

export function JobStatusBadge({ status }: Props) {
  const k = varMap[status]
  return (
    <Badge variant="subtle" style={{
      background: `var(--badge-${k}-bg)`,
      color: `var(--badge-${k}-fg)`,
    }}>
      {labelMap[status]}
    </Badge>
  )
}
```

**`src/entities/invoice/ui/InvoiceStatusBadge.tsx`**

```tsx
const varMap: Record<string, string> = {
  UNPAID:    'orange',
  PARTIAL:   'warning',
  PAID:      'success',
  OVERDUE:   'danger',
  CANCELLED: 'neutral',
}
// same Badge + style pattern
```

**`src/entities/estimate/ui/EstimateStatusBadge.tsx`**

```tsx
const varMap: Record<EstimateStatus, string> = {
  DRAFT:    'neutral',
  SENT:     'info',
  APPROVED: 'success',
  REJECTED: 'danger',
}
// same Badge + style pattern
```

**Verification:** All status badge colors appear correct in both modes across Job List, Invoice List, Estimate widget.

---

### S5-4 — Fix `JobDetailPage` white cards, hero, and buttons

**File:** `src/pages/jobs/JobDetailPage.tsx`

| Line | Current | Fix |
|------|---------|-----|
| 149 | `bg="gray.200"` (hero area) | `style={{ background: 'var(--app-surface)' }}` |
| 164 | `bg="whiteAlpha.900"` (back button) | remove `bg` prop; add `variant="ghost"` |
| 174 | `bg="whiteAlpha.900"` (more button) | same |
| 190 | `color="gray.500"` (icon) | `color="fg.muted"` |
| 194 | `color="gray.600"` (address text) | `color="fg.muted"` |
| 226 | `bg="white"` (appointment card) | `style={{ background: 'var(--app-surface)' }}` |
| 267 | `bg="white"` (job status card) | `style={{ background: 'var(--app-surface)' }}` |
| 289 | `bg="white"` (customer card) | `style={{ background: 'var(--app-surface)' }}` |

**Verification:** In dark mode, all 3 cards must be navy (`#16213e`), not white.

---

### S5-5 — Fix native `<select>` filter backgrounds

**`src/pages/invoices/InvoiceListPage.tsx`** (line 61)
**`src/pages/jobs/JobListPage.tsx`** (line 63)

Both have `background: 'white'` in the inline style object on the `<select>`:

```tsx
// before
background: 'white',

// after
background: 'var(--app-surface)',
color: 'inherit',
```

**Verification:** Status filter dropdowns on both list pages must appear dark-surfaced in dark mode.

---

### S5-6 — Fix autocomplete dropdown backgrounds

**`src/widgets/create-job-modal/ui/CreateJobModal.tsx`** (line 213)
**`src/features/create-customer/ui/CreateCustomerModal.tsx`** (line 224)

Both have `bg="white"` on the suggestion list `Box`:

```tsx
// before
<Box bg="white" ...>

// after
<Box style={{ background: 'var(--app-surface)' }} ...>
```

**Verification:** Open Create Job modal in dark mode, type in customer field — dropdown must be navy.

---

### S5-7 — Fix Export modal date input backgrounds

**File:** `src/features/export/ui/ExportModal.tsx`

The shared `inputStyle` object has `background: 'white'`:

```tsx
// before
background: 'white',

// after
background: 'var(--app-surface)',
color: 'inherit',
```

**Verification:** Open Export CSV modal in dark mode — date inputs must be dark-surfaced.

---

### S5-8 — Fix estimate status banners

**File:** `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx`

Three status message boxes use hardcoded Chakra light colors:

| Line | Current | Fix |
|------|---------|-----|
| 177 | `bg="blue.50"` (SENT box) | `style={{ background: 'var(--banner-info-bg)', color: 'var(--banner-info-fg)' }}` + remove `color=` from child `Text` elements |
| 194 | `bg="green.50"` (APPROVED box) | `style={{ background: 'var(--banner-success-bg)', color: 'var(--banner-success-fg)' }}` + remove `color=` from child `Text` |
| 206 | `bg="red.50"` (REJECTED box) | `style={{ background: 'var(--banner-error-bg)', color: 'var(--banner-error-fg)' }}` + remove `color=` from child `Text` |

**Verification:** Open any estimate that is SENT / APPROVED / REJECTED in dark mode — status banner must use dark palette, not washed-out light colors.

---

### S5-9 — Fix InvoiceWidget semantic text colors

**File:** `src/widgets/invoice-widget/ui/InvoiceWidget.tsx`

| Line | Current | Fix |
|------|---------|-----|
| 152–153 | `color="green.600"` (Paid row) | `style={{ color: 'var(--color-success)' }}` |
| 157–158 | `color="orange.600"` (Balance due row) | `style={{ color: 'var(--color-warning)' }}` |
| 170 | `color="red.500"` (validation error) | `style={{ color: 'var(--color-error)' }}` |

**Verification:** On a Paid invoice in dark mode — "Paid" text must be bright green, "Balance due" bright orange, both readable.

---

### S5-10 — Fix timeline job block colors

**File:** `src/widgets/timeline-grid/ui/JobBlock.tsx`

Replace hardcoded Chakra blue tokens with CSS vars. Because `_hover` with `style` doesn't work, add a `.job-block` CSS class and handle hover in `global.scss`.

**`JobBlock.tsx`** changes:
```tsx
// remove: bg="blue.100", _hover={{ bg: 'blue.200' }}
// add:
className="job-block"
style={{ background: 'var(--job-block-bg)', color: 'var(--job-block-fg)' }}
// borderLeftColor stays but use string instead of token:
borderLeftColor="var(--job-block-border)"  // or style={{ borderLeftColor: 'var(--job-block-border)' }}
```

**`src/app/styles/global.scss`** — add:
```scss
.job-block:hover {
  background: var(--job-block-hover-bg) !important;
}
```

**Verification:** Timeline in dark mode — job blocks must be dark navy, not light blue. Hover must darken them slightly.

---

## Files Modified (15 total)

| File | Step |
|------|------|
| `src/app/styles/_theme-light.scss` | S5-1 |
| `src/app/styles/_theme-dark.scss` | S5-1 |
| `src/shared/ui/AppModal.tsx` | S5-2 |
| `src/entities/job/ui/JobStatusBadge.tsx` | S5-3 |
| `src/entities/invoice/ui/InvoiceStatusBadge.tsx` | S5-3 |
| `src/entities/estimate/ui/EstimateStatusBadge.tsx` | S5-3 |
| `src/pages/jobs/JobDetailPage.tsx` | S5-4 |
| `src/pages/invoices/InvoiceListPage.tsx` | S5-5 |
| `src/pages/jobs/JobListPage.tsx` | S5-5 |
| `src/widgets/create-job-modal/ui/CreateJobModal.tsx` | S5-6 |
| `src/features/create-customer/ui/CreateCustomerModal.tsx` | S5-6 |
| `src/features/export/ui/ExportModal.tsx` | S5-7 |
| `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx` | S5-8 |
| `src/widgets/invoice-widget/ui/InvoiceWidget.tsx` | S5-9 |
| `src/widgets/timeline-grid/ui/JobBlock.tsx` + `global.scss` | S5-10 |

---

## Critical Notes

- **CSS vars only** — never add `bg="white"`, `background: 'white'`, or hardcoded Chakra color tokens after this sprint. Use `var(--app-surface)` for surfaces, `var(--badge-X-bg/fg)` for badges, `var(--color-X)` for semantic text.
- **`colorPalette` on Badge** is banned — use `style={{ background, color }}` overrides with CSS vars instead.
- **`_dark` Chakra prop is NOT used here** — we control all dark mode via the `.dark` class on `<html>` and CSS custom properties. Do not mix the two systems.
- **`fg.muted`, `fg.default`, `border.subtle`, `bg.subtle`** are Chakra semantic tokens that already adapt to dark mode correctly — these are fine to keep.
