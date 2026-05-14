import { Flex, Heading } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  action?: ReactNode
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <Flex align="center" justify="space-between" px={4} py={3}>
      <Heading size="lg">{title}</Heading>
      {action}
    </Flex>
  )
}
