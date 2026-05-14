import { Box, Text } from '@chakra-ui/react'

export function Navbar() {
  return (
    <Box
      as="header"
      h="56px"
      display="flex"
      alignItems="center"
      px={4}
      borderBottomWidth="1px"
      flexShrink={0}
    >
      <Text fontWeight="bold" fontSize="lg">ApplianceTrack</Text>
    </Box>
  )
}
