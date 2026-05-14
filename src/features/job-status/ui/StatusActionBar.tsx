import { Flex, Button } from '@chakra-ui/react'
import { useAppDispatch } from '@/app/providers/AppProvider'
import type { Job } from '@/entities/job/model/types'
import { JobStatus } from '@/entities/job/model/types'
import {
  isTerminal,
  getNextStatus,
  getAdvanceLabel,
  canFinishJob,
} from '@/entities/job/model/statusHelpers'

interface Props {
  job: Job
}

export function StatusActionBar({ job }: Props) {
  const dispatch = useAppDispatch()

  if (isTerminal(job.status)) return null

  const nextStatus = getNextStatus(job.status)
  const advanceLabel = getAdvanceLabel(job.status)
  const showFinish = canFinishJob(job.status)

  function advance() {
    if (!nextStatus) return
    dispatch({
      type: 'job/UPDATE',
      payload: { ...job, status: nextStatus, updatedAt: new Date().toISOString() },
    })
  }

  function finishJob() {
    dispatch({
      type: 'job/UPDATE',
      payload: {
        ...job,
        status: JobStatus.COMPLETED,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  }

  return (
    <Flex gap={2} px={4} pb={4}>
      {nextStatus && advanceLabel && (
        <Button colorPalette="blue" flex={1} onClick={advance}>
          {advanceLabel}
        </Button>
      )}
      {showFinish && (
        <Button variant="outline" onClick={finishJob}>
          Finish Job
        </Button>
      )}
    </Flex>
  )
}
