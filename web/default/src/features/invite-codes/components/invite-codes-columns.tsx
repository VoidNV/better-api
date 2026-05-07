import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { formatTimestampToDate } from '@/lib/format'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableColumnHeader } from '@/components/data-table'
import { MaskedValueDisplay } from '@/components/masked-value-display'
import { StatusBadge } from '@/components/status-badge'
import { INVITE_CODE_FILTER_EXPIRED, INVITE_CODE_STATUSES } from '../constants'
import { isInviteCodeExpired, isTimestampExpired } from '../lib'
import { type InviteCode } from '../types'
import { DataTableRowActions } from './data-table-row-actions'

export function useInviteCodesColumns(): ColumnDef<InviteCode>[] {
  const { t } = useTranslation()
  return [
    {
      id: 'select',
      meta: { label: t('Select') },
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('Select all')}
          className='translate-y-[2px]'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t('Select row')}
          className='translate-y-[2px]'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      meta: { label: t('ID'), mobileHidden: true },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('ID')} />
      ),
      cell: ({ row }) => <div className='w-[60px]'>{row.getValue('id')}</div>,
    },
    {
      id: 'code',
      accessorKey: 'code',
      meta: { label: t('Invite code'), mobileTitle: true },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Invite code')} />
      ),
      cell: function CodeCell({ row }) {
        const code = row.original.code
        const maskedCode = `${code.slice(0, 8)}${'*'.repeat(16)}${code.slice(-8)}`

        return (
          <MaskedValueDisplay
            label={t('Full Code')}
            fullValue={code}
            maskedValue={maskedCode}
            copyTooltip={t('Copy code')}
            copyAriaLabel={t('Copy invite code')}
          />
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'note',
      meta: { label: t('Note') },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Note')} />
      ),
      cell: ({ row }) => {
        const note = row.getValue('note') as string
        return note ? (
          <div className='max-w-[220px] truncate'>{note}</div>
        ) : (
          <span className='text-muted-foreground text-sm'>-</span>
        )
      },
    },
    {
      accessorKey: 'status',
      meta: { label: t('Status'), mobileBadge: true },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
      ),
      cell: ({ row }) => {
        const inviteCode = row.original
        const statusValue = row.getValue('status') as number

        if (isInviteCodeExpired(inviteCode.expired_time, statusValue)) {
          return (
            <StatusBadge
              label={t('Expired')}
              variant='warning'
              showDot={true}
              copyable={false}
            />
          )
        }

        const statusConfig = INVITE_CODE_STATUSES[statusValue]
        if (!statusConfig) return null

        return (
          <StatusBadge
            label={t(statusConfig.labelKey)}
            variant={statusConfig.variant}
            showDot={statusConfig.showDot}
            copyable={false}
          />
        )
      },
      filterFn: (row, id, value) => {
        const inviteCode = row.original
        const statusValue = row.getValue(id) as number

        if (value.includes(INVITE_CODE_FILTER_EXPIRED)) {
          if (isInviteCodeExpired(inviteCode.expired_time, statusValue)) {
            return true
          }
        }

        return value.includes(String(statusValue))
      },
    },
    {
      accessorKey: 'created_time',
      meta: { label: t('Created'), mobileHidden: true },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created')} />
      ),
      cell: ({ row }) => (
        <div className='min-w-[140px] font-mono text-sm'>
          {formatTimestampToDate(row.getValue('created_time'))}
        </div>
      ),
    },
    {
      accessorKey: 'expired_time',
      meta: { label: t('Expires'), mobileHidden: true },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Expires')} />
      ),
      cell: ({ row }) => {
        const expiredTime = row.getValue('expired_time') as number
        if (expiredTime === 0) {
          return (
            <StatusBadge
              label={t('Never')}
              variant='neutral'
              copyable={false}
            />
          )
        }
        const isExpired = isTimestampExpired(expiredTime)
        return (
          <div
            className={`min-w-[140px] font-mono text-sm ${isExpired ? 'text-destructive' : ''}`}
          >
            {formatTimestampToDate(expiredTime)}
          </div>
        )
      },
    },
    {
      accessorKey: 'used_by_user_id',
      meta: { label: t('Used by user'), mobileHidden: true },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Used by user')} />
      ),
      cell: ({ row }) => {
        const userId = row.getValue('used_by_user_id') as number
        const inviteCode = row.original

        if (userId === 0) {
          return <span className='text-muted-foreground text-sm'>-</span>
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <StatusBadge
                label={t('User {{id}}', { id: userId })}
                variant='neutral'
                copyable={false}
                className='cursor-help'
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className='space-y-1 text-xs'>
                <div>
                  {t('User ID:')} {userId}
                </div>
                {inviteCode.used_time > 0 && (
                  <div>
                    {t('Used:')} {formatTimestampToDate(inviteCode.used_time)}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ]
}
