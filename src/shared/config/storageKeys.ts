export const STORAGE_KEYS = {
  CUSTOMERS: 'appltrack_customers',
  JOBS: 'appltrack_jobs',
  ESTIMATES: 'appltrack_estimates',
  INVOICES: 'appltrack_invoices',
  SETTINGS: 'app_settings',
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]
