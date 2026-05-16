import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function ModalPortal({ children }: Props) {
  return createPortal(children, document.getElementById('modal-root')!)
}
