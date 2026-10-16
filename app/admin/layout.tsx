import { ProtectedDashboard } from "@/components/ui/ProtectedDashboard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedDashboard requiredRole="ADMIN">
      {children}
    </ProtectedDashboard>
  );
}
