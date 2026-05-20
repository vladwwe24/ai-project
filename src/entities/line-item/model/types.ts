export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxable?: boolean          // default true when undefined
  category: 'labor' | 'material'
}
