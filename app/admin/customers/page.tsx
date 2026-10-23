import { CustomersList } from "@/components/loyalty/CustomersList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients",
  description: "Gestion et CRUD des profils clients de votre magasin",
};

interface AdminCustomersPageProps {
  searchParams?: Promise<{ page?: string; limit?: string; q?: string }>;
}

export default async function AdminCustomersPage({
  searchParams,
}: AdminCustomersPageProps) {
  const params = searchParams ? await searchParams : {};
  const initialPage = params.page ? parseInt(params.page, 10) : undefined;
  const initialLimit = params.limit ? parseInt(params.limit, 10) : undefined;
  const initialQuery = params.q || undefined;

  return (
    <CustomersList
      title="Gestion des Clients"
      subtitle="Consultez, modifiez et gérez l'ensemble des profils clients de votre magasin."
      initialPage={initialPage}
      initialLimit={initialLimit}
      initialQuery={initialQuery}
      canToggleStatus
    />
  );
}
