import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Skeleton } from '@/components/ui/skeleton'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='bg-background text-foreground relative grid min-h-svh max-w-none overflow-hidden'>
      {/* Ambient glow */}
      <div
        aria-hidden
        className='pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 opacity-50'
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        }}
      />
      {/* Dot grid */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-20 opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black_20%,transparent_100%)]'
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <Link
        to='/'
        className='absolute top-5 left-5 z-10 flex items-center gap-2.5 transition-opacity hover:opacity-80 sm:top-8 sm:left-8'
      >
        <div className='relative size-7'>
          {loading ? (
            <Skeleton className='absolute inset-0 rounded-lg' />
          ) : (
            <img
              src={logo}
              alt={t('Logo')}
              className='size-7 rounded-lg object-cover'
            />
          )}
        </div>
        {loading ? (
          <Skeleton className='h-5 w-20' />
        ) : (
          <span className='text-sm font-semibold tracking-tight'>
            {systemName}
          </span>
        )}
      </Link>

      {/* Corner eyebrow */}
      <div className='eyebrow absolute top-6 right-6 z-10 hidden sm:block'>
        {t('Secure access')}
      </div>

      <div className='container flex items-center pt-20 pb-10 sm:pt-0'>
        <div className='mx-auto flex w-full max-w-[440px] flex-col justify-center gap-2 px-4 sm:px-6'>
          <div className='bg-card/60 border-border/60 relative rounded-2xl border p-6 backdrop-blur-xl sm:p-8'>
            {/* Top hairline */}
            <div
              aria-hidden
              className='pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/20'
            />
            {children}
          </div>
          <p className='text-muted-foreground/60 mt-4 text-center text-[11px]'>
            {t('By continuing, you agree to our')}{' '}
            <Link to='/user-agreement' className='hover:text-foreground underline underline-offset-2'>
              {t('Terms')}
            </Link>{' '}
            &amp;{' '}
            <Link to='/privacy-policy' className='hover:text-foreground underline underline-offset-2'>
              {t('Privacy')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
