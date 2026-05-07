import { api } from '@/lib/api'
import type {
  ApiResponse,
  GetInviteCodesParams,
  GetInviteCodesResponse,
  InviteCodeFormData,
  SearchInviteCodesParams,
} from './types'

export async function getInviteCodes(
  params: GetInviteCodesParams = {}
): Promise<GetInviteCodesResponse> {
  const { p = 1, page_size = 10 } = params
  const res = await api.get(`/api/invite-code/?p=${p}&page_size=${page_size}`)
  return res.data
}

export async function searchInviteCodes(
  params: SearchInviteCodesParams
): Promise<GetInviteCodesResponse> {
  const { keyword = '', p = 1, page_size = 10 } = params
  const res = await api.get(
    `/api/invite-code/search?keyword=${keyword}&p=${p}&page_size=${page_size}`
  )
  return res.data
}

export async function createInviteCodes(
  data: InviteCodeFormData
): Promise<ApiResponse<string[]>> {
  const res = await api.post('/api/invite-code/', data)
  return res.data
}

export async function deleteInviteCode(id: number): Promise<ApiResponse> {
  const res = await api.delete(`/api/invite-code/${id}/`)
  return res.data
}
