import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { getSelf } from '@/lib/api'
import {
  isAuthSessionVerified,
  markAuthSessionVerified,
  resetAuthSessionVerified,
} from '@/lib/auth-session'
import { AuthenticatedLayout } from '@/components/layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { auth } = useAuthStore.getState()

    // 如果本地没有用户信息，直接跳转登录页
    if (!auth.user) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    // 本地有用户信息，但需要验证 session 是否有效（每个会话只验证一次）
    if (!isAuthSessionVerified()) {
      const res = await getSelf().catch(() => null)
      if (res?.success && res.data) {
        // 验证成功，更新用户信息（可能有变化）
        auth.setUser(res.data)
        markAuthSessionVerified()
      } else {
        // 验证失败或 API 调用失败，清除本地缓存并跳转登录页
        resetAuthSessionVerified()
        auth.reset()
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.href },
        })
      }
    }
  },
  component: AuthenticatedLayout,
})
