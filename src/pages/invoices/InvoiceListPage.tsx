import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '@/app/providers/AppProvider'
import type { InvoiceStatus } from '@/entities/invoice/model/types'
import { InvoiceStatusBadge } from '@/entities/invoice/ui/InvoiceStatusBadge'
import { ExportModal } from '@/features/export/ui/ExportModal'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { calcSubtotal, calcTax, calcTotal } from '@/entities/estimate/model/calcHelpers'
import { formatCurrency, formatDate } from '@/shared/lib/index'

const STATUS_OPTIONS: Array<{ label: string; value: InvoiceStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Unpaid', value: 'UNPAID' },
  { label: 'Partial', value: 'PARTIAL' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export function InvoiceListPage() {
  const { invoices, jobs, customers } = useAppState()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL')
  const [exportOpen, setExportOpen] = useState(false)

  const filtered = invoices
    .filter(inv => statusFilter === 'ALL' || inv.status === statusFilter)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  function getJobInfo(jobId: string) {
    const job = jobs.find(j => j.id === jobId)
    const customer = job ? customers.find(c => c.id === job.customerId) : undefined
    return { job, customer }
  }

  return (
    <Box>
      <PageHeader
        title="Invoices"
        action={
          <Button size="sm" variant="outline" onClick={() => setExportOpen(true)}>
            Export CSV
          </Button>
        }
      />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />

      <Box px={4} pb={3}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as InvoiceStatus | 'ALL')}
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
      </Box>

      {filtered.length === 0 && (
        <EmptyState
          title="No invoices found"
          description={statusFilter !== 'ALL' ? 'Try a different status filter.' : undefined}
        />
      )}

      <Box px={4} pb={4}>
        {filtered.map(inv => {
          const { job, customer } = getJobInfo(inv.jobId)
          const subtotal = calcSubtotal(inv.lineItems)
          const tax = calcTax(subtotal, inv.taxRate)
          const total = calcTotal(subtotal, tax)

          return (
            <Box
              key={inv.id}
              borderWidth="1px"
              borderRadius="md"
              p={3}
              mb={2}
              cursor="pointer"
              _hover={{ bg: 'bg.subtle' }}
              onClick={() => job && navigate(`/jobs/${job.id}`)}
            >
              <Flex align="center" justify="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="medium">{inv.invoiceNumber}</Text>
                <InvoiceStatusBadge status={inv.status} />
              </Flex>
              {customer && (
                <Text fontSize="sm" color="fg.muted" mb={0.5}>{customer.name}</Text>
              )}
              {job && (
                <Text fontSize="xs" color="fg.subtle" mb={1}>
                  {job.applianceType}{job.brand ? ` · ${job.brand}` : ''}
                </Text>
              )}
              <Flex align="center" justify="space-between">
                <Text fontSize="xs" color="fg.subtle">{formatDate(inv.createdAt)}</Text>
                <Text fontSize="sm" fontWeight="semibold">{formatCurrency(total)}</Text>
              </Flex>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
