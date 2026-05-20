import { Button, Flex, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useAppState } from '@/app/providers/AppProvider'
import { AppModal } from '@/shared/ui/AppModal'
import { exportInvoicesToCsv, countExportRows } from '../lib/csvExport'

interface Props {
  open: boolean
  onClose: () => void
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--chakra-colors-border)',
  borderRadius: '6px',
  fontSize: '14px',
  background: 'var(--app-surface)',
  color: 'inherit',
}

export function ExportModal({ open, onClose }: Props) {
  const { invoices, jobs, customers } = useAppState()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const fromDate = from ? new Date(from) : null
  const toDate = to ? new Date(to) : null
  const count = countExportRows({ invoices, from: fromDate, to: toDate })

  function handleExport() {
    exportInvoicesToCsv({ invoices, jobs, customers, from: fromDate, to: toDate })
    onClose()
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button colorPalette="blue" onClick={handleExport} disabled={count === 0}>
        Download CSV
      </Button>
    </>
  )

  return (
    <AppModal open={open} onClose={onClose} title="Export Invoices" size="sm" footer={footer}>
      <Flex direction="column" gap={4}>
        <Flex direction="column" gap={1}>
          <Text fontSize="sm" fontWeight="medium">From</Text>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            style={inputStyle}
          />
        </Flex>

        <Flex direction="column" gap={1}>
          <Text fontSize="sm" fontWeight="medium">To</Text>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            style={inputStyle}
          />
        </Flex>

        <Text fontSize="sm" color="fg.muted">
          {count === 0
            ? 'No invoices match the selected range.'
            : `${count} invoice${count !== 1 ? 's' : ''} will be exported.`}
        </Text>
      </Flex>
    </AppModal>
  )
}
