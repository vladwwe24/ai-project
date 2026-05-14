import { Box, Flex, Heading, SimpleGrid, Text } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '@/app/providers/AppProvider'
import { JobStatus } from '@/entities/job/model/types'
import { JobStatusBadge } from '@/entities/job/ui/JobStatusBadge'
import type { Invoice } from '@/entities/invoice/model/types'
import { InvoiceStatus } from '@/entities/invoice/model/types'
import { formatCurrency } from '@/shared/lib/index'

function calcInvoiceTotal(invoice: Invoice): number {
  const subtotal = invoice.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  )
  return subtotal * (1 + invoice.taxRate / 100)
}

interface StatCardProps {
  label: string
  value: string
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <Text fontSize="xs" color="fg.muted" mb={1}>{label}</Text>
      <Text fontWeight="bold" fontSize="xl" lineClamp={1}>{value}</Text>
    </Box>
  )
}

export function DashboardPage() {
  const { jobs, customers, invoices } = useAppState()
  const navigate = useNavigate()

  const customerMap = useMemo(
    () => new Map(customers.map(c => [c.id, c])),
    [customers],
  )

  const today = new Date().toISOString().slice(0, 10)
  const thisMonth = new Date().toISOString().slice(0, 7)

  const todayCount = useMemo(
    () => jobs.filter(j => j.scheduledAt.startsWith(today)).length,
    [jobs, today],
  )

  const openCount = useMemo(
    () => jobs.filter(j =>
      j.status === JobStatus.SCHEDULED || j.status === JobStatus.IN_PROGRESS,
    ).length,
    [jobs],
  )

  const thisMonthEarnings = useMemo(
    () => invoices
      .filter(inv => inv.status === InvoiceStatus.PAID && inv.paidAt?.startsWith(thisMonth))
      .reduce((sum, inv) => sum + calcInvoiceTotal(inv), 0),
    [invoices, thisMonth],
  )

  const outstanding = useMemo(
    () => invoices
      .filter(inv => inv.status === InvoiceStatus.UNPAID || inv.status === InvoiceStatus.PARTIAL || inv.status === InvoiceStatus.OVERDUE)
      .reduce((sum, inv) => sum + calcInvoiceTotal(inv), 0),
    [invoices],
  )

  const actionRequired = useMemo(
    () => jobs.filter(j =>
      j.status === JobStatus.APPROVED || j.status === JobStatus.INVOICED,
    ),
    [jobs],
  )

  return (
    <Box>
      <Heading size="lg" px={4} pt={4} pb={3}>Dashboard</Heading>

      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} px={4} mb={6}>
        <StatCard label="Today's Jobs" value={String(todayCount)} />
        <StatCard label="Open Jobs" value={String(openCount)} />
        <StatCard label="This Month" value={formatCurrency(thisMonthEarnings)} />
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} />
      </SimpleGrid>

      <Box px={4}>
        <Text fontWeight="semibold" mb={3}>Action Required</Text>
        {actionRequired.length === 0 ? (
          <Text color="fg.muted" fontSize="sm">No actions required.</Text>
        ) : (
          <Flex direction="column" gap={2}>
            {actionRequired.map(job => (
              <Box
                key={job.id}
                borderWidth="1px"
                borderRadius="md"
                p={3}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => void navigate(`/jobs/${job.id}`)}
              >
                <Flex align="center" justify="space-between">
                  <Box>
                    <Text fontWeight="medium">
                      {job.applianceType}{job.brand ? ` · ${job.brand}` : ''}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      {customerMap.get(job.customerId)?.name ?? 'Unknown customer'}
                    </Text>
                  </Box>
                  <JobStatusBadge status={job.status} />
                </Flex>
              </Box>
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  )
}
