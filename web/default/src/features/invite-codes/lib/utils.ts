import { INVITE_CODE_STATUS } from '../constants'

export function isTimestampExpired(timestamp: number): boolean {
  if (timestamp === 0) return false
  return timestamp < Date.now() / 1000
}

export function isInviteCodeExpired(
  expiredTime: number,
  status: number
): boolean {
  return status === INVITE_CODE_STATUS.ACTIVE && isTimestampExpired(expiredTime)
}
