import { Box, Button, Flex, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import { selectJobById } from '@/entities/job/model/slice'
import { JobStatusBadge } from '@/entities/job/ui/JobStatusBadge'
import { formatDate, formatTime } from '@/shared/lib/index'
import { AppModal } from '@/shared/ui/AppModal'
import { EstimateWidget } from '@/widgets/estimate-widget/ui/EstimateWidget'
import { InvoiceWidget } from '@/widgets/invoice-widget/ui/InvoiceWidget'
import { NotesWidget } from '@/widgets/notes-widget/ui/NotesWidget'

function isoToDateValue(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoToTimeValue(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function addHours(timeStr: string, hours: number): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const total = h + hours
  if (total >= 24) return '23:59'
  return `${String(total).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { jobs, customers } = useAppState()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const job = id ? selectJobById(jobs, id) : undefined
  const customer = job ? customers.find(c => c.id === job.customerId) : undefined

  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleStart, setRescheduleStart] = useState('')
  const [rescheduleEnd, setRescheduleEnd] = useState('')

  if (!job) {
    return (
      <Box p={4}>
        <Text>Job not found.</Text>
        <Button mt={2} variant="ghost" onClick={() => navigate('/jobs')}>
          Back to Jobs
        </Button>
      </Box>
    )
  }

  function openReschedule() {
    setRescheduleDate(isoToDateValue(job!.scheduledAt))
    const start = isoToTimeValue(job!.scheduledAt)
    setRescheduleStart(start)
    setRescheduleEnd(addHours(start, 2))
    setRescheduleOpen(true)
  }

  function handleReschedule() {
    if (!rescheduleDate || !rescheduleStart) return
    const newIso = new Date(`${rescheduleDate}T${rescheduleStart}`).toISOString()
    dispatch({
      type: 'job/UPDATE',
      payload: { ...job!, scheduledAt: newIso, updatedAt: new Date().toISOString() },
    })
    setRescheduleOpen(false)
  }

  const rescheduleFooter = (
    <>
      <Button variant="ghost" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
      <Button colorPalette="blue" onClick={handleReschedule}>Save</Button>
    </>
  )

  return (
    <Box>
      {/* Header */}
      <Flex align="center" justify="space-between" px={4} py={3}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
          ← Jobs
        </Button>
        <Flex align="center" gap={2}>
          <Button size="sm" variant="outline" onClick={openReschedule}>
            Reschedule
          </Button>
          <JobStatusBadge status={job.status} />
        </Flex>
      </Flex>

      {/* Job info */}
      <Box px={4} pb={3}>
        <Text fontSize="xl" fontWeight="bold" mb={1}>
          {job.applianceType}{job.brand ? ` · ${job.brand}` : ''}
          {job.model ? ` (${job.model})` : ''}
        </Text>
        {customer && (
          <Text
            fontSize="sm"
            color="blue.500"
            cursor="pointer"
            onClick={() => navigate(`/customers/${customer.id}`)}
            mb={1}
          >
            {customer.name}
          </Text>
        )}
        <Text fontSize="xs" color="fg.subtle">
          {formatDate(job.scheduledAt)} at {formatTime(job.scheduledAt)}
        </Text>
      </Box>

      {/* Invoice section */}
      <Box mx={4} mb={4}>
        <InvoiceWidget jobId={job.id} />
      </Box>

      {/* Estimate section */}
      <Box mx={4} mb={4}>
        <EstimateWidget jobId={job.id} />
      </Box>

      {/* Notes */}
      <Box mx={4} mb={4}>
        <NotesWidget jobId={job.id} />
      </Box>

      {/* Reschedule modal */}
      <AppModal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Reschedule Job"
        footer={rescheduleFooter}
      >
        <Flex direction="column" gap={3}>
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>Date</Text>
            <Input
              type="date"
              value={rescheduleDate}
              onChange={e => setRescheduleDate(e.target.value)}
            />
          </Box>
          <Flex gap={3}>
            <Box flex={1}>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Start Time</Text>
              <Input
                type="time"
                value={rescheduleStart}
                onChange={e => setRescheduleStart(e.target.value)}
              />
            </Box>
            <Box flex={1}>
              <Text fontSize="sm" fontWeight="medium" mb={1}>End Time</Text>
              <Input
                type="time"
                value={rescheduleEnd}
                onChange={e => setRescheduleEnd(e.target.value)}
              />
            </Box>
          </Flex>
        </Flex>
      </AppModal>
    </Box>
  )
}
