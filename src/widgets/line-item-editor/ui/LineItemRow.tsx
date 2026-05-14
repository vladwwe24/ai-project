import { Box, Flex, IconButton, Input } from '@chakra-ui/react'
import { MdDelete } from 'react-icons/md'
import type { LineItem } from '@/entities/line-item/model/types'

interface Props {
  item: LineItem
  readOnly?: boolean
  onChange: (updated: LineItem) => void
  onDelete: (id: string) => void
}

export function LineItemRow({ item, readOnly = false, onChange, onDelete }: Props) {
  const lineTotal = item.quantity * item.unitPrice

  if (readOnly) {
    return (
      <Flex align="center" gap={2} py={1.5} borderBottomWidth="1px" borderColor="border.subtle" _last={{ borderBottom: 'none' }}>
        <Box flex="1" fontSize="sm">{item.description || '—'}</Box>
        <Box w="40px" textAlign="right" fontSize="sm" color="fg.muted">{item.quantity}</Box>
        <Box w="64px" textAlign="right" fontSize="sm" color="fg.muted">
          ${item.unitPrice.toFixed(2)}
        </Box>
        <Box w="64px" textAlign="right" fontSize="sm" fontWeight="medium">
          ${lineTotal.toFixed(2)}
        </Box>
      </Flex>
    )
  }

  return (
    <Flex align="center" gap={2} py={1.5} borderBottomWidth="1px" borderColor="border.subtle" _last={{ borderBottom: 'none' }}>
      <Box flex="1">
        <Input
          size="sm"
          value={item.description}
          placeholder="Description"
          onChange={e => onChange({ ...item, description: e.target.value })}
        />
      </Box>
      <Box w="52px">
        <Input
          size="sm"
          type="number"
          min={0}
          value={item.quantity}
          textAlign="right"
          onChange={e => onChange({ ...item, quantity: parseFloat(e.target.value) || 0 })}
        />
      </Box>
      <Box w="72px">
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
      <Box w="64px" textAlign="right" fontSize="sm" fontWeight="medium" flexShrink={0}>
        ${lineTotal.toFixed(2)}
      </Box>
      <IconButton
        aria-label="Remove line item"
        size="sm"
        variant="ghost"
        colorPalette="red"
        onClick={() => onDelete(item.id)}
      >
        <MdDelete />
      </IconButton>
    </Flex>
  )
}
