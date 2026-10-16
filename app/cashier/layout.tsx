import { ProtectedDashboard } from "@/components/ui/ProtectedDashboard";

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedDashboard requiredRole="CASHIER">
      {children}
    </ProtectedDashboard>
  );
}
