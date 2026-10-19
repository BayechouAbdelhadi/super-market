import { SupabaseDirectoryRepository } from '@/lib/loyalty/adapters/supabase-directory-repository'
import { LOYALTY_CONFIG } from '@/lib/loyalty/config'
import { CustomerWorkspace } from '@/components/loyalty/CustomerWorkspace'
import { DirectoryUser, LoyaltyTier, ProfileWithCustomerRow } from '@/lib/loyalty/types'
import { getAppSettings } from '@/lib/settings/service'

const directory = new SupabaseDirectoryRepository()
const BACK_OFFICE_LIST_LIMIT = LOYALTY_CONFIG.pagination.backOfficeListLimit

interface CustomersListProps {
  title?: string
  subtitle?: string
  initialPage?: number
  initialLimit?: number
  initialQuery?: string
}

export async function CustomersList({
  title,
  subtitle,
  initialPage,
  initialLimit,
  initialQuery,
}: CustomersListProps = {}) {
  const [profiles, settings] = await Promise.all([
    directory.listRecentCustomers(BACK_OFFICE_LIST_LIMIT),
    getAppSettings(),
  ])

  const customers = profiles.map((p: ProfileWithCustomerRow): DirectoryUser => {
    const cust = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    return {
      id: p.id,
      first_name: p.first_name ?? null,
      last_name: p.last_name ?? null,
      email: p.email ?? null,
      phone_number: p.phone_number ?? null,
      role: p.role ?? null,
      created_at: p.created_at,
      loyalty_points: cust?.loyalty_points ?? 0,
      status: (cust?.status as LoyaltyTier | undefined) ?? LOYALTY_CONFIG.defaults.tier,
    };
  });

  return (
    <CustomerWorkspace
      initialCustomers={customers}
      title={title}
      subtitle={subtitle}
      initialPage={initialPage}
      initialLimit={initialLimit}
      initialQuery={initialQuery}
      settings={settings}
    />
  )
}
