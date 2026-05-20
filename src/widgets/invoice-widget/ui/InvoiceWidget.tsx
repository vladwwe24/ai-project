import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Text,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import type { Invoice } from '@/entities/invoice/model/types'
import { InvoiceStatus } from '@/entities/invoice/model/types'
import { selectInvoiceByJob } from '@/entities/invoice/model/slice'
import {
  calcSubtotal,
  calcTaxableSubtotal,
  calcTax,
  calcTotal,
} from '@/entities/estimate/model/calcHelpers'
import type { LineItem } from '@/entities/line-item/model/types'
import { InvoiceStatusBadge } from '@/entities/invoice/ui/InvoiceStatusBadge'
import { PaymentActionBar } from '@/features/invoice-payment/ui/PaymentActionBar'
import { SectionedLineItemEditor } from '@/widgets/line-item-editor/ui/SectionedLineItemEditor'
import { formatCurrency, formatDate } from '@/shared/lib/index'
import { MdEdit } from 'react-icons/md'

interface Props {
  jobId: string
}

export function InvoiceWidget({ jobId }: Props) {
  const { invoices } = useAppState()
  const dispatch = useAppDispatch()

  const invoice = selectInvoiceByJob(invoices, jobId)

  const isLocked = invoice?.status === InvoiceStatus.CANCELLED

  const [editMode, setEditMode] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>(invoice?.lineItems ?? [])
  const [taxRate, setTaxRate] = useState(invoice?.taxRate ?? 8.5)
  const [dirty, setDirty] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (invoice) {
      setLineItems(invoice.lineItems)
      setTaxRate(invoice.taxRate)
      setDirty(false)
      if (isLocked) setEditMode(false)
    }
  }, [invoice?.id, invoice?.updatedAt, isLocked])

  if (!invoice) {
    return (
      <Box boxShadow="sm" borderRadius="xl" p={3}>
        <Text fontWeight="semibold" mb={1}>Invoice</Text>
        <Text fontSize="sm" color="fg.muted">No invoice for this job yet.</Text>
      </Box>
    )
  }

  const subtotal = calcSubtotal(lineItems)
  const tax = calcTax(calcTaxableSubtotal(lineItems), taxRate)
  const total = calcTotal(subtotal, tax)

  function handleSave() {
    const paid = invoice!.paidAmount ?? 0
    const hasPaid = invoice!.status === InvoiceStatus.PAID || invoice!.status === InvoiceStatus.PARTIAL

    if (hasPaid && total < paid) {
      setValidationError(`Total cannot be less than amount already paid (${formatCurrency(paid)})`)
      return
    }

    let newStatus = invoice!.status
    if (hasPaid) {
      newStatus = total > paid ? InvoiceStatus.PARTIAL : InvoiceStatus.PAID
    }
    setValidationError(null)
    dispatch({
      type: 'invoice/UPDATE',
      payload: { ...invoice as Invoice, lineItems, taxRate, status: newStatus, updatedAt: new Date().toISOString() },
    })
    setDirty(false)
    setEditMode(false)
  }

  return (
    <Box boxShadow="sm" borderRadius="xl" p={3} style={{ background: 'var(--app-surface)' }}>
      {/* Header */}
      <Flex align="center" justify="space-between" mb={3}>
        <Flex align="center" gap={2}>
          <Text fontWeight="semibold">{invoice.invoiceNumber}</Text>
          <InvoiceStatusBadge status={invoice.status} />
        </Flex>
        <Flex align="center" gap={2}>
          <Text fontSize="xs" color="fg.muted">{formatDate(invoice.createdAt)}</Text>
          {!isLocked && !editMode && (
            <IconButton
              aria-label="Edit invoice"
              size="xs"
              variant="ghost"
              onClick={() => setEditMode(true)}
            >
              <MdEdit />
            </IconButton>
          )}
        </Flex>
      </Flex>

      <SectionedLineItemEditor
        lineItems={lineItems}
        readOnly={!editMode}
        onChange={items => { setLineItems(items); setDirty(true) }}
      />

      {/* Totals */}
      <Box borderTopWidth="1px" borderColor="border.subtle" pt={2} mt={1}>
        <Flex justify="space-between" mb={1}>
          <Text fontSize="sm" color="fg.muted">Subtotal</Text>
          <Text fontSize="sm">{formatCurrency(subtotal)}</Text>
        </Flex>
        <Flex justify="space-between" align="center" mb={1}>
          <Text fontSize="sm" color="fg.muted">Tax</Text>
          <Flex align="center" gap={2} minW={0} flex={1} justify="flex-end">
            {editMode ? (
              <Input
                size="xs"
                type="number"
                min={0}
                step={0.1}
                value={taxRate}
                w="52px"
                textAlign="right"
                flexShrink={0}
                onChange={e => { setTaxRate(parseFloat(e.target.value) || 0); setDirty(true) }}
              />
            ) : (
              <Text fontSize="sm" color="fg.muted" flexShrink={0}>{taxRate}%</Text>
            )}
            <Text fontSize="sm" flexShrink={0}>{formatCurrency(tax)}</Text>
          </Flex>
        </Flex>
        <Flex justify="space-between" fontWeight="bold">
          <Text>Total</Text>
          <Text>{formatCurrency(total)}</Text>
        </Flex>
        {invoice.paidAmount !== undefined && (
          <>
            <Flex justify="space-between" mt={1}>
              <Text fontSize="sm" style={{ color: 'var(--color-success)' }}>Paid</Text>
              <Text fontSize="sm" style={{ color: 'var(--color-success)' }}>{formatCurrency(invoice.paidAmount)}</Text>
            </Flex>
            {total - invoice.paidAmount > 0.001 && (
              <Flex justify="space-between">
                <Text fontSize="sm" fontWeight="medium" style={{ color: 'var(--color-warning)' }}>Balance due</Text>
                <Text fontSize="sm" fontWeight="medium" style={{ color: 'var(--color-warning)' }}>
                  {formatCurrency(total - invoice.paidAmount)}
                </Text>
              </Flex>
            )}
          </>
        )}
      </Box>

      {/* Edit-mode actions */}
      {editMode && (
        <Flex gap={2} mt={3} flexWrap="wrap">
          {validationError && <Text fontSize="xs" w="full" style={{ color: 'var(--color-error)' }}>{validationError}</Text>}
          <Button size="sm" variant="ghost" ml="auto" onClick={() => {
            setLineItems(invoice.lineItems)
            setTaxRate(invoice.taxRate)
            setDirty(false)
            setEditMode(false)
            setValidationError(null)
          }}>
            Cancel
          </Button>
          {dirty && (
            <Button size="sm" colorPalette="blue" onClick={handleSave}>
              Save
            </Button>
          )}
        </Flex>
      )}

      <PaymentActionBar invoice={invoice} jobId={jobId} />
    </Box>
  )
}
