import { Box, Text } from '@chakra-ui/react'
import type { Job } from '@/entities/job/model/types'
import { formatTime } from '@/shared/lib/index'

const LABEL_LEFT = 56 // px — space reserved for hour labels
const GUTTER = 8      // px — right margin

interface Props {
  job: Job
  customerName?: string
  top: number
  height: number
  columnIndex: number
  totalColumns: number
  onClick: () => void
}

export function JobBlock({ job, customerName, top, height, columnIndex, totalColumns, onClick }: Props) {
  const colWidth = `calc((100% - ${LABEL_LEFT}px - ${GUTTER}px) / ${totalColumns})`
  const left = `calc(${LABEL_LEFT}px + ${columnIndex} * ${colWidth})`
  const width = `calc(${colWidth} - 2px)`

  const timeLabel = job.scheduledEndAt
    ? `${formatTime(job.scheduledAt)} – ${formatTime(job.scheduledEndAt)}`
    : formatTime(job.scheduledAt)

  return (
    <Box
      position="absolute"
      top={`${top}px`}
      left={left}
      width={width}
      height={`${height}px`}
      className="job-block"
      borderLeftWidth="3px"
      borderRadius="md"
      p={1}
      cursor="pointer"
      overflow="hidden"
      zIndex={1}
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        background: 'var(--job-block-bg)',
        color: 'var(--job-block-fg)',
        borderLeftColor: 'var(--job-block-border)',
      }}
    >
      <Text fontSize="xs" fontWeight="semibold" lineClamp={1}>
        {job.applianceType}{job.brand ? ` · ${job.brand}` : ''}
      </Text>
      {customerName && (
        <Text fontSize="xs" color="fg.muted" lineClamp={1}>{customerName}</Text>
      )}
      <Text fontSize="xs" color="fg.subtle">{timeLabel}</Text>
    </Box>
  )
}
