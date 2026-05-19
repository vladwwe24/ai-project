import { Box, Button, Flex, Input, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import type { Estimate } from '@/entities/estimate/model/types'
import { EstimateStatus } from '@/entities/estimate/model/types'
import { selectInvoiceByJob } from '@/entities/invoice/model/slice'
import { EstimateStatusBadge } from '@/entities/estimate/ui/EstimateStatusBadge'
import { calcSubtotal, calcTax, calcTotal } from '@/entities/estimate/model/calcHelpers'
import type { LineItem } from '@/entities/line-item/model/types'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { AppModal } from '@/shared/ui/AppModal'
import { formatCurrency, formatDate, nanoid } from '@/shared/lib/index'
import { LineItemEditor } from '@/widgets/line-item-editor/ui/LineItemEditor'
import { SendEstimateButton } from '@/features/estimate-send/ui/SendEstimateButton'

interface Props {
  estimate: Estimate
  open: boolean
  onClose: () => void
}

export function EstimateDetailModal({ estimate, open, onClose }: Props) {
  const dispatch = useAppDispatch()
  const { invoices } = useAppState()
  const [lineItems, setLineItems] = useState<LineItem[]>(estimate.lineItems)
  const [taxRate, setTaxRate] = useState(estimate.taxRate)
  const [dirty, setDirty] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmApply, setConfirmApply] = useState(false)

  const invoice = selectInvoiceByJob(invoices, estimate.jobId)

  useEffect(() => {
    setLineItems(estimate.lineItems)
    setTaxRate(estimate.taxRate)
    setDirty(false)
  }, [estimate.id])

  const isEditable = estimate.status === EstimateStatus.DRAFT
  const subtotal = calcSubtotal(lineItems)
  const tax = calcTax(subtotal, taxRate)
  const total = calcTotal(subtotal, tax)

  function handleSave() {
    dispatch({
      type: 'estimate/UPDATE',
      payload: { ...estimate, lineItems, taxRate, updatedAt: new Date().toISOString() },
    })
    setDirty(false)
  }

  function handleDelete() {
    dispatch({ type: 'estimate/REMOVE', payload: estimate.id })
    onClose()
  }

  function handleApplyToInvoice() {
    if (!invoice) return
    dispatch({
      type: 'invoice/UPDATE',
      payload: {
        ...invoice,
        lineItems: lineItems.map(item => ({ ...item, id: nanoid() })),
        updatedAt: new Date().toISOString(),
      },
    })
    setConfirmApply(false)
  }

  function handleLineItemsChange(items: LineItem[]) {
    setLineItems(items)
    setDirty(true)
  }

  function handleTaxChange(val: string) {
    setTaxRate(parseFloat(val) || 0)
    setDirty(true)
  }

  const approvalLink = estimate.approvalToken
    ? `${window.location.origin}/approve/${estimate.approvalToken}`
    : null

  const title = (
    <Flex align="center" gap={2} flexWrap="wrap">
      <Text fontWeight="semibold">{estimate.estimateNumber}</Text>
      <EstimateStatusBadge status={estimate.status} />
    </Flex>
  )

  const footer = (
    <Flex w="full" gap={2} flexWrap="wrap">
      {isEditable && (
        <Button
          size="sm"
          variant="ghost"
          colorPalette="red"
          mr="auto"
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </Button>
      )}
      {invoice && lineItems.length > 0 && (
        <Button size="sm" variant="outline" colorPalette="green" onClick={() => setConfirmApply(true)}>
          Apply to Invoice
        </Button>
      )}
      {isEditable && dirty && (
        <Button size="sm" variant="outline" onClick={handleSave}>
          Save
        </Button>
      )}
      {isEditable && (
        <SendEstimateButton estimate={estimate} lineItems={lineItems} taxRate={taxRate} />
      )}
    </Flex>
  )

  return (
    <>
      <AppModal open={open} onClose={onClose} title={title} size="md" footer={footer}>
        <Box overflowY="auto" maxH="60vh">
          <Text fontSize="xs" color="fg.muted" mb={3}>
            Created {formatDate(estimate.createdAt)}
          </Text>

          <LineItemEditor
            items={lineItems}
            readOnly={!isEditable}
            onChange={handleLineItemsChange}
          />

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
                    onChange={e => handleTaxChange(e.target.value)}
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

          {estimate.status === EstimateStatus.SENT && approvalLink && (
            <Box mt={3} p={2} bg="blue.50" borderRadius="md">
              <Text fontSize="sm" color="blue.700" mb={1}>
                Sent — awaiting customer approval.
              </Text>
              <Text
                fontSize="xs"
                color="blue.600"
                cursor="pointer"
                textDecoration="underline"
                onClick={() => navigator.clipboard.writeText(approvalLink).catch(() => {})}
              >
                Copy approval link
              </Text>
            </Box>
          )}

          {estimate.status === EstimateStatus.APPROVED && (
            <Box mt={3} p={2} bg="green.50" borderRadius="md">
              <Text fontSize="sm" color="green.700">
                Approved
                {estimate.approvedAt
                  ? ` on ${new Date(estimate.approvedAt).toLocaleDateString()}`
                  : ''}
                {estimate.approvedBy ? ` by ${estimate.approvedBy}` : ''}.
              </Text>
            </Box>
          )}

          {estimate.status === EstimateStatus.REJECTED && (
            <Box mt={3} p={2} bg="red.50" borderRadius="md">
              <Text fontSize="sm" color="red.700">Declined by customer.</Text>
            </Box>
          )}
        </Box>
      </AppModal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Estimate"
        message={`Delete ${estimate.estimateNumber}? This cannot be undone.`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={confirmApply}
        onClose={() => setConfirmApply(false)}
        onConfirm={handleApplyToInvoice}
        title="Apply to Invoice"
        message="This will replace all current invoice line items with this estimate's items. Continue?"
        confirmLabel="Apply"
      />
    </>
  )
}
