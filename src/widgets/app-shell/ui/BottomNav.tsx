import { Box, Flex, Text } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'
import { LuLayoutDashboard, LuCalendar, LuUsers, LuWrench, LuFileText } from 'react-icons/lu'
import type { IconType } from 'react-icons'

const navItems: { to: string; label: string; icon: IconType }[] = [
  { to: '/', label: 'Dashboard', icon: LuLayoutDashboard },
  { to: '/timeline', label: 'Timeline', icon: LuCalendar },
  { to: '/customers', label: 'Customers', icon: LuUsers },
  { to: '/jobs', label: 'Jobs', icon: LuWrench },
  { to: '/invoices', label: 'Invoices', icon: LuFileText },
]

export function BottomNav() {
  return (
    <Box as="nav" borderTopWidth="1px" bg="white">
      <Flex h="56px">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} style={{ flex: 1, textDecoration: 'none' }}>
            {({ isActive }) => (
              <Flex
                direction="column"
                align="center"
                justify="center"
                h="full"
                gap="2px"
                color={isActive ? 'blue.600' : 'gray.500'}
              >
                <Icon size={22} />
                <Text fontSize="10px" lineHeight={1}>{label}</Text>
              </Flex>
            )}
          </NavLink>
        ))}
      </Flex>
    </Box>
  )
}
