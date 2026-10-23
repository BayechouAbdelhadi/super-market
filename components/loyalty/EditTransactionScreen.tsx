import Link from "next/link";
import { getCustomerDetail, getTransaction } from "@/lib/loyalty/service";
import { canEditTransaction } from "@/lib/loyalty/domain";
import { getSessionCaller } from "@/lib/auth/session";
import { getAppSettings } from "@/lib/settings/service";
import { TransactionIdSchema } from "@/lib/loyalty/validation";
import { Card } from "@/components/ui/card";
import { EditTransactionForm } from "./EditTransactionForm";

interface EditTransactionScreenProps {
  transactionId: string;
  /** Dashboard root of the caller ("/cashier" or "/admin") */
  basePath: string;
}

/**
 * Edit page of a recorded transaction, shared by the cashier and admin dashboards.
 * The API re-checks the rights on save; this only avoids showing a form that would be refused.
 */
export async function EditTransactionScreen({ transactionId, basePath }: EditTransactionScreenProps) {
  const caller = await getSessionCaller(["ADMIN", "CASHIER"]);
  const parsedId = TransactionIdSchema.safeParse(transactionId);
  const transaction = caller.ok && parsedId.success ? await getTransaction(parsedId.data) : null;
  const customer = transaction ? await getCustomerDetail(transaction.customer_id) : null;
  const returnHref = customer ? `${basePath}/pos?customer=${customer.id}` : `${basePath}/pos`;

  let notice: string | null = null;
  if (!caller.ok || !transaction || !customer) {
    notice = "Transaction introuvable.";
  } else if (!canEditTransaction(caller.role, transaction.created_at)) {
    notice = "Seules les transactions du jour peuvent être modifiées par un caissier. Contactez un administrateur.";
  }

  const settings = await getAppSettings();

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div className="space-y-1">
        <Link
          href={returnHref}
          className="inline-flex items-center min-h-[44px] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          ← Retour à la fiche client
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] tracking-tight">
          Modifier la transaction
        </h1>
      </div>

      {notice || !transaction || !customer ? (
        <Card padded="lg">
          <p className="text-sm text-[var(--color-text-muted)]">{notice}</p>
        </Card>
      ) : (
        <EditTransactionForm
          transaction={transaction}
          customerName={customer.full_name}
          returnHref={returnHref}
          euroToPointsRatio={settings.loyalty.euroToPointsRatio}
          pointValueInEuro={settings.loyalty.pointValueInEuro}
        />
      )}
    </div>
  );
}
