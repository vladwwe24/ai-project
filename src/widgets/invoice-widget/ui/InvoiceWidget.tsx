import {
  Box,
  Button,
  Checkbox,
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
import { selectEstimatesByJob } from '@/entities/estimate/model/slice'
import { EstimateStatus } from '@/entities/estimate/model/types'
import {
  calcSubtotal,
  calcTaxableSubtotal,
  calcTax,
  calcTotal,
} from '@/entities/estimate/model/calcHelpers'
import type { LineItem } from '@/entities/line-item/model/types'
import { InvoiceStatusBadge } from '@/entities/invoice/ui/InvoiceStatusBadge'
import { PaymentActionBar } from '@/features/invoice-payment/ui/PaymentActionBar'
import { formatCurrency, formatDate, nanoid } from '@/shared/lib/index'
import { MdEdit, MdDelete } from 'react-icons/md'

interface Props {
  jobId: string
}

function isLabor(item: LineItem) {
  return item.category !== 'material'
}

function isMaterial(item: LineItem) {
  return item.category === 'material'
}

interface RowViewProps {
  item: LineItem
}

function RowView({ item }: RowViewProps) {
  const total = item.quantity * item.unitPrice
  return (
    <Flex
      align="center"
      gap={2}
      py={1.5}
      borderBottomWidth="1px"
      borderColor="border.subtle"
      _last={{ borderBottom: 'none' }}
    >
      <Box flex="1" fontSize="sm">{item.description || '—'}</Box>
      <Box w="32px" textAlign="right" fontSize="sm" color="fg.muted">{item.quantity}</Box>
      <Box w="60px" textAlign="right" fontSize="sm" color="fg.muted">
        ${item.unitPrice.toFixed(2)}
      </Box>
      <Box w="60px" textAlign="right" fontSize="sm" fontWeight="medium">
        ${total.toFixed(2)}
      </Box>
    </Flex>
  )
}

interface RowEditProps {
  item: LineItem
  onChange: (updated: LineItem) => void
  onDelete: (id: string) => void
}

function RowEdit({ item, onChange, onDelete }: RowEditProps) {
  const total = item.quantity * item.unitPrice
  const taxable = item.taxable !== false

  return (
    <Box py={1.5} borderBottomWidth="1px" borderColor="border.subtle" _last={{ borderBottom: 'none' }}>
      <Flex align="center" gap={2} mb={1}>
        <Box flex="1">
          <Input
            size="sm"
            value={item.description}
            placeholder="Description"
            onChange={e => onChange({ ...item, description: e.target.value })}
          />
        </Box>
        <Box w="48px">
          <Input
            size="sm"
            type="number"
            min={0}
            value={item.quantity}
            textAlign="right"
            onChange={e => onChange({ ...item, quantity: parseFloat(e.target.value) || 0 })}
          />
        </Box>
        <Box w="68px">
          <Input
            size="sm"
            type="number"
            min={0}
            step={0.01}
            value={item.unitPrice}
            textAlign="right"
            onChange={e => onChange({ ...item, unitPrice: parseFloat(e.target.value) || 0 })}
          />
        </Box>
        <Box w="56px" textAlign="right" fontSize="sm" fontWeight="medium" flexShrink={0}>
          ${total.toFixed(2)}
        </Box>
        <IconButton
          aria-label="Remove"
          size="xs"
          variant="ghost"
          colorPalette="red"
          onClick={() => onDelete(item.id)}
        >
          <MdDelete />
        </IconButton>
      </Flex>
      <Flex align="center" gap={1} pl={0.5}>
        <Checkbox.Root
          size="sm"
          checked={taxable}
          onCheckedChange={({ checked }) =>
            onChange({ ...item, taxable: checked === true })
          }
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>
            <Text fontSize="xs" color="fg.muted">Taxable</Text>
          </Checkbox.Label>
        </Checkbox.Root>
      </Flex>
    </Box>
  )
}

interface SectionProps {
  title: string
  items: LineItem[]
  editMode: boolean
  onChange: (updated: LineItem) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

function Section({ title, items, editMode, onChange, onDelete, onAdd }: SectionProps) {
  return (
    <Box mb={3}>
      <Flex align="center" justify="space-between" mb={1}>
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          {title}
        </Text>
        {editMode && (
          <Button size="xs" variant="ghost" colorPalette="blue" onClick={onAdd}>
            + Item
          </Button>
        )}
      </Flex>

      {!editMode && (
        <Flex gap={2} pb={1} borderBottomWidth="1px" borderColor="border.subtle">
          <Text flex="1" fontSize="xs" color="fg.muted">Description</Text>
          <Text w="32px" textAlign="right" fontSize="xs" color="fg.muted">Qty</Text>
          <Text w="60px" textAlign="right" fontSize="xs" color="fg.muted">Price</Text>
          <Text w="60px" textAlign="right" fontSize="xs" color="fg.muted">Total</Text>
        </Flex>
      )}

      {editMode && (
        <Flex gap={2} pb={1} borderBottomWidth="1px" borderColor="border.subtle">
          <Text flex="1" fontSize="xs" color="fg.muted">Description</Text>
          <Text w="48px" textAlign="right" fontSize="xs" color="fg.muted">Qty</Text>
          <Text w="68px" textAlign="right" fontSize="xs" color="fg.muted">Price</Text>
          <Text w="56px" textAlign="right" fontSize="xs" color="fg.muted">Total</Text>
          <Box w="28px" />
        </Flex>
      )}

      {items.length === 0 && (
        <Text fontSize="sm" color="fg.muted" py={2}>No items</Text>
      )}

      {items.map(item =>
        editMode
          ? <RowEdit key={item.id} item={item} onChange={onChange} onDelete={onDelete} />
          : <RowView key={item.id} item={item} />
      )}
    </Box>
  )
}

export function InvoiceWidget({ jobId }: Props) {
  const { invoices, estimates } = useAppState()
  const dispatch = useAppDispatch()

  const invoice = selectInvoiceByJob(invoices, jobId)
  const jobEstimates = selectEstimatesByJob(estimates, jobId)
  const approvedEstimate = jobEstimates.find(e => e.status === EstimateStatus.APPROVED)

  const isPaid = invoice?.status === InvoiceStatus.PAID
    || invoice?.status === InvoiceStatus.CANCELLED

  const [editMode, setEditMode] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>(invoice?.lineItems ?? [])
  const [taxRate, setTaxRate] = useState(invoice?.taxRate ?? 8.5)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (invoice) {
      setLineItems(invoice.lineItems)
      setTaxRate(invoice.taxRate)
      setDirty(false)
      if (isPaid) setEditMode(false)
    }
  }, [invoice?.id, isPaid])

  if (!invoice) {
    return (
      <Box borderWidth="1px" borderRadius="md" p={3}>
        <Text fontWeight="semibold" mb={1}>Invoice</Text>
        <Text fontSize="sm" color="fg.muted">No invoice for this job yet.</Text>
      </Box>
    )
  }

  const laborItems = lineItems.filter(isLabor)
  const materialItems = lineItems.filter(isMaterial)

  const subtotal = calcSubtotal(lineItems)
  const taxableSubtotal = calcTaxableSubtotal(lineItems)
  const tax = calcTax(taxableSubtotal, taxRate)
  const total = calcTotal(subtotal, tax)

  function handleSave() {
    dispatch({
      type: 'invoice/UPDATE',
      payload: { ...invoice as Invoice, lineItems, taxRate, updatedAt: new Date().toISOString() },
    })
    setDirty(false)
    setEditMode(false)
  }

  function handleImportFromEstimate() {
    if (!approvedEstimate) return
    const imported = approvedEstimate.lineItems.map(item => ({ ...item, id: nanoid() }))
    setLineItems(imported)
    setTaxRate(approvedEstimate.taxRate)
    setDirty(true)
  }

  function updateItem(updated: LineItem) {
    setLineItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    setDirty(true)
  }

  function deleteItem(id: string) {
    setLineItems(prev => prev.filter(i => i.id !== id))
    setDirty(true)
  }

  function addItem(category: 'labor' | 'material') {
    const newItem: LineItem = {
      id: nanoid(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxable: true,
      category,
    }
    setLineItems(prev => [...prev, newItem])
    setDirty(true)
  }

  return (
    <Box borderWidth="1px" borderRadius="md" p={3}>
      {/* Header */}
      <Flex align="center" justify="space-between" mb={3}>
        <Flex align="center" gap={2}>
          <Text fontWeight="semibold">{invoice.invoiceNumber}</Text>
          <InvoiceStatusBadge status={invoice.status} />
        </Flex>
        <Flex align="center" gap={2}>
          <Text fontSize="xs" color="fg.muted">{formatDate(invoice.createdAt)}</Text>
          {!isPaid && !editMode && (
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

      {/* Labor section */}
      <Section
        title="Labor"
        items={laborItems}
        editMode={editMode}
        onChange={updateItem}
        onDelete={deleteItem}
        onAdd={() => addItem('labor')}
      />

      {/* Materials section */}
      <Section
        title="Materials"
        items={materialItems}
        editMode={editMode}
        onChange={updateItem}
        onDelete={deleteItem}
        onAdd={() => addItem('material')}
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
      </Box>

      {/* Edit-mode actions */}
      {editMode && (
        <Flex gap={2} mt={3} flexWrap="wrap">
          {approvedEstimate && (
            <Button size="sm" variant="outline" onClick={handleImportFromEstimate}>
              Import from Estimate
            </Button>
          )}
          <Button size="sm" variant="ghost" ml="auto" onClick={() => {
            setLineItems(invoice.lineItems)
            setTaxRate(invoice.taxRate)
            setDirty(false)
            setEditMode(false)
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
