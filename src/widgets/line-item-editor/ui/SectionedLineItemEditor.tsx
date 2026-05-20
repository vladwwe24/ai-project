import { Box, Checkbox, Flex, IconButton, Input, Text } from '@chakra-ui/react'
import { MdAdd, MdDelete } from 'react-icons/md'
import { nanoid } from '@/shared/lib/index'
import type { LineItem } from '@/entities/line-item/model/types'

interface Props {
  lineItems: LineItem[]
  readOnly?: boolean
  onChange: (items: LineItem[]) => void
}

function RowView({ item }: { item: LineItem }) {
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

function RowEdit({
  item,
  onChange,
  onDelete,
}: {
  item: LineItem
  onChange: (updated: LineItem) => void
  onDelete: (id: string) => void
}) {
  const total = item.quantity * item.unitPrice
  const taxable = item.taxable !== false

  return (
    <Box
      py={1.5}
      borderBottomWidth="1px"
      borderColor="border.subtle"
      _last={{ borderBottom: 'none' }}
    >
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
          onCheckedChange={({ checked }) => onChange({ ...item, taxable: checked === true })}
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
  readOnly: boolean
  onAdd: () => void
  onChange: (updated: LineItem) => void
  onDelete: (id: string) => void
}

function Section({ title, items, readOnly, onAdd, onChange, onDelete }: SectionProps) {
  return (
    <Box mb={3}>
      <Flex align="center" justify="space-between" mb={1}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wide"
        >
          {title}
        </Text>
        {!readOnly && (
          <IconButton
            aria-label={`Add ${title.toLowerCase()} item`}
            size="xs"
            variant="ghost"
            borderRadius="full"
            colorPalette="blue"
            onClick={onAdd}
          >
            <MdAdd />
          </IconButton>
        )}
      </Flex>

      {readOnly ? (
        <Flex gap={2} pb={1} borderBottomWidth="1px" borderColor="border.subtle">
          <Text flex="1" fontSize="xs" color="fg.muted">Description</Text>
          <Text w="32px" textAlign="right" fontSize="xs" color="fg.muted">Qty</Text>
          <Text w="60px" textAlign="right" fontSize="xs" color="fg.muted">Price</Text>
          <Text w="60px" textAlign="right" fontSize="xs" color="fg.muted">Total</Text>
        </Flex>
      ) : (
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
        readOnly
          ? <RowView key={item.id} item={item} />
          : <RowEdit key={item.id} item={item} onChange={onChange} onDelete={onDelete} />
      )}
    </Box>
  )
}

export function SectionedLineItemEditor({ lineItems, readOnly = false, onChange }: Props) {
  const laborItems = lineItems.filter(item => item.category !== 'material')
  const materialItems = lineItems.filter(item => item.category === 'material')

  function addItem(category: 'labor' | 'material') {
    const newItem: LineItem = {
      id: nanoid(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxable: true,
      category,
    }
    onChange([...lineItems, newItem])
  }

  function updateItem(updated: LineItem) {
    onChange(lineItems.map(i => i.id === updated.id ? updated : i))
  }

  function deleteItem(id: string) {
    onChange(lineItems.filter(i => i.id !== id))
  }

  return (
    <Box>
      <Section
        title="Labor"
        items={laborItems}
        readOnly={readOnly}
        onAdd={() => addItem('labor')}
        onChange={updateItem}
        onDelete={deleteItem}
      />
      <Section
        title="Materials"
        items={materialItems}
        readOnly={readOnly}
        onAdd={() => addItem('material')}
        onChange={updateItem}
        onDelete={deleteItem}
      />
    </Box>
  )
}
