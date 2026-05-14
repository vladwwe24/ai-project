import {
  Box,
  Button,
  Flex,
  Input,
  FieldRoot,
  FieldLabel,
  FieldErrorText,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import { PageHeader } from '@/shared/ui/PageHeader'
import { nanoid } from '@/shared/lib/index'

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>()
  const { customers } = useAppState()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const existing = id ? customers.find(c => c.id === id) : undefined
  const isEdit = Boolean(existing)

  const [name, setName] = useState(existing?.name ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [address, setAddress] = useState(existing?.address ?? '')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  function validate(): boolean {
    const errs: { name?: string; phone?: string } = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!phone.trim()) errs.phone = 'Phone is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    const trimmed = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    }

    if (existing) {
      dispatch({ type: 'customer/UPDATE', payload: { ...existing, ...trimmed } })
      navigate(`/customers/${existing.id}`)
    } else {
      const newId = nanoid()
      dispatch({
        type: 'customer/ADD',
        payload: { id: newId, createdAt: new Date().toISOString(), ...trimmed },
      })
      navigate(`/customers/${newId}`)
    }
  }

  return (
    <Box>
      <PageHeader title={isEdit ? 'Edit Customer' : 'New Customer'} />
      <Box px={4} pb={4} maxW="480px">
        <Flex direction="column" gap={4}>
          <FieldRoot invalid={!!errors.name} required>
            <FieldLabel>Name</FieldLabel>
            <Input
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <FieldErrorText>{errors.name}</FieldErrorText>
          </FieldRoot>

          <FieldRoot invalid={!!errors.phone} required>
            <FieldLabel>Phone</FieldLabel>
            <Input
              placeholder="555-1234"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <FieldErrorText>{errors.phone}</FieldErrorText>
          </FieldRoot>

          <FieldRoot>
            <FieldLabel>Email</FieldLabel>
            <Input
              placeholder="email@example.com"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </FieldRoot>

          <FieldRoot>
            <FieldLabel>Address</FieldLabel>
            <Input
              placeholder="123 Main St"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </FieldRoot>

          <Flex gap={3} pt={2}>
            <Button colorPalette="blue" onClick={handleSubmit}>
              {isEdit ? 'Save Changes' : 'Create Customer'}
            </Button>
            <Button variant="ghost" onClick={() => navigate(existing ? `/customers/${existing.id}` : '/customers')}>
              Cancel
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}
