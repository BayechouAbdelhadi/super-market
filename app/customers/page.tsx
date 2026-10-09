import { ProtectedDashboard } from '@/components/ui/ProtectedDashboard'
import { CustomersList } from '@/components/loyalty/CustomersList'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "SuperMarket — Gestion des Clients",
  description: "Gestion et CRUD des profils clients de votre magasin",
}

interface CustomersPageProps {
  searchParams?: Promise<{ page?: string; limit?: string; q?: string }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = searchParams ? await searchParams : {};
  const initialPage = params.page ? parseInt(params.page, 10) : undefined;
  const initialLimit = params.limit ? parseInt(params.limit, 10) : undefined;
  const initialQuery = params.q || undefined;

  return (
    <ProtectedDashboard requiredRole="CASHIER">
      <CustomersList 
        title="Gestion des Clients"
        subtitle="Consultez, modifiez et gérez l'ensemble des profils clients de votre magasin."
        initialPage={initialPage}
        initialLimit={initialLimit}
        initialQuery={initialQuery}
      />
    </ProtectedDashboard>
  )
}
