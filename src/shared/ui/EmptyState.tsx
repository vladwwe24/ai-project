import { Flex, Text } from '@chakra-ui/react'

interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Flex direction="column" align="center" justify="center" gap={2} py={12} px={4}>
      <Text fontWeight="semibold" textAlign="center">{title}</Text>
      {description && (
        <Text color="fg.muted" textAlign="center" fontSize="sm">{description}</Text>
      )}
    </Flex>
  )
}
