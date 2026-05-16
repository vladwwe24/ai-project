export { nanoid } from 'nanoid'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso))
}

export function generateInvoiceNumber(totalInvoiceCount: number): string {
  const year = new Date().getFullYear()
  const seq = String(totalInvoiceCount + 1).padStart(4, '0')
  return `INV-${year}-${seq}`
}

export function generateEstimateNumber(totalEstimateCount: number): string {
  return String(totalEstimateCount + 1).padStart(6, '0')
}
