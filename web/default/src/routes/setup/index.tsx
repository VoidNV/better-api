import { createFileRoute, redirect } from '@tanstack/react-router'
import { SetupWizard } from '@/features/setup'
import { getSetupStatus } from '@/features/setup/api'
import { Seo } from '@/lib/seo'

function SetupRoute() {
  return (
    <>
      <Seo title='Setup' path='/setup' robots='noindex,nofollow' />
      <SetupWizard />
    </>
  )
}

export const Route = createFileRoute('/setup/')({
  beforeLoad: async () => {
    const status = await getSetupStatus().catch((error) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[setup.beforeLoad] failed to fetch setup status', error)
      }
      return null
    })

    if (status?.success && status.data?.status) {
      throw redirect({ to: '/' })
    }
  },
  component: SetupRoute,
})
