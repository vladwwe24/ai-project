import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { system } from '@chakra-ui/react/preset'
import type { Customer } from '@/entities/customer/model/types'
import type { Job } from '@/entities/job/model/types'
import type { Estimate } from '@/entities/estimate/model/types'
import type { Invoice } from '@/entities/invoice/model/types'
import { InvoiceStatus } from '@/entities/invoice/model/types'
import { customerReducer, type CustomerAction } from '@/entities/customer/model/slice'
import { jobReducer, type JobAction } from '@/entities/job/model/slice'
import { estimateReducer, type EstimateAction } from '@/entities/estimate/model/slice'
import { invoiceReducer, type InvoiceAction } from '@/entities/invoice/model/slice'
import { storage } from '@/shared/api/storage'
import { STORAGE_KEYS } from '@/shared/config/storageKeys'

export interface AppState {
  customers: Customer[]
  jobs: Job[]
  estimates: Estimate[]
  invoices: Invoice[]
}

export type AppAction = CustomerAction | JobAction | EstimateAction | InvoiceAction

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function markOverdueInvoices(invoices: Invoice[]): Invoice[] {
  const now = Date.now()
  return invoices.map(inv => {
    if (
      (inv.status === InvoiceStatus.UNPAID || inv.status === InvoiceStatus.PARTIAL) &&
      now - new Date(inv.createdAt).getTime() > THIRTY_DAYS_MS
    ) {
      return { ...inv, status: InvoiceStatus.OVERDUE, updatedAt: new Date().toISOString() }
    }
    return inv
  })
}

function loadInitialState(): AppState {
  const rawInvoices = storage.getAll<Invoice>(STORAGE_KEYS.INVOICES)
  return {
    customers: storage.getAll<Customer>(STORAGE_KEYS.CUSTOMERS),
    jobs: storage.getAll<Job>(STORAGE_KEYS.JOBS),
    estimates: storage.getAll<Estimate>(STORAGE_KEYS.ESTIMATES),
    invoices: markOverdueInvoices(rawInvoices),
  }
}

function appReducer(state: AppState, action: AppAction): AppState {
  return {
    customers: customerReducer(state.customers, action as CustomerAction),
    jobs: jobReducer(state.jobs, action as JobAction),
    estimates: estimateReducer(state.estimates, action as EstimateAction),
    invoices: invoiceReducer(state.invoices, action as InvoiceAction),
  }
}

const AppStateContext = createContext<AppState | null>(null)
const AppDispatchContext = createContext<Dispatch<AppAction> | null>(null)

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}

export function useAppDispatch(): Dispatch<AppAction> {
  const ctx = useContext(AppDispatchContext)
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider')
  return ctx
}

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadInitialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(state.customers))
  }, [state.customers])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(state.jobs))
  }, [state.jobs])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(state.estimates))
  }, [state.estimates])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(state.invoices))
  }, [state.invoices])

  return (
    <ChakraProvider value={system}>
      <AppStateContext.Provider value={state}>
        <AppDispatchContext.Provider value={dispatch}>
          {children}
        </AppDispatchContext.Provider>
      </AppStateContext.Provider>
    </ChakraProvider>
  )
}
