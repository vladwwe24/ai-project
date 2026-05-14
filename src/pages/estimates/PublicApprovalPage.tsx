import { Box, Text } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { useAppState } from '@/app/providers/AppProvider'
import { selectEstimateByToken } from '@/entities/estimate/model/slice'
import { ApprovalForm } from '@/features/estimate-approve/ui/ApprovalForm'

export function PublicApprovalPage() {
  const { token } = useParams<{ token: string }>()
  const { estimates } = useAppState()
  const estimate = token ? selectEstimateByToken(estimates, token) : undefined

  return (
    <Box maxW="480px" mx="auto" p={4}>
      <Text fontSize="xl" fontWeight="bold" mb={4}>Estimate Approval</Text>
      {!estimate ? (
        <Text color="fg.muted">Estimate not found or link has expired.</Text>
      ) : (
        <ApprovalForm estimate={estimate} />
      )}
    </Box>
  )
}
