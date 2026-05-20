import {
  Box,
  Button,
  Flex,
  FieldErrorText,
  FieldLabel,
  FieldRoot,
  Input,
  Text,
} from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { useAppDispatch } from '@/app/providers/AppProvider'
import { nanoid } from '@/shared/lib/index'
import { AppModal } from '@/shared/ui/AppModal'

interface NominatimResult {
  display_name: string
  address: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    state?: string
    postcode?: string
    county?: string
  }
}

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (customerId: string) => void
}

const NAME_RE = /^[A-Za-z\s'-]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_DIGITS_RE = /^\d{10}$/

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function CreateCustomerModal({ open, onClose, onCreated }: Props) {
  const dispatch = useAppDispatch()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [zip, setZip] = useState('')
  const [state, setState] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [addressSelectedFromApi, setAddressSelectedFromApi] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      setName('')
      setPhone('')
      setEmail('')
      setAddress('')
      setZip('')
      setState('')
      setErrors({})
      setSuggestions([])
      setShowSuggestions(false)
      setAddressSelectedFromApi(false)
    }
  }, [open])

  function handlePhoneChange(val: string) {
    setPhone(formatPhone(val))
  }

  function handleAddressChange(val: string) {
    setAddress(val)
    setAddressSelectedFromApi(false)
    setZip('')
    setState('')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&countrycodes=us&limit=5`
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
        const data: NominatimResult[] = await res.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      } catch {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 400)
  }

  function handleSelectSuggestion(result: NominatimResult) {
    const addr = result.address
    const parts = [
      addr.house_number,
      addr.road,
      addr.city ?? addr.town ?? addr.village ?? addr.county,
    ].filter(Boolean)
    setAddress(parts.join(', '))
    setZip(addr.postcode ?? '')
    setState(addr.state ?? '')
    setAddressSelectedFromApi(true)
    setSuggestions([])
    setShowSuggestions(false)
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!name.trim()) {
      errs.name = 'Name is required'
    } else if (!NAME_RE.test(name.trim())) {
      errs.name = 'Letters only (spaces, hyphens, apostrophes allowed)'
    }
    const digits = phone.replace(/\D/g, '')
    if (!phone.trim()) {
      errs.phone = 'Phone is required'
    } else if (!PHONE_DIGITS_RE.test(digits)) {
      errs.phone = 'Enter a 10-digit US phone number'
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      errs.email = 'Enter a valid email address'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const id = nanoid()
    const now = new Date().toISOString()
    const fullAddress = addressSelectedFromApi && zip && state
      ? `${address}, ${zip} ${state}`
      : address.trim() || undefined
    dispatch({
      type: 'customer/ADD',
      payload: {
        id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: fullAddress,
        createdAt: now,
      },
    })
    onCreated?.(id)
    onClose()
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button colorPalette="blue" onClick={handleSave}>Save Customer</Button>
    </>
  )

  return (
    <AppModal open={open} onClose={onClose} title="New Customer" footer={footer}>
      <Flex direction="column" gap={3}>
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
            placeholder="111-111-1111"
            value={phone}
            onChange={e => handlePhoneChange(e.target.value)}
            inputMode="numeric"
          />
          <FieldErrorText>{errors.phone}</FieldErrorText>
        </FieldRoot>

        <FieldRoot invalid={!!errors.email}>
          <FieldLabel>Email</FieldLabel>
          <Input
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            inputMode="email"
          />
          <FieldErrorText>{errors.email}</FieldErrorText>
        </FieldRoot>

        <FieldRoot>
          <FieldLabel>Address</FieldLabel>
          <Box position="relative">
            <Input
              placeholder="Start typing an address…"
              value={address}
              onChange={e => handleAddressChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              autoComplete="off"
            />
            {showSuggestions && (
              <Box
                position="absolute"
                top="100%"
                left={0}
                right={0}
                zIndex={10}
                style={{ background: 'var(--app-surface)' }}
                borderWidth="1px"
                borderColor="border.subtle"
                borderRadius="md"
                boxShadow="md"
                mt={1}
                maxH="200px"
                overflowY="auto"
              >
                {suggestions.map((s, i) => (
                  <Box
                    key={i}
                    px={3}
                    py={2}
                    cursor="pointer"
                    _hover={{ bg: 'bg.subtle' }}
                    onMouseDown={() => handleSelectSuggestion(s)}
                  >
                    <Text fontSize="sm">{s.display_name}</Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </FieldRoot>

        <Flex gap={3}>
          <FieldRoot flex={1}>
            <FieldLabel>Zip Code</FieldLabel>
            <Input
              placeholder="12345"
              value={zip}
              onChange={e => setZip(e.target.value)}
              inputMode="numeric"
            />
          </FieldRoot>
          <FieldRoot flex={2}>
            <FieldLabel>State</FieldLabel>
            <Input
              placeholder="California"
              value={state}
              onChange={e => setState(e.target.value)}
            />
          </FieldRoot>
        </Flex>
      </Flex>
    </AppModal>
  )
}
