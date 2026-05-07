import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Ban } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { INVITE_CODE_STATUS } from '../constants'
import { isInviteCodeExpired } from '../lib'
import { inviteCodeSchema } from '../types'
import { useInviteCodes } from './invite-codes-provider'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const { t } = useTranslation()
  const inviteCode = inviteCodeSchema.parse(row.original)
  const { setOpen, setCurrentRow } = useInviteCodes()
  const canRevoke =
    inviteCode.status === INVITE_CODE_STATUS.ACTIVE &&
    !isInviteCodeExpired(inviteCode.expired_time, inviteCode.status)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>{t('Open menu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(inviteCode)
            setOpen('delete')
          }}
          disabled={!canRevoke}
          className='text-destructive focus:text-destructive'
        >
          {t('Revoke')}
          <DropdownMenuShortcut>
            <Ban size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
