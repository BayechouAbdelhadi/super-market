import { Metadata } from "next";
import { EditTransactionScreen } from "@/components/loyalty/EditTransactionScreen";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modifier la transaction",
};

export default async function AdminEditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditTransactionScreen transactionId={id} basePath="/admin" />;
}
