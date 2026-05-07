import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useInviteCodes } from './invite-codes-provider'

export function InviteCodesPrimaryButtons() {
  const { t } = useTranslation()
  const { setOpen } = useInviteCodes()
  return (
    <div className='flex gap-2'>
      <Button size='sm' onClick={() => setOpen('create')}>
        <Plus className='h-4 w-4' />
        {t('Generate invite codes')}
      </Button>
    </div>
  )
}
