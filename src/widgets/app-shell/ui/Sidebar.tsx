import { Box, Flex, Text } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'
import { LuLayoutDashboard, LuCalendar, LuUsers, LuWrench, LuFileText, LuSettings } from 'react-icons/lu'
import type { IconType } from 'react-icons'

const navItems: { to: string; label: string; icon: IconType }[] = [
  { to: '/', label: 'Dashboard', icon: LuLayoutDashboard },
  { to: '/timeline', label: 'Timeline', icon: LuCalendar },
  { to: '/customers', label: 'Customers', icon: LuUsers },
  { to: '/jobs', label: 'Jobs', icon: LuWrench },
  { to: '/invoices', label: 'Invoices', icon: LuFileText },
]

function SidebarLink({ to, label, icon: Icon }: { to: string; label: string; icon: IconType }) {
  return (
    <NavLink to={to} end={to === '/'} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <Flex
          align="center"
          gap={3}
          px={3}
          py={2}
          borderRadius="md"
          fontWeight={isActive ? 'semibold' : 'normal'}
          bg={isActive ? 'blue.50' : 'transparent'}
          color={isActive ? 'blue.700' : 'inherit'}
          _hover={{ bg: isActive ? 'blue.50' : 'gray.100' }}
          cursor="pointer"
        >
          <Icon size={18} />
          <Text>{label}</Text>
        </Flex>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <Box
      as="nav"
      w="220px"
      minH="100dvh"
      borderRightWidth="1px"
      p={4}
      display="flex"
      flexDirection="column"
      flexShrink={0}
    >
      <Text fontWeight="bold" fontSize="lg" mb={6}>ApplianceTrack</Text>

      <Flex direction="column" gap={1} flex={1}>
        {navItems.map(item => <SidebarLink key={item.to} {...item} />)}
      </Flex>

      <SidebarLink to="/settings" label="Settings" icon={LuSettings} />
    </Box>
  )
}
