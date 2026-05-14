import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { nanoid } from '@/shared/lib/index'
import type { LineItem } from '@/entities/line-item/model/types'
import { LineItemRow } from './LineItemRow'

interface Props {
  items: LineItem[]
  readOnly?: boolean
  onChange: (items: LineItem[]) => void
}

export function LineItemEditor({ items, readOnly = false, onChange }: Props) {
  function addItem() {
    const newItem: LineItem = { id: nanoid(), description: '', quantity: 1, unitPrice: 0 }
    onChange([...items, newItem])
  }

  function updateItem(updated: LineItem) {
    onChange(items.map(i => i.id === updated.id ? updated : i))
  }

  function deleteItem(id: string) {
    onChange(items.filter(i => i.id !== id))
  }

  return (
    <Box>
      {/* Column headers */}
      <Flex gap={2} pb={1} borderBottomWidth="1px" borderColor="border.subtle">
        <Text flex="1" fontSize="xs" color="fg.muted" fontWeight="medium">Description</Text>
        <Text w="52px" textAlign="right" fontSize="xs" color="fg.muted" fontWeight="medium">Qty</Text>
        <Text w="72px" textAlign="right" fontSize="xs" color="fg.muted" fontWeight="medium">Price</Text>
        <Text w="64px" textAlign="right" fontSize="xs" color="fg.muted" fontWeight="medium">Total</Text>
        {!readOnly && <Box w="32px" />}
      </Flex>

      {items.length === 0 && (
        <Text fontSize="sm" color="fg.muted" py={3} textAlign="center">No items yet</Text>
      )}

      {items.map(item => (
        <LineItemRow
          key={item.id}
          item={item}
          readOnly={readOnly}
          onChange={updateItem}
          onDelete={deleteItem}
        />
      ))}

      {!readOnly && (
        <Button size="sm" variant="ghost" colorPalette="blue" mt={2} onClick={addItem}>
          + Add item
        </Button>
      )}
    </Box>
  )
}
