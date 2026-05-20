import { Box, IconButton, Text } from '@chakra-ui/react'
import { MdDarkMode, MdLightMode } from 'react-icons/md'
import { useTheme } from '@/shared/lib/ThemeContext'

export function Navbar() {
  const { dark, toggle } = useTheme()

  return (
    <Box
      as="header"
      h="56px"
      display="flex"
      alignItems="center"
      px={4}
      borderBottomWidth="1px"
      flexShrink={0}
      style={{ background: 'var(--app-nav-bg)' }}
    >
      <Text fontWeight="bold" fontSize="lg" flex={1}>ApplianceTrack</Text>
      <IconButton aria-label="Toggle theme" size="sm" variant="ghost" onClick={toggle}>
        {dark ? <MdLightMode /> : <MdDarkMode />}
      </IconButton>
    </Box>
  )
}
