import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { addTimeToDate } from '@/lib/time'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DateTimePicker } from '@/components/datetime-picker'
import { createInviteCodes } from '../api'
import { SUCCESS_MESSAGES } from '../constants'
import {
  getInviteCodeFormSchema,
  type InviteCodeFormValues,
  INVITE_CODE_FORM_DEFAULT_VALUES,
  transformFormDataToPayload,
} from '../lib'
import { useInviteCodes } from './invite-codes-provider'

type InviteCodesMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteCodesMutateDrawer({
  open,
  onOpenChange,
}: InviteCodesMutateDrawerProps) {
  const { t } = useTranslation()
  const { triggerRefresh } = useInviteCodes()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<InviteCodeFormValues>({
    resolver: zodResolver(getInviteCodeFormSchema(t)),
    defaultValues: INVITE_CODE_FORM_DEFAULT_VALUES,
  })

  const onSubmit = async (data: InviteCodeFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await createInviteCodes(transformFormDataToPayload(data))
      if (result.success) {
        const count = result.data?.length || 0
        toast.success(
          count > 1
            ? t('Successfully created {{count}} invite codes', { count })
            : t(SUCCESS_MESSAGES.INVITE_CODE_CREATED)
        )
        onOpenChange(false)
        triggerRefresh()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetExpiry = (months: number, days: number, hours: number) => {
    form.setValue('expired_time', addTimeToDate(months, days, hours))
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value)
        if (!value) {
          form.reset(INVITE_CODE_FORM_DEFAULT_VALUES)
        }
      }}
    >
      <SheetContent className='flex h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-b px-4 py-3 text-start sm:px-6 sm:py-4'>
          <SheetTitle>{t('Generate invite codes')}</SheetTitle>
          <SheetDescription>
            {t('Create single-use invite codes for password registration.')}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='invite-code-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-4 overflow-y-auto px-3 py-3 pb-4 sm:space-y-6 sm:px-4'
          >
            <FormField
              control={form.control}
              name='count'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Invite code count (1-100)')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      min='1'
                      max='100'
                      onChange={(event) =>
                        field.onChange(parseInt(event.target.value, 10) || 1)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='note'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Note')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('Optional note for these invite codes')}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('Visible to administrators only')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='expired_time'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Expiration Time')}</FormLabel>
                  <div className='space-y-2'>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('Never expires')}
                      />
                    </FormControl>
                    <div className='grid grid-cols-4 gap-1.5 sm:flex sm:gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => form.setValue('expired_time', undefined)}
                      >
                        {t('Never')}
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => handleSetExpiry(1, 0, 0)}
                      >
                        {t('1M')}
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => handleSetExpiry(0, 7, 0)}
                      >
                        {t('1W')}
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => handleSetExpiry(0, 1, 0)}
                      >
                        {t('1 Day')}
                      </Button>
                    </div>
                  </div>
                  <FormDescription>
                    {t('Leave empty for never expires')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='grid grid-cols-2 gap-2 border-t px-4 py-3 sm:flex sm:px-6 sm:py-4'>
          <SheetClose asChild>
            <Button variant='outline'>{t('Close')}</Button>
          </SheetClose>
          <Button form='invite-code-form' type='submit' disabled={isSubmitting}>
            {isSubmitting ? t('Saving...') : t('Save changes')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
