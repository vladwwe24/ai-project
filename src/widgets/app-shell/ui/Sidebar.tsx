import { Box, Flex, IconButton, Text } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'
import { LuLayoutDashboard, LuCalendar, LuUsers, LuWrench, LuFileText, LuSettings } from 'react-icons/lu'
import { MdDarkMode, MdLightMode } from 'react-icons/md'
import type { IconType } from 'react-icons'
import { useTheme } from '@/shared/lib/ThemeContext'

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
          color={isActive ? 'blue.700' : 'fg.muted'}
          _dark={{
            bg: isActive ? 'rgba(99,120,255,0.18)' : 'transparent',
            color: isActive ? 'blue.300' : 'fg.muted',
          }}
          _hover={{ bg: isActive ? undefined : 'bg.subtle' }}
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
  const { dark, toggle } = useTheme()

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
      style={{ background: 'var(--app-nav-bg)' }}
    >
      <Text fontWeight="bold" fontSize="lg" mb={6}>ApplianceTrack</Text>

      <Flex direction="column" gap={1} flex={1}>
        {navItems.map(item => <SidebarLink key={item.to} {...item} />)}
      </Flex>

      <SidebarLink to="/settings" label="Settings" icon={LuSettings} />

      <Flex justify="center" mt={3} pt={3} borderTopWidth="1px" borderColor="border.subtle">
        <IconButton aria-label="Toggle theme" size="sm" variant="ghost" onClick={toggle}>
          {dark ? <MdLightMode /> : <MdDarkMode />}
        </IconButton>
      </Flex>
    </Box>
  )
}
