import { Settings, Zap, BarChart3, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'

const EASE = [0.16, 1, 0.3, 1] as const

export function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    {
      num: '01',
      title: t('Create workspace'),
      desc: t(
        'Create your workspace and generate an API key for development or production use.'
      ),
      icon: <Settings className='size-5' strokeWidth={1.5} />,
      code: '$ sign up\n→ workspace.ready\n→ key: vk-••••',
    },
    {
      num: '02',
      title: t('Add account credit'),
      desc: t(
        'Deposit funds to activate prepaid platform credit. Pricing stays visible before you send traffic.'
      ),
      icon: <Zap className='size-5' strokeWidth={1.5} />,
      code: 'deposit  +$5\ncredit   $25\nbalance  $25.00',
    },
    {
      num: '03',
      title: t('Connect your app'),
      desc: t(
        'Point your application to the gateway and manage supported providers through one endpoint.'
      ),
      icon: <BarChart3 className='size-5' strokeWidth={1.5} />,
      code: 'baseURL: "https://api.example.com/v1"\napiKey:  "sk-••••"',
    },
  ]

  return (
    <section className='relative z-10 border-t border-black/[0.06] dark:border-white/[0.06] px-6 py-28 md:py-36'>
      <div className='mx-auto max-w-6xl'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className='mb-20 flex flex-col justify-between gap-6 md:flex-row md:items-end'
        >
          <div>
            <span className='font-mono text-[10px] tracking-[0.3em] text-[#6e6e73] dark:text-white/30 uppercase'>
              - {t('How it works')}
            </span>
            <h2 className='font-display mt-4 text-4xl leading-[1.05] font-normal tracking-tight text-[#1d1d1f] dark:text-white md:text-5xl'>
              {t('One API.')}
              <br />
              <span className='italic text-[#6e6e73] dark:text-white/50'>
                {t('Clear operating model.')}
              </span>
            </h2>
          </div>
          <p className='max-w-sm text-sm leading-relaxed text-[#424245] dark:text-white/45'>
            {t(
              'The gateway is designed to make provider access, billing, and pricing easier to manage from one place.'
            )}
          </p>
        </motion.div>

        <div className='relative grid gap-4 md:grid-cols-3 md:gap-6'>
          {/* Connecting line */}
          <div
            aria-hidden
            className='pointer-events-none absolute top-16 left-[16.66%] -z-10 hidden h-px w-[66.66%] bg-gradient-to-r from-transparent via-black/10 dark:via-white/15 to-transparent md:block'
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: EASE }}
              className='group relative'
            >
              {/* Step icon + number */}
              <div className='relative z-10 mb-8 flex items-center gap-4'>
                <div className='relative flex size-14 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black text-[#1d1d1f]/80 dark:text-white/80 transition-all duration-300 group-hover:border-black/20 dark:group-hover:border-white/30 group-hover:bg-black/[0.02] dark:group-hover:bg-white/[0.04]'>
                  {step.icon}
                  {/* Pulse ring */}
                  <span
                    aria-hidden
                    className='pointer-events-none absolute inset-0 rounded-xl border border-black/5 dark:border-white/5 opacity-0 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100'
                  />
                </div>
                <span className='font-mono text-[10px] tracking-[0.3em] text-[#6e6e73]/60 dark:text-white/25 uppercase'>
                  {t('step')} {step.num}
                </span>
              </div>

              {/* Content */}
              <h3 className='text-lg font-medium tracking-tight text-[#1d1d1f] dark:text-white'>
                {step.title}
              </h3>
              <p className='mt-2 max-w-[280px] text-sm leading-relaxed text-[#424245] dark:text-white/45'>
                {step.desc}
              </p>

              {/* Code snippet */}
              <div className='mt-5 overflow-hidden rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.015] p-3'>
                <pre className='font-mono text-[10.5px] leading-relaxed whitespace-pre-wrap text-[#1d1d1f]/50 dark:text-white/50'>
                  {step.code}
                </pre>
              </div>

              {/* Arrow indicator between steps */}
              {i < steps.length - 1 && (
                <div className='absolute top-[26px] -right-3 hidden size-6 items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-black md:flex'>
                  <ArrowRight className='size-3 text-[#1d1d1f]/30 dark:text-white/30' />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
