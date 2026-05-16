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
} from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { MdClose } from 'react-icons/md'
import { ModalPortal } from './ModalPortal'

interface AppModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
  children: ReactNode
}

export function AppModal({ open, onClose, title, size = 'md', footer, children }: AppModalProps) {
  const maxW = { sm: 'sm', md: 'lg', lg: '2xl', xl: '3xl' }[size]

  return (
    <ModalPortal>
      <DialogRoot
        open={open}
        onOpenChange={e => { if (!e.open) onClose() }}
        lazyMount
        unmountOnExit
      >
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent maxW={maxW} w="full" mx={4}>
            <DialogHeader display="flex" alignItems="center" justifyContent="space-between" pr={2}>
              <DialogTitle>{title}</DialogTitle>
              <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close">
                <MdClose />
              </Button>
            </DialogHeader>
            <DialogBody>{children}</DialogBody>
            {footer && <DialogFooter gap={2}>{footer}</DialogFooter>}
            <DialogCloseTrigger />
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </ModalPortal>
  )
}
