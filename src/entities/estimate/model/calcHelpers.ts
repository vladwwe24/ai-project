import type { LineItem } from '@/entities/line-item/model/types'

export function calcSubtotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}

export function calcTaxableSubtotal(lineItems: LineItem[]): number {
  return lineItems
    .filter(item => item.taxable !== false)
    .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}

export function calcTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100)
}

export function calcTotal(subtotal: number, tax: number): number {
  return subtotal + tax
}
