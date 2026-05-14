import { Box, Button, Flex, Input, Text } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import type { Invoice } from '@/entities/invoice/model/types'
import { InvoiceStatus } from '@/entities/invoice/model/types'
import { selectInvoiceByJob } from '@/entities/invoice/model/slice'
import { selectEstimatesByJob } from '@/entities/estimate/model/slice'
import { EstimateStatus } from '@/entities/estimate/model/types'
import { calcSubtotal, calcTax, calcTotal } from '@/entities/estimate/model/calcHelpers'
import type { LineItem } from '@/entities/line-item/model/types'
import { InvoiceStatusBadge } from '@/entities/invoice/ui/InvoiceStatusBadge'
import { PaymentActionBar } from '@/features/invoice-payment/ui/PaymentActionBar'
import { LineItemEditor } from '@/widgets/line-item-editor/ui/LineItemEditor'
import { formatCurrency, formatDate, nanoid } from '@/shared/lib/index'

interface Props {
  jobId: string
}

export function InvoiceWidget({ jobId }: Props) {
  const { invoices, estimates } = useAppState()
  const dispatch = useAppDispatch()

  const invoice = selectInvoiceByJob(invoices, jobId)
  const jobEstimates = selectEstimatesByJob(estimates, jobId)
  const approvedEstimate = jobEstimates.find(e => e.status === EstimateStatus.APPROVED)

  const isEditable = invoice
    ? invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.CANCELLED
    : false

  const [lineItems, setLineItems] = useState<LineItem[]>(invoice?.lineItems ?? [])
  const [taxRate, setTaxRate] = useState(invoice?.taxRate ?? 8.5)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (invoice) {
      setLineItems(invoice.lineItems)
      setTaxRate(invoice.taxRate)
      setDirty(false)
    }
  }, [invoice?.id])

  if (!invoice) {
    return (
      <Box borderWidth="1px" borderRadius="md" p={3}>
        <Text fontWeight="semibold" mb={1}>Invoice</Text>
        <Text fontSize="sm" color="fg.muted">No invoice for this job yet.</Text>
      </Box>
    )
  }

  const subtotal = calcSubtotal(lineItems)
  const tax = calcTax(subtotal, taxRate)
  const total = calcTotal(subtotal, tax)

  function handleSave() {
    dispatch({
      type: 'invoice/UPDATE',
      payload: { ...invoice as Invoice, lineItems, taxRate, updatedAt: new Date().toISOString() },
    })
    setDirty(false)
  }

  function handleImportFromEstimate() {
    if (!approvedEstimate) return
    const imported = approvedEstimate.lineItems.map(item => ({ ...item, id: nanoid() }))
    setLineItems(imported)
    setTaxRate(approvedEstimate.taxRate)
    setDirty(true)
  }

  return (
    <Box borderWidth="1px" borderRadius="md" p={3}>
      <Flex align="center" justify="space-between" mb={3}>
        <Flex align="center" gap={2}>
          <Text fontWeight="semibold">{invoice.invoiceNumber}</Text>
          <InvoiceStatusBadge status={invoice.status} />
        </Flex>
        <Text fontSize="xs" color="fg.muted">{formatDate(invoice.createdAt)}</Text>
      </Flex>

      <LineItemEditor
        items={lineItems}
        readOnly={!isEditable}
        onChange={items => { setLineItems(items); setDirty(true) }}
      />

      {/* Totals */}
      <Box mt={3} borderTopWidth="1px" borderColor="border.subtle" pt={2}>
        <Flex justify="space-between" mb={1}>
          <Text fontSize="sm" color="fg.muted">Subtotal</Text>
          <Text fontSize="sm">{formatCurrency(subtotal)}</Text>
        </Flex>
        <Flex justify="space-between" align="center" mb={1}>
          <Text fontSize="sm" color="fg.muted">Tax</Text>
          <Flex align="center" gap={2}>
            {isEditable ? (
              <Input
                size="xs"
                type="number"
                min={0}
                step={0.1}
                value={taxRate}
                w="52px"
                textAlign="right"
                onChange={e => { setTaxRate(parseFloat(e.target.value) || 0); setDirty(true) }}
              />
            ) : (
              <Text fontSize="sm" color="fg.muted">{taxRate}%</Text>
            )}
            <Text fontSize="sm">{formatCurrency(tax)}</Text>
          </Flex>
        </Flex>
        <Flex justify="space-between" fontWeight="bold">
          <Text>Total</Text>
          <Text>{formatCurrency(total)}</Text>
        </Flex>
      </Box>

      {/* Actions */}
      {isEditable && (
        <Flex gap={2} mt={3} flexWrap="wrap">
          {approvedEstimate && (
            <Button size="sm" variant="outline" onClick={handleImportFromEstimate}>
              Import from Estimate
            </Button>
          )}
          {dirty && (
            <Button size="sm" colorPalette="blue" ml="auto" onClick={handleSave}>
              Save
            </Button>
          )}
        </Flex>
      )}

      <PaymentActionBar invoice={invoice} />
    </Box>
  )
}
