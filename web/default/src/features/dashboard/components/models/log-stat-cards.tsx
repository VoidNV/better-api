import { useEffect, useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { formatNumber, formatQuota } from '@/lib/format'
import { computeTimeRange } from '@/lib/time'
import { useAuthStore } from '@/stores/auth-store'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { useModelStatCardsConfig } from '@/features/dashboard/hooks/use-dashboard-config'
import {
  buildQueryParams,
  calculateDashboardStats,
  getDefaultDays,
} from '@/features/dashboard/lib'
import type {
  QuotaDataItem,
  DashboardFilters,
} from '@/features/dashboard/types'

interface LogStatCardsProps {
  filters?: DashboardFilters
  onDataUpdate?: (data: QuotaDataItem[], loading: boolean) => void
}

export function LogStatCards(props: LogStatCardsProps) {
  const statCardsConfig = useModelStatCardsConfig()
  const user = useAuthStore((state) => state.auth.user)
  const isAdmin = !!(user?.role && user.role >= 10)
  const timeRange = useMemo(
    () =>
      computeTimeRange(
        getDefaultDays(props.filters?.time_granularity),
        props.filters?.start_timestamp,
        props.filters?.end_timestamp
      ),
    [
      props.filters?.end_timestamp,
      props.filters?.start_timestamp,
      props.filters?.time_granularity,
    ]
  )
  const queryParams = useMemo(
    () => buildQueryParams(timeRange, props.filters),
    [props.filters, timeRange]
  )
  const quotaQuery = useQuery({
    queryKey: ['dashboard', 'quota-dates', isAdmin, queryParams],
    queryFn: () => getUserQuotaDates(queryParams, isAdmin),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  })
  const data = useMemo(() => quotaQuery.data?.data || [], [quotaQuery.data])
  const stats = useMemo(() => calculateDashboardStats(data), [data])
  const loading = !quotaQuery.data && quotaQuery.isLoading
  const error = quotaQuery.isError && data.length === 0
  const timeRangeMinutes =
    (timeRange.end_timestamp - timeRange.start_timestamp) / 60

  useEffect(() => {
    props.onDataUpdate?.(data, loading)
  }, [data, loading, props.onDataUpdate])

  const adaptedStats = {
    rpm: stats?.totalCount ?? 0,
    quota: stats?.totalQuota ?? 0,
    tpm: stats?.totalTokens ?? 0,
  }

  const items = statCardsConfig.map((config) => ({
    title: config.title,
    value:
      config.key === 'quota'
        ? formatQuota(config.getValue(adaptedStats, timeRangeMinutes))
        : formatNumber(config.getValue(adaptedStats, timeRangeMinutes)),
    desc: config.description,
    icon: config.icon,
  }))

  return (
    <div className='overflow-hidden rounded-lg border'>
      <div className='divide-border/60 grid grid-cols-2 divide-x sm:grid-cols-3 lg:grid-cols-5'>
        {items.map((it, idx) => {
          const Icon = it.icon
          return (
            <div
              key={it.title}
              className={`px-3 py-2.5 sm:px-5 sm:py-4 ${idx === items.length - 1 && items.length % 2 !== 0 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className='flex items-center gap-2'>
                <Icon className='text-muted-foreground/60 size-3.5 shrink-0' />
                <div className='text-muted-foreground truncate text-xs font-medium tracking-wider uppercase'>
                  {it.title}
                </div>
              </div>

              {loading ? (
                <div className='mt-2 space-y-1.5'>
                  <Skeleton className='h-7 w-20' />
                  <Skeleton className='h-3.5 w-28' />
                </div>
              ) : error ? (
                <>
                  <div className='text-muted-foreground mt-1.5 font-mono text-lg font-bold tracking-tight tabular-nums sm:mt-2 sm:text-2xl'>
                    --
                  </div>
                  <div className='text-muted-foreground/40 mt-1 hidden text-xs md:block'>
                    {it.desc}
                  </div>
                </>
              ) : (
                <>
                  <div className='text-foreground mt-1.5 font-mono text-lg font-bold tracking-tight tabular-nums sm:mt-2 sm:text-2xl'>
                    {it.value}
                  </div>
                  <div className='text-muted-foreground/60 mt-1 hidden text-xs md:block'>
                    {it.desc}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
