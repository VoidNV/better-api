import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { SettingsSection } from '../components/settings-section'
import { useResetForm } from '../hooks/use-reset-form'
import { useUpdateOption } from '../hooks/use-update-option'

const inviteCodeSchema = z.object({
  InviteCodeRequired: z.boolean(),
})

type InviteCodeFormValues = z.infer<typeof inviteCodeSchema>

type InviteCodeSettingsSectionProps = {
  defaultValues: InviteCodeFormValues
}

export function InviteCodeSettingsSection({
  defaultValues,
}: InviteCodeSettingsSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()

  const form = useForm({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues,
  })

  useResetForm(form, defaultValues)

  const onSubmit = async (data: InviteCodeFormValues) => {
    if (data.InviteCodeRequired !== defaultValues.InviteCodeRequired) {
      await updateOption.mutateAsync({
        key: 'InviteCodeRequired',
        value: data.InviteCodeRequired,
      })
    }
  }

  return (
    <SettingsSection
      title={t('Invite Codes')}
      description={t('Configure invite-only registration')}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='InviteCodeRequired'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>
                    {t('Invite code required')}
                  </FormLabel>
                  <FormDescription>
                    {t('Require a valid one-time invite code for password registration')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type='submit' disabled={updateOption.isPending}>
            {updateOption.isPending ? t('Saving...') : t('Save Changes')}
          </Button>
        </form>
      </Form>
    </SettingsSection>
  )
}
