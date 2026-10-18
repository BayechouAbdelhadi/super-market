import { SupabaseDirectoryRepository } from '@/lib/loyalty/adapters/supabase-directory-repository'
import { LOYALTY_CONFIG } from '@/lib/loyalty/config'
import { CustomerWorkspace } from '@/components/loyalty/CustomerWorkspace'
import { ProfileWithCustomerRow } from '@/lib/loyalty/types'
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

  const customers = profiles.map((p: ProfileWithCustomerRow) => {
    const cust = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    return {
      ...p,
      loyalty_points: cust?.loyalty_points ?? 0,
      status: cust?.status ?? LOYALTY_CONFIG.defaults.tier,
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
