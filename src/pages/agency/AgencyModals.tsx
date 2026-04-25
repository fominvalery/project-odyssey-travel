import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import InviteModal from "@/components/agency/InviteModal"
import DepartmentModal from "@/components/agency/DepartmentModal"
import ReassignObjectModal from "@/components/agency/ReassignObjectModal"
import ReassignLeadModal from "@/components/agency/ReassignLeadModal"
import { Department, Employee, RoleCode, InviteRow } from "@/lib/agencyApi"
import type { ObjectData } from "@/components/AddObjectWizard"
import type { Lead } from "@/components/dashboard/LeadCard"

interface Props {
  orgId: string
  userId: string
  isFounder: boolean
  isRop: boolean
  myDeptId: string | null
  departments: Department[]
  employees: Employee[]
  invites: InviteRow[]
  // InviteModal
  inviteOpen: boolean
  setInviteOpen: (v: boolean) => void
  onInvited: () => void
  // DepartmentModal
  deptModalOpen: boolean
  setDeptModalOpen: (v: boolean) => void
  editingDept: Department | null
  onDeptSaved: () => void
  // Delete dept dialog
  deletingDept: Department | null
  setDeletingDept: (d: Department | null) => void
  onConfirmDeleteDept: () => void
  // ReassignObjectModal
  reassigningObject: ObjectData | null
  setReassigningObject: (o: ObjectData | null) => void
  onReassignObject: (objId: string, toUserId: string) => Promise<void>
  // ReassignLeadModal
  reassigningLead: Lead | null
  setReassigningLead: (l: Lead | null) => void
  onReassignLead: (leadId: string, toUserId: string) => Promise<void>
}

export default function AgencyModals({
  orgId, userId, isFounder, isRop, myDeptId,
  departments, employees,
  inviteOpen, setInviteOpen, onInvited,
  deptModalOpen, setDeptModalOpen, editingDept, onDeptSaved,
  deletingDept, setDeletingDept, onConfirmDeleteDept,
  reassigningObject, setReassigningObject, onReassignObject,
  reassigningLead, setReassigningLead, onReassignLead,
}: Props) {
  return (
    <>
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        orgId={orgId}
        departments={departments}
        onInvited={onInvited}
        canInviteDirector={isFounder}
        isRop={isRop}
        ropDeptId={isRop ? myDeptId : null}
      />

      <DepartmentModal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        orgId={orgId}
        employees={employees}
        department={editingDept}
        onSaved={onDeptSaved}
      />

      {reassigningObject && (
        <ReassignObjectModal
          obj={reassigningObject}
          employees={employees}
          currentUserId={userId}
          onReassign={onReassignObject}
          onClose={() => setReassigningObject(null)}
        />
      )}

      {reassigningLead && (
        <ReassignLeadModal
          lead={reassigningLead}
          employees={employees}
          currentUserId={userId}
          onReassign={onReassignLead}
          onClose={() => setReassigningLead(null)}
        />
      )}

      <Dialog open={!!deletingDept} onOpenChange={(v) => !v && setDeletingDept(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить отдел?</DialogTitle>
            <DialogDescription>
              Отдел «{deletingDept?.name}» будет архивирован. Сотрудники останутся в агентстве.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDept(null)}>Отмена</Button>
            <Button onClick={onConfirmDeleteDept} className="bg-red-500 hover:bg-red-600 text-white">Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
