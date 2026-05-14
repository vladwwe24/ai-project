import { Box, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useAppState } from '@/app/providers/AppProvider'
import { selectJobsByDate } from '@/entities/job/model/slice'
import { DateStrip } from '@/widgets/timeline-grid/ui/DateStrip'
import { TimelineGrid } from '@/widgets/timeline-grid/ui/TimelineGrid'
import { CreateJobModal } from '@/widgets/create-job-modal/ui/CreateJobModal'
import { toDateKey } from '@/widgets/timeline-grid/lib/timeUtils'

export function TimelinePage() {
  const { jobs, customers } = useAppState()
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [initialIso, setInitialIso] = useState('')

  const dayJobs = selectJobsByDate(jobs, toDateKey(selectedDate))

  function handleSlotTap(iso: string) {
    setInitialIso(iso)
    setModalOpen(true)
  }

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Month + job count header */}
      <Box px={4} pt={3} pb={1}>
        <Text fontWeight="semibold" fontSize="lg">
          {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {dayJobs.length} job{dayJobs.length !== 1 ? 's' : ''} on selected day · tap grid to add
        </Text>
      </Box>

      {/* Scrollable date strip */}
      <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

      {/* Scrollable time grid */}
      <Box flex={1} overflowY="auto">
        <TimelineGrid
          jobs={dayJobs}
          customers={customers}
          selectedDate={selectedDate}
          onSlotTap={handleSlotTap}
        />
      </Box>

      <CreateJobModal
        open={modalOpen}
        initialIso={initialIso}
        onClose={() => setModalOpen(false)}
      />
    </Box>
  )
}
