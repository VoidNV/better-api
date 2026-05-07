import { useEffect } from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import i18next from 'i18next'
import { toast } from 'sonner'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { getSelf } from '@/lib/api'
import { markAuthSessionVerified } from '@/lib/auth-session'
import { wechatLoginByCode } from '@/features/auth/api'

function isAuthUserData(data: unknown): data is AuthUser {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as { id?: unknown }).id === 'number'
  )
}

function OAuthComponent() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/oauth' }) as {
    redirect?: string
    provider?: 'github' | 'discord' | 'oidc' | 'linuxdo' | 'telegram' | 'wechat'
    code?: string
    state?: string
  }

  useEffect(() => {
    ;(async () => {
      try {
        if (search?.provider === 'wechat' && search.code) {
          const loginRes = await wechatLoginByCode(search.code)
          if (loginRes?.success && isAuthUserData(loginRes.data)) {
            useAuthStore.getState().auth.setUser(loginRes.data)
            markAuthSessionVerified()
            const target = search?.redirect || '/dashboard'
            navigate({ to: target, replace: true })
            return
          }
          if (!loginRes?.success) {
            throw new Error(loginRes?.message || 'OAuth failed')
          }
        }
        const res = await getSelf()
        if (res?.success) {
          useAuthStore.getState().auth.setUser(res.data as AuthUser)
          markAuthSessionVerified()
          const target = search?.redirect || '/dashboard'
          navigate({ to: target, replace: true })
          return
        }
      } catch {
        /* empty */
      }
      toast.error(i18next.t('OAuth failed'))
      navigate({ to: '/sign-in', replace: true })
    })()
  }, [navigate, search])

  return null
}

export const Route = createFileRoute('/(auth)/oauth')({
  component: OAuthComponent,
})
