import { Button, Flex, Text } from '@chakra-ui/react'
import { useAppDispatch } from '@/app/providers/AppProvider'
import type { Invoice } from '@/entities/invoice/model/types'
import { InvoiceStatus } from '@/entities/invoice/model/types'

interface Props {
  invoice: Invoice
}

export function PaymentActionBar({ invoice }: Props) {
  const dispatch = useAppDispatch()

  const canMarkPaid = invoice.status === InvoiceStatus.UNPAID
    || invoice.status === InvoiceStatus.PARTIAL
    || invoice.status === InvoiceStatus.OVERDUE

  const canMarkPartial = invoice.status === InvoiceStatus.UNPAID
    || invoice.status === InvoiceStatus.OVERDUE

  if (!canMarkPaid && !canMarkPartial) return null

  function markPaid() {
    dispatch({
      type: 'invoice/UPDATE',
      payload: {
        ...invoice,
        status: InvoiceStatus.PAID,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  }

  function markPartial() {
    dispatch({
      type: 'invoice/UPDATE',
      payload: {
        ...invoice,
        status: InvoiceStatus.PARTIAL,
        updatedAt: new Date().toISOString(),
      },
    })
  }

  return (
    <Flex gap={2} mt={3} pt={3} borderTopWidth="1px" borderColor="border.subtle" align="center">
      <Text fontSize="sm" color="fg.muted" mr="auto">Payment</Text>
      {canMarkPartial && (
        <Button size="sm" variant="outline" colorPalette="yellow" onClick={markPartial}>
          Mark Partial
        </Button>
      )}
      {canMarkPaid && (
        <Button size="sm" colorPalette="green" onClick={markPaid}>
          Mark Paid
        </Button>
      )}
    </Flex>
  )
}
