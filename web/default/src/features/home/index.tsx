import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { Markdown } from '@/components/ui/markdown'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { Hero, HowItWorks, Stats } from './components'
import { useHomePageContent } from './hooks'

export function Home() {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const isAuthenticated = !!auth.user
  const { content, isLoaded, isUrl } = useHomePageContent()

  // Landing-specific polish without overriding the user's selected theme.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('landing-active')
    return () => {
      root.classList.remove('landing-active')
    }
  }, [])

  if (!isLoaded) {
    return (
      <PublicLayout showMainContainer={false}>
        <main className='bg-background flex min-h-screen items-center justify-center'>
          <div className='text-muted-foreground font-mono text-xs tracking-widest uppercase'>
            {t('Loading')}
            <span className='terminal-demo-blink'>_</span>
          </div>
        </main>
      </PublicLayout>
    )
  }

  if (content) {
    return (
      <PublicLayout showMainContainer={false}>
        <main className='overflow-x-hidden'>
          {isUrl ? (
            <iframe
              src={content}
              className='h-screen w-full border-none'
              title={t('Custom Home Page')}
            />
          ) : (
            <div className='container mx-auto py-8'>
              <Markdown className='custom-home-content'>{content}</Markdown>
            </div>
          )}
        </main>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='relative min-h-screen overflow-x-hidden bg-[#f5f5f7] text-[#1d1d1f] dark:bg-[#050506] dark:text-white'>
        {/* Global grain / vignette */}
        <div
          aria-hidden
          className='pointer-events-none fixed inset-0 z-0 opacity-[0.018] dark:opacity-[0.025]'
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <Hero isAuthenticated={isAuthenticated} />
        <Stats />
        <HowItWorks />
        <Footer className='border-black/[0.06] bg-[#f5f5f7] dark:border-white/[0.06] dark:bg-[#050506]' />
      </div>
    </PublicLayout>
  )
}
