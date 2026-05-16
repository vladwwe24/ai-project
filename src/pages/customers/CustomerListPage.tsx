import { Box, Button, Input } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '@/app/providers/AppProvider'
import { CustomerCard } from '@/entities/customer/ui/CustomerCard'
import { CreateCustomerModal } from '@/features/create-customer/ui/CreateCustomerModal'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export function CustomerListPage() {
  const { customers } = useAppState()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return customers
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q),
    )
  }, [customers, query])

  return (
    <Box>
      <PageHeader
        title="Customers"
        action={
          <Button size="sm" colorPalette="blue" onClick={() => setModalOpen(true)}>
            + New
          </Button>
        }
      />
      <Box px={4} pb={4}>
        <Input
          placeholder="Search by name or phone…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          mb={3}
        />
        {filtered.length === 0 ? (
          <EmptyState
            title={query ? 'No customers found' : 'No customers yet'}
            description={query ? 'Try a different search.' : 'Tap + New to add your first customer.'}
          />
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {filtered.map(c => (
              <CustomerCard
                key={c.id}
                customer={c}
                onClick={() => navigate(`/customers/${c.id}`)}
              />
            ))}
          </Box>
        )}
      </Box>

      <CreateCustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </Box>
  )
}
