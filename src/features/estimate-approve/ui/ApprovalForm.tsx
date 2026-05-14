import { Box, Button, Flex, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useAppDispatch } from '@/app/providers/AppProvider'
import type { Estimate } from '@/entities/estimate/model/types'
import { EstimateStatus } from '@/entities/estimate/model/types'
import { calcSubtotal, calcTax, calcTotal } from '@/entities/estimate/model/calcHelpers'
import { EstimateStatusBadge } from '@/entities/estimate/ui/EstimateStatusBadge'
import { LineItemEditor } from '@/widgets/line-item-editor/ui/LineItemEditor'
import { formatCurrency } from '@/shared/lib/index'

interface Props {
  estimate: Estimate
}

export function ApprovalForm({ estimate }: Props) {
  const dispatch = useAppDispatch()
  const [name, setName] = useState('')
  const [done, setDone] = useState(false)

  const subtotal = calcSubtotal(estimate.lineItems)
  const tax = calcTax(subtotal, estimate.taxRate)
  const total = calcTotal(subtotal, tax)

  function handleDecision(approved: boolean) {
    const now = new Date().toISOString()
    dispatch({
      type: 'estimate/UPDATE',
      payload: {
        ...estimate,
        status: approved ? EstimateStatus.APPROVED : EstimateStatus.REJECTED,
        approvedAt: approved ? now : undefined,
        approvedBy: approved ? name.trim() || undefined : undefined,
        updatedAt: now,
      },
    })
    setDone(true)
  }

  if (done) {
    return (
      <Box textAlign="center" py={8}>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Response recorded
        </Text>
        <Text color="fg.muted">You may close this page.</Text>
      </Box>
    )
  }

  const alreadyProcessed =
    estimate.status === EstimateStatus.APPROVED || estimate.status === EstimateStatus.REJECTED

  if (alreadyProcessed) {
    return (
      <Box textAlign="center" py={8}>
        <EstimateStatusBadge status={estimate.status} />
        <Text mt={2} color="fg.muted">This estimate has already been processed.</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={4}>Review Estimate</Text>

      <LineItemEditor items={estimate.lineItems} readOnly onChange={() => {}} />

      <Box mt={3} borderTopWidth="1px" borderColor="border.subtle" pt={2}>
        <Flex justify="space-between" mb={1}>
          <Text fontSize="sm" color="fg.muted">Subtotal</Text>
          <Text fontSize="sm">{formatCurrency(subtotal)}</Text>
        </Flex>
        <Flex justify="space-between" mb={1}>
          <Text fontSize="sm" color="fg.muted">Tax ({estimate.taxRate}%)</Text>
          <Text fontSize="sm">{formatCurrency(tax)}</Text>
        </Flex>
        <Flex justify="space-between" fontWeight="bold">
          <Text>Total</Text>
          <Text>{formatCurrency(total)}</Text>
        </Flex>
      </Box>

      <Box mt={4}>
        <Text fontSize="sm" mb={1}>Your name (for approval)</Text>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name"
          mb={3}
        />
        <Flex gap={3}>
          <Button
            colorPalette="green"
            flex="1"
            onClick={() => handleDecision(true)}
          >
            Approve
          </Button>
          <Button
            colorPalette="red"
            variant="outline"
            flex="1"
            onClick={() => handleDecision(false)}
          >
            Decline
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}
