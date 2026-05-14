import { Box, Button, Flex, Text, Textarea } from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import { selectJobById } from '@/entities/job/model/slice'
import { JobStatusBadge } from '@/entities/job/ui/JobStatusBadge'
import { StatusActionBar } from '@/features/job-status/ui/StatusActionBar'
import { formatDate, formatTime } from '@/shared/lib/index'
import { EstimateWidget } from '@/widgets/estimate-widget/ui/EstimateWidget'
import { InvoiceWidget } from '@/widgets/invoice-widget/ui/InvoiceWidget'

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { jobs, customers } = useAppState()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const job = id ? selectJobById(jobs, id) : undefined
  const customer = job ? customers.find(c => c.id === job.customerId) : undefined

  const [notes, setNotes] = useState(job?.notes ?? '')
  const [notesSaved, setNotesSaved] = useState(false)

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

  function saveNotes() {
    if (!job) return
    dispatch({
      type: 'job/UPDATE',
      payload: { ...job, notes: notes.trim() || undefined, updatedAt: new Date().toISOString() },
    })
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  return (
    <Box>
      {/* Header */}
      <Flex align="center" justify="space-between" px={4} py={3}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
          ← Jobs
        </Button>
        <JobStatusBadge status={job.status} />
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
        <Text fontSize="sm" color="fg.muted" mb={1}>{job.issue}</Text>
        <Text fontSize="xs" color="fg.subtle">
          {formatDate(job.scheduledAt)} at {formatTime(job.scheduledAt)}
        </Text>
      </Box>

      {/* Status actions */}
      <StatusActionBar job={job} />

      {/* Invoice section */}
      <Box mx={4} mb={4}>
        <InvoiceWidget jobId={job.id} />
      </Box>

      {/* Estimate section */}
      <Box mx={4} mb={4}>
        <EstimateWidget jobId={job.id} />
      </Box>

      {/* Notes */}
      <Box mx={4} mb={4} borderWidth="1px" borderRadius="md" p={3}>
        <Text fontWeight="semibold" mb={2}>Notes</Text>
        <Textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setNotesSaved(false) }}
          placeholder="Add job notes…"
          rows={4}
          mb={2}
        />
        <Flex align="center" gap={3}>
          <Button size="sm" colorPalette="blue" onClick={saveNotes}>
            Save Notes
          </Button>
          {notesSaved && (
            <Text fontSize="sm" color="green.600">Saved!</Text>
          )}
        </Flex>
      </Box>
    </Box>
  )
}
