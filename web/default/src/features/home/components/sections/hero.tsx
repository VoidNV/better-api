import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

const EASE = [0.16, 1, 0.3, 1] as const

export function Hero(props: HeroProps) {
  const { t } = useTranslation()

  return (
    <section className='relative z-10 overflow-hidden px-6 pt-32 pb-20 md:pt-40 md:pb-28'>
      {/* Ambient landing wash */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-80 dark:opacity-60'
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 72%)',
        }}
      />
      <div
        aria-hidden
        className='landing-dot-grid pointer-events-none absolute inset-0 -z-20 opacity-35 dark:opacity-60 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,black_20%,transparent_100%)]'
      />
      {/* Horizontal scan line */}
      <div
        aria-hidden
        className='pointer-events-none absolute top-[85%] left-0 -z-10 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/20'
      />

      <div className='relative mx-auto flex max-w-5xl flex-col items-center text-center'>
        {/* Announcement pill */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className='mb-8'
        >
          <Link
            to='/pricing'
            className='group inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-1.5 text-xs font-medium text-[#1d1d1f]/70 shadow-sm backdrop-blur-xl transition-all hover:border-black/15 hover:bg-white hover:text-[#1d1d1f] dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/[0.06] dark:hover:text-white'
          >
            <span className='flex size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' />
            <span className='uppercase'>{t('Pricing')}</span>
            <span className='h-3 w-px bg-black/10 dark:bg-white/10' />
            <span>{t('Deposit $5, receive $25 in platform credit')}</span>
            <ArrowUpRight className='size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
          </Link>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className='text-5xl leading-[1.02] font-semibold tracking-normal text-[#1d1d1f] md:text-7xl dark:text-white'
        >
          <span className='block'>{t('Unified AI access')}</span>
          <span className='block text-[#6e6e73] dark:text-white/55'>
            {t('designed for scale.')}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
          className='mt-8 max-w-2xl text-base leading-8 text-[#424245] md:text-lg dark:text-white/65'
        >
          {t(
            'Connect OpenAI, Claude, Gemini, DeepSeek, Qwen, and other supported providers through one API, with centralized billing and published pricing.'
          )}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
          className='mt-10 flex flex-col items-center gap-3 sm:flex-row'
        >
          {props.isAuthenticated ? (
            <Link
              to='/dashboard'
              className='bg-primary text-primary-foreground group inline-flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-medium shadow-sm transition-all hover:opacity-90 active:scale-[0.98]'
            >
              {t('Go to Dashboard')}
              <ArrowUpRight className='size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
            </Link>
          ) : (
            <>
              <Link
                to='/sign-up'
                className='bg-primary text-primary-foreground group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-lg px-6 text-sm font-medium shadow-sm transition-all hover:opacity-90 active:scale-[0.98]'
              >
                <Sparkles className='size-3.5' />
                {t('Get started free')}
                <ArrowUpRight className='size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
              </Link>
              <Link
                to='/pricing'
                className='inline-flex h-11 items-center gap-2 rounded-lg border border-black/10 bg-white/70 px-6 text-sm font-medium text-[#1d1d1f]/80 shadow-sm backdrop-blur-xl transition-all hover:border-black/15 hover:bg-white hover:text-[#1d1d1f] active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.02] dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/[0.06] dark:hover:text-white'
              >
                {t('View model pricing')}
              </Link>
            </>
          )}
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: EASE, delay: 0.7 }}
          className='mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] text-[#6e6e73] uppercase dark:text-white/30'
        >
          <span>OpenAI</span>
          <span className='h-1 w-1 rounded-full bg-black/15 dark:bg-white/15' />
          <span>Anthropic</span>
          <span className='h-1 w-1 rounded-full bg-black/15 dark:bg-white/15' />
          <span>Google</span>
          <span className='h-1 w-1 rounded-full bg-black/15 dark:bg-white/15' />
          <span>Azure</span>
          <span className='h-1 w-1 rounded-full bg-black/15 dark:bg-white/15' />
          <span>Bedrock</span>
          <span className='h-1 w-1 rounded-full bg-black/15 dark:bg-white/15' />
          <span>DeepSeek</span>
        </motion.div>
      </div>

      {/* Terminal demo */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: EASE, delay: 0.55 }}
        className='relative mt-20'
      >
        {/* Glow behind terminal */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 -top-20 -z-10 mx-auto h-40 max-w-2xl bg-primary/10 blur-3xl'
        />
        <HeroTerminalDemo />
      </motion.div>
    </section>
  )
}
