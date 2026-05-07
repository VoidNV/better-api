import z from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { ROLE } from '@/lib/roles'
import { InviteCodes } from '@/features/invite-codes'
import { INVITE_CODE_STATUS_VALUES } from '@/features/invite-codes/constants'

const InviteCodesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
  status: z.array(z.enum(INVITE_CODE_STATUS_VALUES)).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/invite-codes/')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()

    if (!auth.user || auth.user.role < ROLE.ADMIN) {
      throw redirect({
        to: '/403',
      })
    }
  },
  validateSearch: InviteCodesSearchSchema,
  component: InviteCodes,
})
