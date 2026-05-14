import type { Customer } from './types'

export type CustomerAction =
  | { type: 'customer/ADD'; payload: Customer }
  | { type: 'customer/UPDATE'; payload: Customer }

export function customerReducer(customers: Customer[], action: CustomerAction): Customer[] {
  switch (action.type) {
    case 'customer/ADD':
      return [...customers, action.payload]
    case 'customer/UPDATE':
      return customers.map(c => c.id === action.payload.id ? action.payload : c)
    default:
      return customers
  }
}

export const selectCustomerById = (customers: Customer[], id: string) =>
  customers.find(c => c.id === id)
