import { useMemo } from 'react'
import { type Table } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { CopyButton } from '@/components/copy-button'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type InviteCode } from '../types'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const { t } = useTranslation()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const contentToCopy = useMemo(() => {
    const selectedCodes = selectedRows.map((row) => {
      const inviteCode = row.original as InviteCode
      return inviteCode.note
        ? `${inviteCode.note}\t${inviteCode.code}`
        : inviteCode.code
    })
    return selectedCodes.join('\n')
  }, [selectedRows])

  return (
    <BulkActionsToolbar table={table} entityName={t('invite code')}>
      <CopyButton
        value={contentToCopy}
        variant='outline'
        size='icon'
        className='size-8'
        tooltip={t('Copy selected codes')}
        successTooltip={t('Codes copied!')}
        aria-label={t('Copy selected codes')}
      />
    </BulkActionsToolbar>
  )
}
