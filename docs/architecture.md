# ApplianceTrack — Architecture

## Pattern: Feature Sliced Design (FSD)

FSD is a frontend architecture methodology that organizes code into a strict 6-layer hierarchy. The fundamental rule: **each layer may only import from layers below it**. No cross-slice imports within the same layer.

---

## Layer Hierarchy

```
src/
├── app/          Layer 1 — highest
├── pages/        Layer 2
├── widgets/      Layer 3
├── features/     Layer 4
├── entities/     Layer 5
└── shared/       Layer 6 — lowest
```

### Import Direction

```
app → pages → widgets → features → entities → shared
```

A slice in `features/` can import from `entities/` and `shared/`, but **never** from `pages/` or `widgets/`.

---

## Layers Explained

### `app/` — Application Setup
Global providers, styles, router. Entry point of the app.
- `providers/AppProvider.tsx` — ChakraProvider + RouterProvider + AppContextProvider
- `styles/global.scss` — global CSS reset and typography

### `pages/` — Full Screens
Route-level components. They assemble widgets and features into complete screens.
Each page is a thin composition layer — no business logic lives here.

```
pages/
├── dashboard/
├── customers/
├── jobs/
├── estimates/      # PublicApprovalPage (no shell)
├── invoices/
├── timeline/
└── settings/
```

### `widgets/` — Composite UI Blocks
Large, self-contained UI blocks that combine multiple features or entities.
Cannot import from `pages/`.

```
widgets/
├── app-shell/          # AppShell, Navbar, Sidebar, BottomNav
├── job-card/           # JobCard used in list + timeline
├── create-job-modal/   # Modal triggered from timeline
├── estimate-widget/    # Estimate section on JobDetailPage
├── invoice-widget/     # Invoice section on JobDetailPage
├── line-item-editor/   # Editable line-item table with totals
└── timeline-grid/      # Day grid + DateStrip
```

### `features/` — User Actions
Functional units that implement specific user interactions.
Cannot import from `widgets/` or `pages/`.

```
features/
├── customer-crud/      # Create/edit customer actions
├── job-status/         # Job status workflow transitions
├── estimate-send/      # Generate approval token, copy link
├── estimate-approve/   # Public approve/decline flow
├── invoice-payment/    # Mark paid/partial
└── export/             # CSV export with date range picker
```

### `entities/` — Business Domains
Data models, store slices, and simple display components.
Cannot import from `features/`, `widgets/`, or `pages/`.

```
entities/
├── customer/
│   ├── model/    # types.ts, slice.ts, selectors
│   └── ui/       # CustomerCard
├── job/
│   ├── model/    # types.ts, slice.ts, statusHelpers.ts
│   └── ui/       # JobStatusBadge, PriorityBadge
├── estimate/
│   ├── model/    # types.ts, slice.ts, calcHelpers.ts
│   └── ui/       # EstimateStatusBadge
├── invoice/
│   ├── model/    # types.ts, slice.ts, overdueCheck.ts
│   └── ui/       # InvoiceStatusBadge
└── line-item/
    ├── model/    # types.ts, lineItemCalc.ts
    └── ui/       # LineItemRow (read-only display)
```

### `shared/` — Low-Level Utilities
No business logic. Reusable across the entire codebase.

```
shared/
├── api/
│   └── storage.ts          # localStorage CRUD service
├── lib/
│   └── index.ts            # nanoid, formatCurrency, formatDate, generateInvoiceNumber
├── ui/
│   ├── ConfirmDialog.tsx
│   ├── EmptyState.tsx
│   └── PageHeader.tsx
└── config/
    ├── storageKeys.ts       # STORAGE_KEYS enum
    └── settings.ts          # getSettings / saveSettings
```

---

## Slice Segments

Within each slice (e.g., `features/customer-crud/`), code is organized by technical purpose:

| Segment | Purpose |
|---------|---------|
| `ui/`   | React components for this slice |
| `model/`| Business logic, types, state, reducers |
| `lib/`  | Internal utilities/hooks for this slice |
| `api/`  | Data fetching / storage calls |

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `JobStatusBadge.tsx` |
| Hooks | camelCase, `use` prefix | `useCustomers.ts` |
| Types/interfaces | PascalCase | `Customer`, `JobStatus` |
| Enums | PascalCase | `JobStatus.NEW` |
| Files (non-component) | camelCase | `calcHelpers.ts`, `storage.ts` |
| SASS modules | `*.module.scss` | `JobCard.module.scss` |

---

## State Management

Global state lives in `app/providers/AppProvider.tsx` using React Context + `useReducer`.
Each entity has its own slice file (`entities/*/model/slice.ts`) that defines:
- Action types
- Reducer case handler
- Selector functions

All reads/writes to localStorage go through `shared/api/storage.ts` — never access `localStorage` directly in components.

---

## Path Alias

All imports use the `@/` alias pointing to `src/`:

```ts
import { Customer } from '@/entities/customer/model/types'
import { storage } from '@/shared/api/storage'
```
