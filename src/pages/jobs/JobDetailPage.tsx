import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  MdArrowBack,
  MdCalendarToday,
  MdChatBubbleOutline,
  MdEdit,
  MdLocationOn,
  MdMoreVert,
  MdPaid,
  MdReceipt,
  MdBuild,
} from 'react-icons/md'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import { selectJobById } from '@/entities/job/model/slice'
import { JobStatus } from '@/entities/job/model/types'
import { formatDate, formatTime } from '@/shared/lib/index'
import { AppModal } from '@/shared/ui/AppModal'
import { EstimateWidget } from '@/widgets/estimate-widget/ui/EstimateWidget'
import { InvoiceWidget } from '@/widgets/invoice-widget/ui/InvoiceWidget'
import { NotesWidget } from '@/widgets/notes-widget/ui/NotesWidget'
import { AttachmentsWidget } from '@/widgets/attachments-widget/ui/AttachmentsWidget'

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

const ALL_STATUSES = Object.values(JobStatus)

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { jobs, customers } = useAppState()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const job = id ? selectJobById(jobs, id) : undefined
  const customer = job ? customers.find(c => c.id === job.customerId) : undefined
  const jobHistory = job ? jobs.filter(j => j.customerId === job.customerId) : []

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editNameOpen, setEditNameOpen] = useState(false)
  const [editNumberOpen, setEditNumberOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editNumber, setEditNumber] = useState('')

  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleStart, setRescheduleStart] = useState('')
  const [rescheduleEnd, setRescheduleEnd] = useState('')

  const [statusOpen, setStatusOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')

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

  function openEditName() {
    setEditName(job!.name ?? '')
    setSettingsOpen(false)
    setEditNameOpen(true)
  }

  function openEditNumber() {
    setEditNumber(job!.jobNumber ?? '')
    setSettingsOpen(false)
    setEditNumberOpen(true)
  }

  function handleSaveName() {
    dispatch({ type: 'job/UPDATE', payload: { ...job!, name: editName.trim() || job!.name, updatedAt: new Date().toISOString() } })
    setEditNameOpen(false)
  }

  function handleSaveNumber() {
    dispatch({ type: 'job/UPDATE', payload: { ...job!, jobNumber: editNumber.trim() || job!.jobNumber, updatedAt: new Date().toISOString() } })
    setEditNumberOpen(false)
  }

  function openReschedule() {
    setRescheduleDate(isoToDateValue(job!.scheduledAt))
    const start = isoToTimeValue(job!.scheduledAt)
    setRescheduleStart(start)
    setRescheduleEnd(job!.scheduledEndAt ? isoToTimeValue(job!.scheduledEndAt) : addHours(start, 2))
    setRescheduleOpen(true)
  }

  function handleReschedule() {
    if (!rescheduleDate || !rescheduleStart) return
    const newStart = new Date(`${rescheduleDate}T${rescheduleStart}`).toISOString()
    const newEnd = rescheduleEnd ? new Date(`${rescheduleDate}T${rescheduleEnd}`).toISOString() : undefined
    dispatch({
      type: 'job/UPDATE',
      payload: { ...job!, scheduledAt: newStart, scheduledEndAt: newEnd, updatedAt: new Date().toISOString() },
    })
    setRescheduleOpen(false)
  }

  function openStatus() {
    setSelectedStatus(job!.status)
    setStatusOpen(true)
  }

  function handleSaveStatus() {
    dispatch({ type: 'job/UPDATE', payload: { ...job!, status: selectedStatus as JobStatus, updatedAt: new Date().toISOString() } })
    setStatusOpen(false)
  }

  const isPaid = job.status === JobStatus.PAID

  const jobLabel = job.jobNumber ? `Job #${job.jobNumber}` : 'Job'
  const jobTitle = job.name ?? `${job.applianceType}${job.brand ? ` · ${job.brand}` : ''}`

  const techInitials = 'VH'
  const techName = 'Vladyslav H.'

  return (
    <Box pb={8}>
      {/* Header image area */}
      <Box position="relative" height="180px" style={{ background: 'var(--app-surface)' }} overflow="hidden">
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          align="center"
          justify="space-between"
          px={2}
          pt={2}
          zIndex={2}
        >
          <IconButton
            aria-label="Back"
            variant="ghost"
            size="sm"
            borderRadius="full"
            onClick={() => navigate('/jobs')}
          >
            <MdArrowBack />
          </IconButton>
          <IconButton
            aria-label="More options"
            variant="ghost"
            size="sm"
            borderRadius="full"
            onClick={() => setSettingsOpen(true)}
          >
            <MdMoreVert />
          </IconButton>
        </Flex>
        {/* Placeholder background with address */}
        <Flex
          position="absolute"
          inset={0}
          align="center"
          justify="center"
          direction="column"
          gap={1}
          color="fg.muted"
        >
          <MdLocationOn size={32} />
          {customer?.address && (
            <Text fontSize="xs" textAlign="center" px={8} color="fg.muted">
              {customer.address}
            </Text>
          )}
        </Flex>
      </Box>

      {/* Job identity */}
      <Box px={4} pt={3} pb={2}>
        <Text fontSize="xs" color="fg.muted" mb={0.5}>{jobLabel}</Text>
        <Text fontSize="2xl" fontWeight="bold" lineHeight="tight">{jobTitle}</Text>
      </Box>

      {/* Action buttons */}
      <Flex px={4} gap={2} mb={4} flexWrap="wrap">
        <Button
          size="sm"
          variant="subtle"
          colorPalette="blue"
          onClick={() => {
            const el = document.getElementById('invoice-section')
            el?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <MdReceipt /> Invoice
        </Button>
        <Button size="sm" variant="subtle" colorPalette="green">
          <MdPaid /> Pay
        </Button>
      </Flex>

      {/* Appointment card */}
      <Box mx={4} mb={3} style={{ background: 'var(--app-surface)' }} borderRadius="xl" boxShadow="sm" px={4} py={3}>
        <Flex align="center" gap={2} mb={3}>
          <MdCalendarToday color="var(--chakra-colors-blue-500)" />
          <Text fontWeight="semibold" flex={1}>Job Schedule</Text>
          <IconButton
            aria-label="Reschedule"
            variant="ghost"
            size="sm"
            color="blue.500"
            onClick={openReschedule}
          >
            <MdEdit />
          </IconButton>
        </Flex>
        <Flex justify="space-between" mb={1}>
          <Text fontSize="sm" color="fg.muted">From</Text>
          <Text fontSize="sm">{formatDate(job.scheduledAt)} {formatTime(job.scheduledAt)}</Text>
        </Flex>
        {job.scheduledEndAt && (
          <Flex justify="space-between" mb={1}>
            <Text fontSize="sm" color="fg.muted">To</Text>
            <Text fontSize="sm">{formatDate(job.scheduledEndAt)} {formatTime(job.scheduledEndAt)}</Text>
          </Flex>
        )}
        <Flex align="center" gap={2} mt={2}>
          <Flex
            w="28px"
            h="28px"
            borderRadius="full"
            bg="gray.600"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Text fontSize="2xs" color="white" fontWeight="bold">{techInitials}</Text>
          </Flex>
          <Text fontSize="sm">{techName}</Text>
        </Flex>
      </Box>

      {/* Job status card */}
      <Box mx={4} mb={3} style={{ background: 'var(--app-surface)' }} borderRadius="xl" boxShadow="sm" overflow="hidden">
        <Flex
          align="center"
          px={4}
          py={3}
          cursor="pointer"
          _hover={{ bg: 'bg.subtle' }}
          onClick={openStatus}
          borderBottomWidth="1px"
          borderColor="border.subtle"
        >
          <MdBuild color="var(--chakra-colors-gray-500)" />
          <Text fontWeight="semibold" flex={1} ml={2}>Job status</Text>
          <Text fontSize="sm" color="fg.muted">{job.status.replace(/_/g, ' ')}</Text>
        </Flex>
        <Flex align="center" px={4} py={3}>
          <MdPaid color={isPaid ? 'var(--chakra-colors-green-500)' : 'var(--chakra-colors-gray-300)'} />
          <Text fontSize="sm" ml={2} color={isPaid ? 'green.600' : 'fg.muted'}>Paid in full</Text>
        </Flex>
      </Box>

      {/* Customer card */}
      <Box mx={4} mb={3} style={{ background: 'var(--app-surface)' }} borderRadius="xl" boxShadow="sm" overflow="hidden">
        <Flex align="center" px={4} py={3} borderBottomWidth="1px" borderColor="border.subtle">
          <Text fontWeight="semibold" flex={1}>Customer</Text>
        </Flex>
        {customer ? (
          <>
            <Flex align="center" px={4} py={2} borderBottomWidth="1px" borderColor="border.subtle">
              <Text fontSize="sm" flex={1} fontWeight="medium">{customer.name}</Text>
              <MdChatBubbleOutline color="var(--chakra-colors-blue-500)" />
            </Flex>
            {customer.address && (
              <Flex align="center" px={4} py={2} borderBottomWidth="1px" borderColor="border.subtle">
                <Text fontSize="sm" flex={1} color="fg.muted">{customer.address}</Text>
                <MdLocationOn color="var(--chakra-colors-blue-500)" />
              </Flex>
            )}
            <Flex
              align="center"
              px={4}
              py={3}
              cursor="pointer"
              _hover={{ bg: 'bg.subtle' }}
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <Text fontSize="sm" flex={1}>Customer History</Text>
              <Text fontSize="sm" color="fg.muted" mr={1}>{jobHistory.length}</Text>
              <Text fontSize="sm" color="fg.muted">›</Text>
            </Flex>
          </>
        ) : (
          <Box px={4} py={3}>
            <Text fontSize="sm" color="fg.muted">No customer linked</Text>
          </Box>
        )}
      </Box>

      {/* Invoice section */}
      <Box mx={4} mb={4} id="invoice-section">
        <InvoiceWidget jobId={job.id} />
      </Box>

      {/* Estimates */}
      <Box mx={4} mb={4}>
        <EstimateWidget jobId={job.id} />
      </Box>

      {/* Notes */}
      <Box mx={4} mb={4}>
        <NotesWidget jobId={job.id} />
      </Box>

      {/* Attachments */}
      <Box mx={4} mb={4}>
        <AttachmentsWidget jobId={job.id} />
      </Box>

      {/* Settings menu */}
      <AppModal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Job Settings">
        <Flex direction="column" gap={1}>
          <Button variant="ghost" justifyContent="flex-start" onClick={openEditName}>
            Edit Job Name
          </Button>
          <Button variant="ghost" justifyContent="flex-start" onClick={openEditNumber}>
            Edit Job Number
          </Button>
        </Flex>
      </AppModal>

      {/* Edit name modal */}
      <AppModal
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        title="Edit Job Name"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditNameOpen(false)}>Cancel</Button>
            <Button colorPalette="blue" onClick={handleSaveName}>Save</Button>
          </>
        }
      >
        <Input value={editName} onChange={e => setEditName(e.target.value)} />
      </AppModal>

      {/* Edit number modal */}
      <AppModal
        open={editNumberOpen}
        onClose={() => setEditNumberOpen(false)}
        title="Edit Job Number"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditNumberOpen(false)}>Cancel</Button>
            <Button colorPalette="blue" onClick={handleSaveNumber}>Save</Button>
          </>
        }
      >
        <Input value={editNumber} onChange={e => setEditNumber(e.target.value)} />
      </AppModal>

      {/* Reschedule modal */}
      <AppModal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Reschedule Job"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
            <Button colorPalette="blue" onClick={handleReschedule}>Save</Button>
          </>
        }
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

      {/* Status modal */}
      <AppModal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Change Status"
        footer={
          <>
            <Button variant="ghost" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button colorPalette="blue" onClick={handleSaveStatus}>Save</Button>
          </>
        }
      >
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
        >
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </AppModal>
    </Box>
  )
}
