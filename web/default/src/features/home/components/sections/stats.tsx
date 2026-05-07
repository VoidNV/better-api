import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Activity, Layers, Route, SlidersHorizontal } from 'lucide-react'

interface CounterProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
}

function Counter(props: CounterProps) {
  const { end, suffix = '', prefix = '', duration = 1800, decimals = 0 } = props
  const ref = useRef<HTMLSpanElement>(null)
  const startedRef = useRef(false)

  const formatValue = useCallback(
    (v: number) =>
      decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString(),
    [decimals]
  )

  const animate = useCallback(() => {
    const el = ref.current
    if (!el) return
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = `${prefix}${formatValue(eased * end)}${suffix}`
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, prefix, suffix, formatValue])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      el.textContent = `${prefix}${formatValue(end)}${suffix}`
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true
          animate()
          observer.unobserve(el)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [animate, end, prefix, suffix, formatValue])

  return (
    <span ref={ref} className='tabular-nums'>
      {prefix}0{suffix}
    </span>
  )
}

interface StatsProps {
  className?: string
}

interface StatItem {
  end: number
  suffix: string
  label: string
  sub: string
  icon: React.ReactNode
  decimals?: number
}

export function Stats(_props: StatsProps) {
  const { t } = useTranslation()

  const stats: StatItem[] = [
    {
      end: 50,
      suffix: '+',
      label: t('Supported providers'),
      sub: t('Connect major AI vendors through one API'),
      icon: <Layers className='size-4' strokeWidth={1.5} />,
    },
    {
      end: 100,
      suffix: '+',
      label: t('Available models'),
      sub: t('Use chat, reasoning, image, and embedding models'),
      icon: <Activity className='size-4' strokeWidth={1.5} />,
    },
    {
      end: 1,
      suffix: '',
      label: t('Shared balance'),
      sub: t('Prepaid credit for your workspace usage'),
      icon: <Route className='size-4' strokeWidth={1.5} />,
    },
    {
      end: 24,
      suffix: '/7',
      label: t('Platform access'),
      sub: t('Built for teams running live integrations'),
      icon: <SlidersHorizontal className='size-4' strokeWidth={1.5} />,
    },
  ]

  return (
    <section className='relative z-10 border-y border-black/[0.06] bg-white/55 backdrop-blur-xl dark:border-white/[0.06] dark:bg-black'>
      <div className='mx-auto max-w-6xl px-6 py-16 md:py-20'>
        <div className='grid grid-cols-2 divide-x divide-y divide-black/[0.06] md:grid-cols-4 md:divide-y-0 dark:divide-white/[0.06]'>
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className='group relative px-6 py-8 first:border-l-0 md:px-8 md:py-10'
            >
              <div className='flex items-center gap-2 text-[#6e6e73] transition-colors group-hover:text-[#1d1d1f] dark:text-white/40 dark:group-hover:text-white/70'>
                {s.icon}
                <span className='font-mono text-[10px] tracking-[0.2em] uppercase'>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className='mt-5 text-5xl leading-none font-semibold tracking-normal text-[#1d1d1f] md:text-6xl dark:text-white'>
                <Counter end={s.end} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <div className='mt-3 text-sm font-medium text-[#1d1d1f]/80 dark:text-white/80'>
                {s.label}
              </div>
              <div className='mt-1 text-xs text-[#6e6e73] dark:text-white/40'>
                {s.sub}
              </div>

              {/* Hover sweep */}
              <div
                aria-hidden
                className='pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:via-white/20'
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
