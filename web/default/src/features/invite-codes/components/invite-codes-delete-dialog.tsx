import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteInviteCode } from '../api'
import { SUCCESS_MESSAGES } from '../constants'
import { useInviteCodes } from './invite-codes-provider'

export function InviteCodesDeleteDialog() {
  const { t } = useTranslation()
  const { open, setOpen, currentRow, triggerRefresh } = useInviteCodes()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!currentRow) return

    setIsDeleting(true)
    try {
      const result = await deleteInviteCode(currentRow.id)
      if (result.success) {
        toast.success(t(SUCCESS_MESSAGES.INVITE_CODE_REVOKED))
        setOpen(null)
        triggerRefresh()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog
      open={open === 'delete'}
      onOpenChange={(open) => !open && setOpen(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Revoke invite code?')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('This will revoke invite code')}{' '}
            <span className='font-semibold'>{currentRow?.code}</span>
            {t('. This action cannot be undone.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting ? t('Revoking...') : t('Revoke')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
