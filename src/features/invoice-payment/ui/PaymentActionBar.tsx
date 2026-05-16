import { Box, Button, Flex, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import type { Invoice } from '@/entities/invoice/model/types'
import { InvoiceStatus } from '@/entities/invoice/model/types'
import { JobStatus } from '@/entities/job/model/types'
import { selectJobById } from '@/entities/job/model/slice'
import { AppModal } from '@/shared/ui/AppModal'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

interface Props {
  invoice: Invoice
  jobId: string
}

export function PaymentActionBar({ invoice, jobId }: Props) {
  const dispatch = useAppDispatch()
  const { jobs } = useAppState()

  const [confirmPaid, setConfirmPaid] = useState(false)
  const [partialOpen, setPartialOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')

  const canMarkPaid = invoice.status === InvoiceStatus.UNPAID
    || invoice.status === InvoiceStatus.PARTIAL
    || invoice.status === InvoiceStatus.OVERDUE

  const canMarkPartial = invoice.status === InvoiceStatus.UNPAID
    || invoice.status === InvoiceStatus.OVERDUE

  if (!canMarkPaid && !canMarkPartial) return null

  function markPaid() {
    const now = new Date().toISOString()
    dispatch({
      type: 'invoice/UPDATE',
      payload: {
        ...invoice,
        status: InvoiceStatus.PAID,
        paidAt: now,
        updatedAt: now,
      },
    })
    const job = selectJobById(jobs, jobId)
    if (job) {
      dispatch({
        type: 'job/UPDATE',
        payload: { ...job, status: JobStatus.COMPLETED, completedAt: now, updatedAt: now },
      })
    }
  }

  function markPartial() {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) return
    dispatch({
      type: 'invoice/UPDATE',
      payload: {
        ...invoice,
        status: InvoiceStatus.PARTIAL,
        paidAmount: amount,
        updatedAt: new Date().toISOString(),
      },
    })
    setPartialOpen(false)
    setDepositAmount('')
  }

  const partialFooter = (
    <>
      <Button variant="ghost" onClick={() => { setPartialOpen(false); setDepositAmount('') }}>
        Cancel
      </Button>
      <Button
        colorPalette="yellow"
        onClick={markPartial}
        disabled={!depositAmount || parseFloat(depositAmount) <= 0}
      >
        Confirm Deposit
      </Button>
    </>
  )

  return (
    <>
      <Flex gap={2} mt={3} pt={3} borderTopWidth="1px" borderColor="border.subtle" align="center">
        <Text fontSize="sm" color="fg.muted" mr="auto">Payment</Text>
        {canMarkPartial && (
          <Button size="sm" variant="outline" colorPalette="yellow" onClick={() => setPartialOpen(true)}>
            Mark Partial
          </Button>
        )}
        {canMarkPaid && (
          <Button size="sm" colorPalette="green" onClick={() => setConfirmPaid(true)}>
            Mark Paid
          </Button>
        )}
      </Flex>

      <ConfirmDialog
        open={confirmPaid}
        onClose={() => setConfirmPaid(false)}
        onConfirm={markPaid}
        title="Confirm Payment"
        message="Mark this invoice as fully paid? This will also mark the job as Completed."
        confirmLabel="Mark Paid"
      />

      <AppModal
        open={partialOpen}
        onClose={() => { setPartialOpen(false); setDepositAmount('') }}
        title="Partial Payment"
        footer={partialFooter}
      >
        <Text fontSize="sm" mb={3}>How much did the customer deposit?</Text>
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>Deposit Amount ($)</Text>
          <Input
            type="number"
            min={0}
            step={0.01}
            placeholder="0.00"
            value={depositAmount}
            onChange={e => setDepositAmount(e.target.value)}
            inputMode="decimal"
          />
        </Box>
      </AppModal>
    </>
  )
}
