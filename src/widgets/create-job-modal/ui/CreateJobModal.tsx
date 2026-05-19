import {
  Box,
  Button,
  FieldErrorText,
  FieldLabel,
  FieldRoot,
  Flex,
  Input,
  Text,
} from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import { JobStatus } from '@/entities/job/model/types'
import { InvoiceStatus } from '@/entities/invoice/model/types'
import { CreateCustomerModal } from '@/features/create-customer/ui/CreateCustomerModal'
import { AppModal } from '@/shared/ui/AppModal'
import { getSettings } from '@/shared/config/settings'
import { nanoid, generateInvoiceNumber, generateJobNumber } from '@/shared/lib/index'

interface Props {
  open: boolean
  initialIso: string
  onClose: () => void
}

function isoToTimeValue(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isoToDateValue(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addHours(timeStr: string, hours: number): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const total = h + hours
  if (total >= 24) return '23:59'
  return `${String(total).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function CreateJobModal({ open, initialIso, onClose }: Props) {
  const { customers, invoices, jobs } = useAppState()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [customerId, setCustomerId] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [applianceType, setApplianceType] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false)
  const [errors, setErrors] = useState<{ customerId?: string; applianceType?: string }>({})
  const customerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && initialIso) {
      setScheduledDate(isoToDateValue(initialIso))
      const start = isoToTimeValue(initialIso)
      setStartTime(start)
      setEndTime(addHours(start, 2))
    }
  }, [open, initialIso])

  const filteredCustomers = customerQuery.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(customerQuery.toLowerCase().trim()))
    : customers

  function selectCustomer(id: string, name: string) {
    setCustomerId(id)
    setCustomerQuery(name)
    setShowCustomerList(false)
  }

  function handleCustomerCreated(id: string) {
    const created = customers.find(c => c.id === id)
    if (created) {
      selectCustomer(id, created.name)
    } else {
      setCustomerId(id)
    }
    setCreateCustomerOpen(false)
  }

  function reset() {
    setCustomerId('')
    setCustomerQuery('')
    setShowCustomerList(false)
    setApplianceType('')
    setBrand('')
    setModel('')
    setScheduledDate('')
    setStartTime('')
    setEndTime('')
    setErrors({})
  }

  function handleClose() {
    reset()
    onClose()
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!customerId) errs.customerId = 'Customer is required'
    if (!applianceType.trim()) errs.applianceType = 'Appliance type is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function buildScheduledAt(): string {
    if (scheduledDate && startTime) {
      return new Date(`${scheduledDate}T${startTime}`).toISOString()
    }
    return new Date().toISOString()
  }

  function buildScheduledEndAt(): string | undefined {
    if (scheduledDate && endTime) {
      return new Date(`${scheduledDate}T${endTime}`).toISOString()
    }
    return undefined
  }

  function handleCreate() {
    if (!validate()) return
    const jobId = nanoid()
    const now = new Date().toISOString()
    const customerName = customers.find(c => c.id === customerId)?.name ?? ''
    dispatch({
      type: 'job/ADD',
      payload: {
        id: jobId,
        customerId,
        applianceType: applianceType.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        status: JobStatus.SCHEDULED,
        scheduledAt: buildScheduledAt(),
        scheduledEndAt: buildScheduledEndAt(),
        name: `Job for ${customerName}`,
        jobNumber: generateJobNumber(jobs.length),
        createdAt: now,
        updatedAt: now,
      },
    })
    dispatch({
      type: 'invoice/ADD',
      payload: {
        id: nanoid(),
        jobId,
        invoiceNumber: generateInvoiceNumber(invoices.length),
        lineItems: [{ id: nanoid(), description: 'Inspection', quantity: 1, unitPrice: 75 }],
        taxRate: getSettings().defaultTaxRate,
        status: InvoiceStatus.UNPAID,
        createdAt: now,
        updatedAt: now,
      },
    })
    handleClose()
    navigate(`/jobs/${jobId}`)
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={handleClose}>Cancel</Button>
      <Button colorPalette="blue" onClick={handleCreate}>Create Job</Button>
    </>
  )

  return (
    <>
      <AppModal open={open} onClose={handleClose} title="New Job" size="md" footer={footer}>
        <Flex direction="column" gap={3}>

          {/* Customer — searchable */}
          <FieldRoot invalid={!!errors.customerId} required>
            <FieldLabel>Customer</FieldLabel>
            <Flex gap={2}>
              <Box flex={1} position="relative">
                <Input
                  ref={customerInputRef}
                  placeholder="Search customer…"
                  value={customerQuery}
                  onChange={e => {
                    setCustomerQuery(e.target.value)
                    setCustomerId('')
                    setShowCustomerList(true)
                  }}
                  onFocus={() => setShowCustomerList(true)}
                  onBlur={() => setTimeout(() => setShowCustomerList(false), 150)}
                  style={errors.customerId ? { borderColor: '#E53E3E' } : undefined}
                  autoComplete="off"
                />
                {showCustomerList && filteredCustomers.length > 0 && (
                  <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    zIndex={20}
                    bg="white"
                    borderWidth="1px"
                    borderColor="border.subtle"
                    borderRadius="md"
                    boxShadow="md"
                    mt={1}
                    maxH="160px"
                    overflowY="auto"
                  >
                    {filteredCustomers.map(c => (
                      <Box
                        key={c.id}
                        px={3}
                        py={2}
                        cursor="pointer"
                        _hover={{ bg: 'bg.subtle' }}
                        onMouseDown={() => selectCustomer(c.id, c.name)}
                      >
                        <Text fontSize="sm">{c.name}</Text>
                        <Text fontSize="xs" color="fg.muted">{c.phone}</Text>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
              <Button
                size="sm"
                variant="outline"
                flexShrink={0}
                onClick={() => setCreateCustomerOpen(true)}
              >
                + Customer
              </Button>
            </Flex>
            <FieldErrorText>{errors.customerId}</FieldErrorText>
          </FieldRoot>

          <FieldRoot invalid={!!errors.applianceType} required>
            <FieldLabel>Appliance Type</FieldLabel>
            <Input
              placeholder="e.g. Refrigerator"
              value={applianceType}
              onChange={e => setApplianceType(e.target.value)}
            />
            <FieldErrorText>{errors.applianceType}</FieldErrorText>
          </FieldRoot>

          <FieldRoot>
            <FieldLabel>Brand</FieldLabel>
            <Input
              placeholder="e.g. Samsung"
              value={brand}
              onChange={e => setBrand(e.target.value)}
            />
          </FieldRoot>

          <FieldRoot>
            <FieldLabel>Model</FieldLabel>
            <Input
              placeholder="e.g. RS28A500ASR"
              value={model}
              onChange={e => setModel(e.target.value)}
            />
          </FieldRoot>

          <FieldRoot>
            <FieldLabel>Date</FieldLabel>
            <Input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
            />
          </FieldRoot>

          <Flex gap={3}>
            <FieldRoot flex={1}>
              <FieldLabel>Start Time</FieldLabel>
              <Input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </FieldRoot>
            <FieldRoot flex={1}>
              <FieldLabel>End Time</FieldLabel>
              <Input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </FieldRoot>
          </Flex>

        </Flex>
      </AppModal>

      <CreateCustomerModal
        open={createCustomerOpen}
        onClose={() => setCreateCustomerOpen(false)}
        onCreated={handleCustomerCreated}
      />
    </>
  )
}
