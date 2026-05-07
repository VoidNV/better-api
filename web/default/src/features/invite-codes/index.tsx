import { useTranslation } from 'react-i18next'
import { SectionPageLayout } from '@/components/layout'
import { InviteCodesDialogs } from './components/invite-codes-dialogs'
import { InviteCodesPrimaryButtons } from './components/invite-codes-primary-buttons'
import { InviteCodesProvider } from './components/invite-codes-provider'
import { InviteCodesTable } from './components/invite-codes-table'

export function InviteCodes() {
  const { t } = useTranslation()
  return (
    <InviteCodesProvider>
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Invite Codes')}</SectionPageLayout.Title>
        <SectionPageLayout.Description>
          {t('Manage invite-only registration codes')}
        </SectionPageLayout.Description>
        <SectionPageLayout.Actions>
          <InviteCodesPrimaryButtons />
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <InviteCodesTable />
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <InviteCodesDialogs />
    </InviteCodesProvider>
  )
}
