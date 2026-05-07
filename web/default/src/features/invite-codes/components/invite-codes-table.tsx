import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DISABLED_ROW_DESKTOP,
  DISABLED_ROW_MOBILE,
  DataTablePagination,
  DataTableToolbar,
  MobileCardList,
  TableEmpty,
  TableSkeleton,
} from '@/components/data-table'
import { PageFooterPortal } from '@/components/layout'
import { getInviteCodes, searchInviteCodes } from '../api'
import { INVITE_CODE_STATUS, getInviteCodeStatusOptions } from '../constants'
import { isInviteCodeExpired } from '../lib'
import type { InviteCode } from '../types'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { useInviteCodesColumns } from './invite-codes-columns'
import { useInviteCodes } from './invite-codes-provider'

const route = getRouteApi('/_authenticated/invite-codes/')

function isDisabledInviteCodeRow(inviteCode: InviteCode) {
  return (
    inviteCode.status !== INVITE_CODE_STATUS.ACTIVE ||
    isInviteCodeExpired(inviteCode.expired_time, inviteCode.status)
  )
}

export function InviteCodesTable() {
  const { t } = useTranslation()
  const columns = useInviteCodesColumns()
  const { refreshTrigger } = useInviteCodes()
  const isMobile = useMediaQuery('(max-width: 640px)')
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: isMobile ? 10 : 20 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [{ columnId: 'status', searchKey: 'status', type: 'array' }],
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'invite-codes',
      pagination.pageIndex + 1,
      pagination.pageSize,
      globalFilter,
      refreshTrigger,
    ],
    queryFn: async () => {
      const hasFilter = globalFilter?.trim()
      const params = {
        p: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
      }

      const result = hasFilter
        ? await searchInviteCodes({ ...params, keyword: globalFilter })
        : await getInviteCodes(params)

      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const inviteCodes = data?.items || []

  const table = useReactTable({
    data: inviteCodes,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const code = String(row.getValue('code')).toLowerCase()
      const note = String(row.getValue('note')).toLowerCase()
      const id = String(row.getValue('id'))
      const searchValue = String(filterValue).toLowerCase()

      return (
        code.includes(searchValue) ||
        note.includes(searchValue) ||
        id.includes(searchValue)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    manualPagination: !globalFilter,
    pageCount: Math.ceil((data?.total || 0) / pagination.pageSize),
  })

  const pageCount = table.getPageCount()
  useEffect(() => {
    ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange])

  const inviteCodeStatusOptions = useMemo(
    () => getInviteCodeStatusOptions(t),
    [t]
  )

  return (
    <>
      <div className='space-y-3 sm:space-y-4'>
        <DataTableToolbar
          table={table}
          searchPlaceholder={t('Filter by code, note, or ID...')}
          filters={[
            {
              columnId: 'status',
              title: t('Status'),
              options: inviteCodeStatusOptions,
            },
          ]}
        />
        {isMobile ? (
          <MobileCardList
            table={table}
            isLoading={isLoading}
            emptyTitle={t('No Invite Codes Found')}
            emptyDescription={t(
              'No invite codes available. Generate your first invite code to get started.'
            )}
            getRowClassName={(row) =>
              isDisabledInviteCodeRow(row.original)
                ? DISABLED_ROW_MOBILE
                : undefined
            }
          />
        ) : (
          <>
            <div
              className={cn(
                'overflow-hidden rounded-md border transition-opacity duration-150',
                isFetching && !isLoading && 'pointer-events-none opacity-50'
              )}
            >
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton
                      table={table}
                      keyPrefix='invite-codes-skeleton'
                    />
                  ) : table.getRowModel().rows.length === 0 ? (
                    <TableEmpty
                      colSpan={columns.length}
                      title={t('No Invite Codes Found')}
                      description={t(
                        'No invite codes available. Generate your first invite code to get started.'
                      )}
                    />
                  ) : (
                    table.getRowModel().rows.map((row) => {
                      const inviteCode = row.original

                      return (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
                          className={cn(
                            isDisabledInviteCodeRow(inviteCode) &&
                              DISABLED_ROW_DESKTOP
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <DataTableBulkActions table={table} />
          </>
        )}
      </div>
      <PageFooterPortal>
        <DataTablePagination table={table} />
      </PageFooterPortal>
    </>
  )
}
