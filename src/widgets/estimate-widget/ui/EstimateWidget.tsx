import { Box, Flex, IconButton, Text } from '@chakra-ui/react'
import { useRef, useState } from 'react'
import { MdAdd } from 'react-icons/md'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import { selectEstimatesByJob } from '@/entities/estimate/model/slice'
import { EstimateStatus } from '@/entities/estimate/model/types'
import type { Estimate } from '@/entities/estimate/model/types'
import { EstimateStatusBadge } from '@/entities/estimate/ui/EstimateStatusBadge'
import { getSettings } from '@/shared/config/settings'
import { nanoid, formatDate, generateEstimateNumber } from '@/shared/lib/index'
import { EstimateDetailModal } from './EstimateDetailModal'

interface Props {
  jobId: string
}

export function EstimateWidget({ jobId }: Props) {
  const { estimates } = useAppState()
  const dispatch = useAppDispatch()
  const jobEstimates = selectEstimatesByJob(estimates, jobId)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Stable ref: holds the last-opened estimate so EstimateDetailModal stays in
  // the React tree (with open=false) while AppModal animates closed. Without
  // this, both selectedId and modalOpen clearing in one batch would unmount
  // the component before Chakra cleans up body overflow/pointer-events.
  const stableEstimateRef = useRef<Estimate | null>(null)

  const selectedEstimateFromState = selectedId != null
    ? (jobEstimates.find(e => e.id === selectedId) ?? null)
    : null

  // Always keep ref current while the estimate exists in state
  if (selectedEstimateFromState !== null) {
    stableEstimateRef.current = selectedEstimateFromState
  }

  // Prefer live state; fall back to ref for the delete-while-open scenario
  const displayEstimate = selectedEstimateFromState ?? stableEstimateRef.current

  function openEstimate(id: string) {
    setSelectedId(id)
    setModalOpen(true)
  }

  function closeModal() {
    // Only set modalOpen=false — do NOT clear selectedId here.
    // Clearing selectedId simultaneously would make displayEstimate null in the
    // same render, unmounting the modal before Chakra's close animation runs.
    setModalOpen(false)
  }

  function handleCreate() {
    const id = nanoid()
    const now = new Date().toISOString()
    dispatch({
      type: 'estimate/ADD',
      payload: {
        id,
        jobId,
        estimateNumber: generateEstimateNumber(estimates.length),
        lineItems: [],
        taxRate: getSettings().defaultTaxRate,
        status: EstimateStatus.DRAFT,
        createdAt: now,
        updatedAt: now,
      },
    })
    openEstimate(id)
  }

  return (
    <Box boxShadow="sm" borderRadius="xl" p={3}>
      <Flex align="center" justify="space-between" mb={jobEstimates.length > 0 ? 3 : 1}>
        <Text fontWeight="semibold">Estimates</Text>
        <IconButton
          aria-label="Add estimate"
          size="sm"
          variant="ghost"
          colorPalette="blue"
          onClick={handleCreate}
        >
          <MdAdd />
        </IconButton>
      </Flex>

      {jobEstimates.length === 0 && (
        <Text fontSize="sm" color="fg.muted">No estimates yet.</Text>
      )}

      {jobEstimates.map(est => (
        <Box
          key={est.id}
          borderWidth="1px"
          borderRadius="md"
          p={3}
          mb={2}
          cursor="pointer"
          _hover={{ bg: 'bg.subtle' }}
          onClick={() => openEstimate(est.id)}
        >
          <Flex align="center" justify="space-between" mb={0.5}>
            <Text fontSize="sm" fontWeight="medium">{est.estimateNumber}</Text>
            <EstimateStatusBadge status={est.status} />
          </Flex>
          <Text fontSize="xs" color="fg.muted">{formatDate(est.createdAt)}</Text>
        </Box>
      ))}

      {displayEstimate != null && (
        <EstimateDetailModal
          key={displayEstimate.id}
          estimate={displayEstimate}
          open={modalOpen}
          onClose={closeModal}
        />
      )}
    </Box>
  )
}
