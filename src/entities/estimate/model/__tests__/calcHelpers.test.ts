import { describe, it, expect } from 'vitest'
import { calcSubtotal, calcTax, calcTotal } from '../calcHelpers'
import type { LineItem } from '@/entities/line-item/model/types'

function item(description: string, quantity: number, unitPrice: number): LineItem {
  return { id: '1', description, quantity, unitPrice, category: 'labor' as const }
}

describe('calcSubtotal', () => {
  it('returns 0 for empty list', () => {
    expect(calcSubtotal([])).toBe(0)
  })

  it('sums quantity × unitPrice for each item', () => {
    const items = [item('Labor', 2, 50), item('Part', 1, 30)]
    expect(calcSubtotal(items)).toBe(130)
  })

  it('handles fractional quantities', () => {
    expect(calcSubtotal([item('Hour', 1.5, 80)])).toBeCloseTo(120)
  })
})

describe('calcTax', () => {
  it('returns 0 when tax rate is 0', () => {
    expect(calcTax(100, 0)).toBe(0)
  })

  it('calculates tax correctly for 10% rate', () => {
    expect(calcTax(200, 10)).toBe(20)
  })

  it('calculates tax correctly for 8.5% rate', () => {
    expect(calcTax(100, 8.5)).toBeCloseTo(8.5)
  })
})

describe('calcTotal', () => {
  it('sums subtotal and tax', () => {
    expect(calcTotal(100, 8.5)).toBeCloseTo(108.5)
  })

  it('returns subtotal when tax is 0', () => {
    expect(calcTotal(250, 0)).toBe(250)
  })
})
