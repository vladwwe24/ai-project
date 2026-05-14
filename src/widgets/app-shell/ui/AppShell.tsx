import { Box, Flex } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <Flex h="100dvh">
      <Box display={{ base: 'none', md: 'block' }}>
        <Sidebar />
      </Box>

      <Flex flex={1} direction="column" overflow="hidden">
        <Box display={{ base: 'block', md: 'none' }}>
          <Navbar />
        </Box>

        <Box flex={1} overflowY="auto" pb={{ base: '72px', md: 0 }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>

        <Box
          display={{ base: 'block', md: 'none' }}
          position="fixed"
          bottom={0}
          left={0}
          right={0}
        >
          <BottomNav />
        </Box>
      </Flex>
    </Flex>
  )
}
