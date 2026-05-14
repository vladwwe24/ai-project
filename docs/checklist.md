# ApplianceTrack — Development Checklist

Track progress step by step. Mark each step ✅ Done only after:
1. `npm run dev` runs without console errors
2. `npm run type-check` passes with zero errors
3. Manually verified in browser at 390px width

---

## Steps

- [x] **Step 1** — Project Scaffolding + Docs
  - Vite + React + TypeScript initialized
  - Path alias `@/` configured in vite.config.ts and tsconfig.app.json
  - All dependencies installed (Chakra UI, react-router-dom, nanoid, react-icons, sass)
  - `docs/architecture.md` created
  - `docs/checklist.md` created
  - `src/app/providers/AppProvider.tsx` with ChakraProvider
  - `src/app/styles/global.scss` global styles
  - Dev server runs without errors

- [x] **Step 2** — TypeScript Types
  - `src/entities/customer/model/types.ts`
  - `src/entities/job/model/types.ts` (includes COMPLETED status)
  - `src/entities/estimate/model/types.ts`
  - `src/entities/invoice/model/types.ts`
  - `src/entities/line-item/model/types.ts`
  - `src/shared/config/storageKeys.ts`

- [x] **Step 3** — localStorage Service Layer
  - `src/shared/api/storage.ts` (getAll, getById, create, update, remove)
  - `src/shared/lib/index.ts` (nanoid, formatCurrency, formatDate, generateInvoiceNumber, generateEstimateNumber)
  - Sample data seeded on first load

- [x] **Step 4** — React Context + useReducer Store
  - `src/app/providers/AppProvider.tsx` (full context + reducer; localStorage persistence via useEffect — reducers are pure, no storage side effects)
  - `src/entities/customer/model/slice.ts`
  - `src/entities/job/model/slice.ts`
  - State initialized from localStorage on mount

- [x] **Step 5** — Routing + App Shell
  - All routes defined in `src/app/index.tsx`
  - `src/widgets/app-shell/ui/AppShell.tsx`
  - `src/widgets/app-shell/ui/Navbar.tsx`
  - `src/widgets/app-shell/ui/Sidebar.tsx`
  - `src/widgets/app-shell/ui/BottomNav.tsx` (react-icons)
  - Placeholder pages for all routes
  - Mobile bottom nav / desktop sidebar responsive

- [x] **Step 6** — Shared UI Components
  - `src/entities/job/ui/JobStatusBadge.tsx`
  - `src/entities/job/ui/PriorityBadge.tsx`
  - `src/entities/estimate/ui/EstimateStatusBadge.tsx`
  - `src/entities/invoice/ui/InvoiceStatusBadge.tsx`
  - `src/shared/ui/EmptyState.tsx`
  - `src/shared/ui/ConfirmDialog.tsx`
  - `src/shared/ui/PageHeader.tsx`

- [x] **Step 7** — Dashboard Page
  - `src/pages/dashboard/DashboardPage.tsx`
  - Job counter stat cards
  - Earnings summary
  - Action-required jobs list

- [x] **Step 8** — Settings Page
  - `src/pages/settings/SettingsPage.tsx`
  - `src/shared/config/settings.ts`
  - Default Tax Rate field

- [x] **Step 9** — Customer Module
  - `src/pages/customers/CustomerListPage.tsx` (search by name/phone)
  - `src/pages/customers/CustomerFormPage.tsx`
  - `src/pages/customers/CustomerDetailPage.tsx`
  - `src/entities/customer/model/slice.ts` (finalized)
  - `src/entities/customer/ui/CustomerCard.tsx`

- [x] **Step 10** — Job Module
  - `src/pages/jobs/JobListPage.tsx`
  - `src/pages/jobs/JobDetailPage.tsx` (header → invoice → estimate → photos → notes)
  - `src/entities/job/model/slice.ts` (finalized)
  - `src/entities/job/model/statusHelpers.ts`
  - `src/features/job-status/ui/StatusActionBar.tsx`
  - `src/widgets/job-card/ui/JobCard.tsx`

- [x] **Step 11** — Timeline + Create Job Modal
  - `src/pages/timeline/TimelinePage.tsx`
  - `src/widgets/timeline-grid/ui/TimelineGrid.tsx` (12am–12am full 24h)
  - `src/widgets/timeline-grid/ui/DateStrip.tsx` (scrollable month days)
  - `src/widgets/timeline-grid/ui/JobBlock.tsx`
  - `src/widgets/timeline-grid/lib/timeUtils.ts`
  - `src/widgets/create-job-modal/ui/CreateJobModal.tsx`

- [x] **Step 12** — Estimate Widget
  - `src/entities/estimate/model/types.ts` — added `estimateNumber: string`, `approvedBy?: string`
  - `src/entities/estimate/model/calcHelpers.ts` — subtotal, tax, total helpers
  - `src/entities/estimate/model/slice.ts` — pure reducer; `selectEstimatesByJob` (array, multiple per job), `selectEstimateByToken`
  - `src/widgets/line-item-editor/ui/LineItemRow.tsx` — editable/read-only row
  - `src/widgets/line-item-editor/ui/LineItemEditor.tsx` — row list + Add item button
  - `src/widgets/estimate-widget/ui/EstimateWidget.tsx` — list of estimate cards per job; MdAdd button always in header; `selectedId` + `modalOpen` decoupled state
  - `src/widgets/estimate-widget/ui/EstimateDetailModal.tsx` — Chakra v3 Dialog with `lazyMount`+`unmountOnExit`; editable line items + tax; Save / Send / Delete; approval link on sent
  - `src/features/estimate-send/ui/SendEstimateButton.tsx` — generates token, sets status SENT, copies approval link
  - `src/features/estimate-approve/ui/ApprovalForm.tsx` — public approve/decline form
  - `src/pages/estimates/PublicApprovalPage.tsx` — no-shell page at `/approve/:token`
  - `src/pages/jobs/JobDetailPage.tsx` — estimate placeholder replaced with `<EstimateWidget>`
  - `src/app/providers/AppProvider.tsx` — `estimates` slice added; all reducers now pure (storage writes moved to useEffect)
  - Multiple estimates allowed per job (design change from original spec)

- [x] **Step 13** — Invoice Widget
  - `src/entities/invoice/model/types.ts` — added `InvoiceStatus` const object + `status` field
  - `src/entities/invoice/model/slice.ts` — pure reducer (ADD/UPDATE); `selectInvoiceByJob`, `selectInvoicesByStatus`
  - `src/entities/invoice/ui/InvoiceStatusBadge.tsx` — updated to use full status range
  - `src/app/providers/AppProvider.tsx` — `invoices` slice added; overdue detection on mount; persistence useEffect
  - `src/widgets/create-job-modal/ui/CreateJobModal.tsx` — auto-dispatches `invoice/ADD` with "Inspection" line item
  - `src/widgets/invoice-widget/ui/InvoiceWidget.tsx` — inline widget: editable line items, tax, totals, Import from Estimate
  - `src/features/invoice-payment/ui/PaymentActionBar.tsx` — Mark Paid / Mark Partial buttons
  - `src/pages/jobs/JobDetailPage.tsx` — invoice placeholder replaced with `<InvoiceWidget>`
  - `src/pages/invoices/InvoiceListPage.tsx` — full list with status filter, sorted by date desc
  - `src/shared/api/seed.ts` — seed invoices now include `status: InvoiceStatus.UNPAID`

- [x] **Step 14** — CSV Export
  - `src/features/export/lib/csvExport.ts` — filters by date range, builds CSV string, triggers download
  - `src/features/export/ui/ExportModal.tsx` — date range pickers, live row count preview, Download CSV button
  - `src/pages/invoices/InvoiceListPage.tsx` — Export CSV button in header opens modal

- [x] **Step 15** — Polish, Responsive QA & Tests
  - Vitest + happy-dom configured; 29 unit tests passing (storage, statusHelpers, calcHelpers)
  - `src/shared/ui/ErrorBoundary.tsx` — class component with "Try again" reset; wired into AppShell around `<Outlet>`
  - `src/pages/invoices/InvoiceListPage.tsx` — empty state now uses `<EmptyState>` component
  - `src/pages/dashboard/DashboardPage.tsx` — invoices now read from context (live, not stale storage); earnings use `InvoiceStatus` not `paidAt`
  - Touch targets: Chakra `Button size="md"` (40px) used for primary actions; cards have min-height via padding
  - All list pages have empty states: Customers ✅ Jobs ✅ Invoices ✅ Dashboard action-required ✅

---

## End-to-End Verification

- [ ] Dashboard shows zeroes on fresh data
- [ ] Create customer → open timeline → tap slot → create job
- [ ] Job detail: status flows correctly
- [ ] Create estimate → add line items → send → approve via public link
- [ ] Create invoice → mark paid → earnings update on dashboard
- [ ] Export invoice list as CSV with date range
- [ ] Customer search by phone and by name
