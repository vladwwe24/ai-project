import { Button } from '@chakra-ui/react'
import { useAppDispatch } from '@/app/providers/AppProvider'
import type { Estimate } from '@/entities/estimate/model/types'
import { EstimateStatus } from '@/entities/estimate/model/types'
import type { LineItem } from '@/entities/line-item/model/types'
import { nanoid } from '@/shared/lib/index'

interface Props {
  estimate: Estimate
  lineItems: LineItem[]
  taxRate: number
}

export function SendEstimateButton({ estimate, lineItems, taxRate }: Props) {
  const dispatch = useAppDispatch()

  function handleSend() {
    const token = nanoid()
    const now = new Date().toISOString()
    dispatch({
      type: 'estimate/UPDATE',
      payload: {
        ...estimate,
        lineItems,
        taxRate,
        status: EstimateStatus.SENT,
        approvalToken: token,
        sentAt: now,
        updatedAt: now,
      },
    })
    navigator.clipboard.writeText(`${window.location.origin}/approve/${token}`).catch(() => {})
  }

  return (
    <Button size="sm" colorPalette="blue" onClick={handleSend}>
      Send to Customer
    </Button>
  )
}
