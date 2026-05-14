import type { Job } from './types'

export type JobAction =
  | { type: 'job/ADD'; payload: Job }
  | { type: 'job/UPDATE'; payload: Job }
  | { type: 'job/REMOVE'; payload: string }

export function jobReducer(jobs: Job[], action: JobAction): Job[] {
  switch (action.type) {
    case 'job/ADD':
      return [...jobs, action.payload]
    case 'job/UPDATE': {
      const updated = { ...action.payload, updatedAt: new Date().toISOString() }
      return jobs.map(j => j.id === updated.id ? updated : j)
    }
    case 'job/REMOVE':
      return jobs.filter(j => j.id !== action.payload)
    default:
      return jobs
  }
}

export const selectJobById = (jobs: Job[], id: string) =>
  jobs.find(j => j.id === id)

export const selectJobsByCustomer = (jobs: Job[], customerId: string) =>
  jobs.filter(j => j.customerId === customerId)

export const selectJobsByDate = (jobs: Job[], dateStr: string) =>
  jobs.filter(j => j.scheduledAt.startsWith(dateStr))
