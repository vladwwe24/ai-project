import { Box, Input } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '@/app/providers/AppProvider'
import { JobCard } from '@/widgets/job-card/ui/JobCard'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import type { JobStatus } from '@/entities/job/model/types'

const STATUS_OPTIONS: Array<{ value: JobStatus | ''; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'INVOICED', label: 'Invoiced' },
  { value: 'PAID', label: 'Paid' },
  { value: 'COMPLETED', label: 'Completed' },
]

export function JobListPage() {
  const { jobs, customers } = useAppState()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('')

  const filtered = useMemo(() => {
    let result = [...jobs]
    if (statusFilter) result = result.filter(j => j.status === statusFilter)
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      result = result.filter(j => {
        const customer = customers.find(c => c.id === j.customerId)
        return (
          j.applianceType.toLowerCase().includes(q) ||
          (j.issue?.toLowerCase().includes(q) ?? false) ||
          (j.brand?.toLowerCase().includes(q) ?? false) ||
          (customer?.name.toLowerCase().includes(q) ?? false)
        )
      })
    }
    return result.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
  }, [jobs, customers, query, statusFilter])

  return (
    <Box>
      <PageHeader title="Jobs" />
      <Box px={4} pb={4} display="flex" flexDirection="column" gap={3}>
        <Input
          placeholder="Search by appliance, issue, or customer…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as JobStatus | '')}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--chakra-colors-border)',
            borderRadius: '6px',
            fontSize: '14px',
            background: 'white',
          }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {filtered.length === 0 ? (
          <EmptyState
            title="No jobs found"
            description={
              query || statusFilter
                ? 'Try adjusting your search or filter.'
                : 'Jobs are created from the Timeline.'
            }
          />
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {filtered.map(j => (
              <JobCard
                key={j.id}
                job={j}
                customerName={customers.find(c => c.id === j.customerId)?.name}
                onClick={() => navigate(`/jobs/${j.id}`)}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
