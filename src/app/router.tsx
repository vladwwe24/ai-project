import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/widgets/app-shell/ui/AppShell'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { CustomerListPage } from '@/pages/customers/CustomerListPage'
import { CustomerFormPage } from '@/pages/customers/CustomerFormPage'
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage'
import { JobListPage } from '@/pages/jobs/JobListPage'
import { JobDetailPage } from '@/pages/jobs/JobDetailPage'
import { TimelinePage } from '@/pages/timeline/TimelinePage'
import { InvoiceListPage } from '@/pages/invoices/InvoiceListPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { PublicApprovalPage } from '@/pages/estimates/PublicApprovalPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'customers', element: <CustomerListPage /> },
      { path: 'customers/new', element: <CustomerFormPage /> },
      { path: 'customers/:id', element: <CustomerDetailPage /> },
      { path: 'customers/:id/edit', element: <CustomerFormPage /> },
      { path: 'jobs', element: <JobListPage /> },
      { path: 'jobs/:id', element: <JobDetailPage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'invoices', element: <InvoiceListPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/approve/:token',
    element: <PublicApprovalPage />,
  },
])
