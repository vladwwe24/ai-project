import { Box, Text } from '@chakra-ui/react'
import type { Customer } from '../model/types'

interface Props {
  customer: Customer
  onClick?: () => void
}

export function CustomerCard({ customer, onClick }: Props) {
  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={3}
      cursor="pointer"
      _hover={{ bg: 'gray.50' }}
      onClick={onClick}
    >
      <Text fontWeight="medium">{customer.name}</Text>
      <Text fontSize="sm" color="fg.muted">{customer.phone}</Text>
      {customer.email && (
        <Text fontSize="sm" color="fg.muted">{customer.email}</Text>
      )}
    </Box>
  )
}
