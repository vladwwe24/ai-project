import { describe, it, expect } from 'vitest'
import { getNextStatus, isTerminal, canFinishJob, getAdvanceLabel } from '../statusHelpers'
import { JobStatus } from '../types'

describe('getNextStatus', () => {
  it('returns SCHEDULED after NEW', () => {
    expect(getNextStatus(JobStatus.NEW)).toBe(JobStatus.SCHEDULED)
  })

  it('advances through the linear flow', () => {
    expect(getNextStatus(JobStatus.SCHEDULED)).toBe(JobStatus.IN_PROGRESS)
    expect(getNextStatus(JobStatus.IN_PROGRESS)).toBe(JobStatus.APPROVED)
    expect(getNextStatus(JobStatus.APPROVED)).toBe(JobStatus.INVOICED)
    expect(getNextStatus(JobStatus.INVOICED)).toBe(JobStatus.PAID)
  })

  it('returns null at the end of the flow (PAID)', () => {
    expect(getNextStatus(JobStatus.PAID)).toBeNull()
  })

  it('returns null for statuses not in the flow', () => {
    expect(getNextStatus(JobStatus.CANCELLED)).toBeNull()
    expect(getNextStatus(JobStatus.COMPLETED)).toBeNull()
  })
})

describe('isTerminal', () => {
  it('returns true for PAID', () => {
    expect(isTerminal(JobStatus.PAID)).toBe(true)
  })

  it('returns true for COMPLETED', () => {
    expect(isTerminal(JobStatus.COMPLETED)).toBe(true)
  })

  it('returns false for active statuses', () => {
    expect(isTerminal(JobStatus.NEW)).toBe(false)
    expect(isTerminal(JobStatus.IN_PROGRESS)).toBe(false)
    expect(isTerminal(JobStatus.INVOICED)).toBe(false)
  })
})

describe('canFinishJob', () => {
  it('returns true for IN_PROGRESS, APPROVED, INVOICED', () => {
    expect(canFinishJob(JobStatus.IN_PROGRESS)).toBe(true)
    expect(canFinishJob(JobStatus.APPROVED)).toBe(true)
    expect(canFinishJob(JobStatus.INVOICED)).toBe(true)
  })

  it('returns false for other statuses', () => {
    expect(canFinishJob(JobStatus.NEW)).toBe(false)
    expect(canFinishJob(JobStatus.PAID)).toBe(false)
    expect(canFinishJob(JobStatus.SCHEDULED)).toBe(false)
  })
})

describe('getAdvanceLabel', () => {
  it('returns correct label for each advanceable status', () => {
    expect(getAdvanceLabel(JobStatus.NEW)).toBe('Schedule')
    expect(getAdvanceLabel(JobStatus.SCHEDULED)).toBe('Start Work')
    expect(getAdvanceLabel(JobStatus.IN_PROGRESS)).toBe('Mark Approved')
    expect(getAdvanceLabel(JobStatus.APPROVED)).toBe('Generate Invoice')
    expect(getAdvanceLabel(JobStatus.INVOICED)).toBe('Mark Paid')
  })

  it('returns null for terminal or non-advanceable statuses', () => {
    expect(getAdvanceLabel(JobStatus.PAID)).toBeNull()
    expect(getAdvanceLabel(JobStatus.CANCELLED)).toBeNull()
  })
})
