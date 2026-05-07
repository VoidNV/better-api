import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function LanguageSwitcher() {
  const { t } = useTranslation()

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            disabled
            className='h-9 w-9 rounded-full opacity-60'
            aria-label={t('Language')}
          >
            <Languages className='size-[1.2rem]' />
            <span className='sr-only'>{t('Language')}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='text-xs'>
          {t('English (only language available)')}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
