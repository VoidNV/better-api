import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog'
import { type InviteCode, type InviteCodesDialogType } from '../types'

type InviteCodesContextType = {
  open: InviteCodesDialogType | null
  setOpen: (str: InviteCodesDialogType | null) => void
  currentRow: InviteCode | null
  setCurrentRow: React.Dispatch<React.SetStateAction<InviteCode | null>>
  refreshTrigger: number
  triggerRefresh: () => void
}

const InviteCodesContext = React.createContext<InviteCodesContextType | null>(
  null
)

export function InviteCodesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<InviteCodesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<InviteCode | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1)

  return (
    <InviteCodesContext
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </InviteCodesContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useInviteCodes = () => {
  const context = React.useContext(InviteCodesContext)

  if (!context) {
    throw new Error(
      'useInviteCodes has to be used within <InviteCodesProvider>'
    )
  }

  return context
}
