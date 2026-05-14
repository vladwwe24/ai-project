import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppState } from '@/app/providers/AppProvider'
import { JobStatusBadge } from '@/entities/job/ui/JobStatusBadge'
import { selectJobsByCustomer } from '@/entities/job/model/slice'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { formatDate, formatTime } from '@/shared/lib/index'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { customers, jobs } = useAppState()
  const navigate = useNavigate()

  const customer = customers.find(c => c.id === id)

  if (!customer) {
    return (
      <Box p={4}>
        <Text>Customer not found.</Text>
        <Button mt={2} variant="ghost" onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
      </Box>
    )
  }

  const customerJobs = selectJobsByCustomer(jobs, customer.id)

  return (
    <Box>
      <PageHeader
        title={customer.name}
        action={
          <Button size="sm" variant="outline" onClick={() => navigate(`/customers/${customer.id}/edit`)}>
            Edit
          </Button>
        }
      />

      <Box px={4} pb={4}>
        <Box borderWidth="1px" borderRadius="md" p={3} mb={4}>
          <Flex direction="column" gap={1}>
            <Text fontSize="sm"><Text as="span" fontWeight="medium">Phone: </Text>{customer.phone}</Text>
            {customer.email && (
              <Text fontSize="sm"><Text as="span" fontWeight="medium">Email: </Text>{customer.email}</Text>
            )}
            {customer.address && (
              <Text fontSize="sm"><Text as="span" fontWeight="medium">Address: </Text>{customer.address}</Text>
            )}
            <Text fontSize="sm" color="fg.muted">Customer since {formatDate(customer.createdAt)}</Text>
          </Flex>
        </Box>

        <Text fontWeight="semibold" mb={2}>Jobs ({customerJobs.length})</Text>
        {customerJobs.length === 0 ? (
          <EmptyState title="No jobs yet" description="Jobs are created from the Timeline." />
        ) : (
          <Flex direction="column" gap={2}>
            {customerJobs.map(job => (
              <Box
                key={job.id}
                borderWidth="1px"
                borderRadius="md"
                p={3}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <Flex align="center" justify="space-between">
                  <Box>
                    <Text fontWeight="medium">
                      {job.applianceType}{job.brand ? ` · ${job.brand}` : ''}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      {formatDate(job.scheduledAt)} at {formatTime(job.scheduledAt)}
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
