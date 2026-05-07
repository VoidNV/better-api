import { z } from 'zod'
import type { TFunction } from 'i18next'
import {
  INVITE_CODE_VALIDATION,
  getInviteCodeFormErrorMessages,
} from '../constants'
import { type InviteCodeFormData } from '../types'

export function getInviteCodeFormSchema(t: TFunction) {
  const msg = getInviteCodeFormErrorMessages(t)
  return z.object({
    count: z
      .number()
      .min(INVITE_CODE_VALIDATION.COUNT_MIN, msg.COUNT_INVALID)
      .max(INVITE_CODE_VALIDATION.COUNT_MAX, msg.COUNT_INVALID),
    expired_time: z.date().optional(),
    note: z
      .string()
      .max(INVITE_CODE_VALIDATION.NOTE_MAX_LENGTH, msg.NOTE_TOO_LONG)
      .optional(),
  })
}

export type InviteCodeFormValues = {
  count: number
  expired_time?: Date
  note?: string
}

export const INVITE_CODE_FORM_DEFAULT_VALUES: InviteCodeFormValues = {
  count: 1,
  expired_time: undefined,
  note: '',
}

export function transformFormDataToPayload(
  data: InviteCodeFormValues
): InviteCodeFormData {
  return {
    count: data.count,
    expired_time: data.expired_time
      ? Math.floor(data.expired_time.getTime() / 1000)
      : 0,
    note: data.note?.trim() || '',
  }
}
