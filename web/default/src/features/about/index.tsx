import { useQuery } from '@tanstack/react-query'
import { Construction, Link as LinkIcon, Coins, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Markdown } from '@/components/ui/markdown'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout'
import { Seo, buildBreadcrumbJsonLd } from '@/lib/seo'
import { getAboutContent } from './api'

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isLikelyHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function EmptyAboutState() {
  const { t } = useTranslation()

  const pillars = [
    {
      icon: <LinkIcon className='size-4' strokeWidth={1.5} />,
      title: t('One unified API'),
      desc: t(
        'Access leading AI providers through a single endpoint, with one place to manage credentials, usage, and billing.'
      ),
    },
    {
      icon: <Coins className='size-4' strokeWidth={1.5} />,
      title: t('Prepaid platform credit'),
      desc: t(
        'Prepaid account credit lets teams fund usage in advance and monitor spending more predictably.'
      ),
    },
    {
      icon: <Zap className='size-4' strokeWidth={1.5} />,
      title: t('Published pricing'),
      desc: t(
        'Model pricing is published inside the platform so teams can review expected costs before they integrate.'
      ),
    },
  ]

  return (
    <div className='flex min-h-[70vh] items-center justify-center px-6 py-16'>
      <div className='mx-auto w-full max-w-3xl space-y-12'>
        <div className='space-y-4 text-center'>
          <span className='eyebrow'>{t('About')}</span>
          <h1 className='font-display text-4xl leading-[1.05] tracking-tight md:text-5xl'>
            {t('A unified AI gateway')}
            <br />
            <span className='text-muted-foreground italic'>
              {t('for developers and businesses.')}
            </span>
          </h1>
          <p className='text-muted-foreground mx-auto max-w-xl text-sm leading-relaxed md:text-base'>
            {t(
              'This gateway helps teams access supported AI providers through one API, with centralized billing, usage visibility, and a simpler operational workflow.'
            )}
          </p>
        </div>

        <div className='grid gap-3 md:grid-cols-3'>
          {pillars.map((p) => (
            <div
              key={p.title}
              className='border-border/60 bg-card/40 rounded-xl border p-5'
            >
              <div className='bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-md'>
                {p.icon}
              </div>
              <h3 className='mt-4 text-sm font-medium'>{p.title}</h3>
              <p className='text-muted-foreground mt-1.5 text-xs leading-relaxed'>
                {p.desc}
              </p>
            </div>
          ))}
        </div>

        <div className='border-border/40 border-t pt-8 text-center'>
          <Construction className='text-muted-foreground/50 mx-auto size-6' />
          <p className='text-muted-foreground mt-3 text-xs'>
            {t(
              'Additional company, policy, and contact information will be published here by the administrator.'
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export function About() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['about-content'],
    queryFn: getAboutContent,
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isValidUrl(rawContent)
  const isHtml = hasContent && !isUrl && isLikelyHtml(rawContent)

  if (isLoading) {
    return (
      <PublicLayout>
        <Seo
          title='About'
          description='Learn how New API provides unified AI provider access with centralized billing, usage visibility, and model management.'
          path='/about'
          jsonLd={buildBreadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ])}
        />
        <div className='mx-auto flex max-w-4xl flex-col gap-4 py-12'>
          <Skeleton className='h-8 w-[45%]' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[90%]' />
          <Skeleton className='h-4 w-[80%]' />
        </div>
      </PublicLayout>
    )
  }

  if (!hasContent) {
    return (
      <PublicLayout>
        <Seo
          title='About'
          description='Learn how New API provides unified AI provider access with centralized billing, usage visibility, and model management.'
          path='/about'
          jsonLd={buildBreadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ])}
        />
        <EmptyAboutState />
      </PublicLayout>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout showMainContainer={false}>
        <Seo
          title='About'
          description='Learn how New API provides unified AI provider access with centralized billing, usage visibility, and model management.'
          path='/about'
          jsonLd={buildBreadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ])}
        />
        <iframe
          src={rawContent}
          className='h-[calc(100vh-3.5rem)] w-full border-0'
          title={t('About')}
        />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <Seo
        title='About'
        description='Learn how New API provides unified AI provider access with centralized billing, usage visibility, and model management.'
        path='/about'
        jsonLd={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />
      <div className='mx-auto max-w-6xl px-4 py-8'>
        {isHtml ? (
          <div
            className='prose prose-neutral dark:prose-invert max-w-none'
            dangerouslySetInnerHTML={{ __html: rawContent }}
          />
        ) : (
          <Markdown className='prose-neutral dark:prose-invert max-w-none'>
            {rawContent}
          </Markdown>
        )}
      </div>
    </PublicLayout>
  )
}
