import { type TFunction } from 'i18next'
import { type StatusBadgeProps } from '@/components/status-badge'

export const INVITE_CODE_STATUS = {
  ACTIVE: 1,
  USED: 2,
  REVOKED: 3,
} as const

export const INVITE_CODE_STATUS_VALUES = Object.values(INVITE_CODE_STATUS).map(
  (value) => String(value)
) as `${number}`[]

export const INVITE_CODE_STATUSES: Record<
  number,
  Pick<StatusBadgeProps, 'variant' | 'showDot'> & {
    labelKey: string
    value: number
  }
> = {
  [INVITE_CODE_STATUS.ACTIVE]: {
    labelKey: 'Active',
    variant: 'success',
    value: INVITE_CODE_STATUS.ACTIVE,
    showDot: true,
  },
  [INVITE_CODE_STATUS.USED]: {
    labelKey: 'Used',
    variant: 'neutral',
    value: INVITE_CODE_STATUS.USED,
    showDot: true,
  },
  [INVITE_CODE_STATUS.REVOKED]: {
    labelKey: 'Revoked',
    variant: 'neutral',
    value: INVITE_CODE_STATUS.REVOKED,
    showDot: true,
  },
} as const

export const INVITE_CODE_FILTER_EXPIRED = 'expired'

export function getInviteCodeStatusOptions(t: TFunction) {
  return [
    ...Object.values(INVITE_CODE_STATUSES).map((config) => ({
      label: t(config.labelKey),
      value: String(config.value),
    })),
    {
      label: t('Expired'),
      value: INVITE_CODE_FILTER_EXPIRED,
    },
  ]
}

export const INVITE_CODE_VALIDATION = {
  COUNT_MIN: 1,
  COUNT_MAX: 100,
  NOTE_MAX_LENGTH: 255,
} as const

export const ERROR_MESSAGES = {
  COUNT_INVALID: 'Count must be between {{min}} and {{max}}',
  NOTE_TOO_LONG: 'Note cannot exceed {{max}} characters',
  EXPIRED_TIME_INVALID: 'Expired time cannot be earlier than current time',
} as const

export function getInviteCodeFormErrorMessages(t: TFunction) {
  return {
    COUNT_INVALID: t(ERROR_MESSAGES.COUNT_INVALID, {
      min: INVITE_CODE_VALIDATION.COUNT_MIN,
      max: INVITE_CODE_VALIDATION.COUNT_MAX,
    }),
    NOTE_TOO_LONG: t(ERROR_MESSAGES.NOTE_TOO_LONG, {
      max: INVITE_CODE_VALIDATION.NOTE_MAX_LENGTH,
    }),
    EXPIRED_TIME_INVALID: t(ERROR_MESSAGES.EXPIRED_TIME_INVALID),
  } as const
}

export const SUCCESS_MESSAGES = {
  INVITE_CODE_CREATED: 'Invite code(s) created successfully',
  INVITE_CODE_REVOKED: 'Invite code revoked successfully',
  COPY_SUCCESS: 'Copied to clipboard',
} as const
