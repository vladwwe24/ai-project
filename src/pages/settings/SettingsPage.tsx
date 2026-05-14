import { Box, Button, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { getSettings, saveSettings } from '@/shared/config/settings'

export function SettingsPage() {
  const [taxRate, setTaxRate] = useState(() => getSettings().defaultTaxRate)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    saveSettings({ defaultTaxRate: Math.max(0, Math.min(100, taxRate)) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Box>
      <PageHeader title="Settings" />

      <Box px={4} pt={2} maxW="420px">
        <Text fontSize="sm" fontWeight="medium" mb={1}>Default Tax Rate (%)</Text>
        <Text fontSize="xs" color="fg.muted" mb={2}>
          Applied automatically to new estimates and invoices.
        </Text>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={taxRate}
          onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
          mb={4}
          w="160px"
        />
        <Box>
          <Button colorPalette="blue" onClick={handleSave}>Save</Button>
          {saved && (
            <Text display="inline" color="green.600" fontSize="sm" ml={3}>
              Saved!
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  )
}
