import {
  Button,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  FieldErrorText,
  FieldLabel,
  FieldRoot,
  Flex,
  Input,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import { JobStatus } from '@/entities/job/model/types'
import { InvoiceStatus } from '@/entities/invoice/model/types'
import { getSettings } from '@/shared/config/settings'
import { nanoid, generateInvoiceNumber } from '@/shared/lib/index'
import { toDatetimeLocalValue } from '@/widgets/timeline-grid/lib/timeUtils'

interface Props {
  open: boolean
  initialIso: string
  onClose: () => void
}

export function CreateJobModal({ open, initialIso, onClose }: Props) {
  const { customers, invoices } = useAppState()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [customerId, setCustomerId] = useState('')
  const [applianceType, setApplianceType] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [issue, setIssue] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [errors, setErrors] = useState<{
    customerId?: string
    applianceType?: string
    issue?: string
  }>({})

  useEffect(() => {
    if (open && initialIso) {
      setScheduledAt(toDatetimeLocalValue(initialIso))
    }
  }, [open, initialIso])

  function reset() {
    setCustomerId('')
    setApplianceType('')
    setBrand('')
    setModel('')
    setIssue('')
    setScheduledAt('')
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
    if (!issue.trim()) errs.issue = 'Issue description is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleCreate() {
    if (!validate()) return
    const jobId = nanoid()
    const now = new Date().toISOString()
    const iso = scheduledAt ? new Date(scheduledAt).toISOString() : now
    dispatch({
      type: 'job/ADD',
      payload: {
        id: jobId,
        customerId,
        applianceType: applianceType.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        issue: issue.trim(),
        status: JobStatus.SCHEDULED,
        scheduledAt: iso,
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

  return (
    <DialogRoot open={open} onOpenChange={e => { if (!e.open) handleClose() }}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Job</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Flex direction="column" gap={3}>
              <FieldRoot invalid={!!errors.customerId} required>
                <FieldLabel>Customer</FieldLabel>
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${errors.customerId ? '#E53E3E' : 'var(--chakra-colors-border)'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  <option value="">Select customer…</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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

              <FieldRoot invalid={!!errors.issue} required>
                <FieldLabel>Issue</FieldLabel>
                <Input
                  placeholder="Describe the problem…"
                  value={issue}
                  onChange={e => setIssue(e.target.value)}
                />
                <FieldErrorText>{errors.issue}</FieldErrorText>
              </FieldRoot>

              <FieldRoot>
                <FieldLabel>Scheduled Time</FieldLabel>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                />
              </FieldRoot>
            </Flex>
          </DialogBody>
          <DialogFooter gap={2}>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button colorPalette="blue" onClick={handleCreate}>Create Job</Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
