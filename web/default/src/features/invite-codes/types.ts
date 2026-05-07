import { z } from 'zod'

export const inviteCodeSchema = z.object({
  id: z.number(),
  code: z.string(),
  status: z.number(),
  note: z.string(),
  created_by: z.number(),
  created_time: z.number(),
  used_by_user_id: z.number(),
  used_time: z.number(),
  expired_time: z.number(),
})

export type InviteCode = z.infer<typeof inviteCodeSchema>

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface GetInviteCodesParams {
  p?: number
  page_size?: number
}

export interface GetInviteCodesResponse {
  success: boolean
  message?: string
  data?: {
    items: InviteCode[]
    total: number
    page: number
    page_size: number
  }
}

export interface SearchInviteCodesParams {
  keyword?: string
  p?: number
  page_size?: number
}

export interface InviteCodeFormData {
  count: number
  expired_time: number
  note?: string
}

export type InviteCodesDialogType = 'create' | 'delete'
