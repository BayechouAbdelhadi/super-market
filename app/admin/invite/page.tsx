import { ProtectedDashboard } from "@/components/ui/ProtectedDashboard";
import { InviteUserManager } from "@/components/admin/invite/InviteUserManager";

export default function AdminInvitePage() {
  return (
    <ProtectedDashboard requiredRole="ADMIN">
      <InviteUserManager />
    </ProtectedDashboard>
  );
}
