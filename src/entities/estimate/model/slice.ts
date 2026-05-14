import type { Estimate } from './types'

export type EstimateAction =
  | { type: 'estimate/ADD'; payload: Estimate }
  | { type: 'estimate/UPDATE'; payload: Estimate }
  | { type: 'estimate/REMOVE'; payload: string }

export function estimateReducer(estimates: Estimate[], action: EstimateAction): Estimate[] {
  switch (action.type) {
    case 'estimate/ADD':
      return [...estimates, action.payload]
    case 'estimate/UPDATE': {
      const updated = { ...action.payload, updatedAt: new Date().toISOString() }
      return estimates.map(e => e.id === updated.id ? updated : e)
    }
    case 'estimate/REMOVE':
      return estimates.filter(e => e.id !== action.payload)
    default:
      return estimates
  }
}

export const selectEstimatesByJob = (estimates: Estimate[], jobId: string) =>
  estimates.filter(e => e.jobId === jobId)

export const selectEstimateByToken = (estimates: Estimate[], token: string) =>
  estimates.find(e => e.approvalToken === token)
