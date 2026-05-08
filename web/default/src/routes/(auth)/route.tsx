import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Seo } from '@/lib/seo'

function AuthLayout() {
  return (
    <>
      <Seo robots='noindex,follow,max-image-preview:large' />
      <Outlet />
    </>
  )
}

export const Route = createFileRoute('/(auth)')({
  component: AuthLayout,
})
