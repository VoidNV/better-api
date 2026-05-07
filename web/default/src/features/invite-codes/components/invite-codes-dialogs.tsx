import { InviteCodesDeleteDialog } from './invite-codes-delete-dialog'
import { InviteCodesMutateDrawer } from './invite-codes-mutate-drawer'
import { useInviteCodes } from './invite-codes-provider'

export function InviteCodesDialogs() {
  const { open, setOpen } = useInviteCodes()

  return (
    <>
      <InviteCodesMutateDrawer
        open={open === 'create'}
        onOpenChange={(isOpen) => !isOpen && setOpen(null)}
      />
      <InviteCodesDeleteDialog />
    </>
  )
}
