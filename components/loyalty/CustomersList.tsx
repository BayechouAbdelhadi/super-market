import { SupabaseDirectoryRepository } from '@/lib/loyalty/adapters/supabase-directory-repository'
import { LOYALTY_CONFIG } from '@/lib/loyalty/config'
import { CustomerWorkspace } from '@/components/loyalty/CustomerWorkspace'
import { DirectoryUser, LoyaltyTier, ProfileWithCustomerRow } from '@/lib/loyalty/types'
import { getAppSettings } from '@/lib/settings/service'

const directory = new SupabaseDirectoryRepository()
const { tablePageSize, maxPageSize } = LOYALTY_CONFIG.pagination

interface CustomersListProps {
  title?: string
  subtitle?: string
  initialPage?: number
  initialLimit?: number
  initialQuery?: string
  /** Admin only: show the disable / enable account button */
  canToggleStatus?: boolean
}

export async function CustomersList({
  title,
  subtitle,
  initialPage,
  initialLimit,
  initialQuery,
  canToggleStatus,
}: CustomersListProps = {}) {
  const page = Math.max(1, initialPage || 1)
  const limit = Math.min(maxPageSize, Math.max(1, initialLimit || tablePageSize))
  const query = initialQuery ?? ''
  const [{ items: profiles, total }, settings] = await Promise.all([
    directory.listCustomersPage(query, limit, (page - 1) * limit),
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
      disabled_at: p.disabled_at ?? null,
      loyalty_points: cust?.loyalty_points ?? 0,
      status: (cust?.status as LoyaltyTier | undefined) ?? LOYALTY_CONFIG.defaults.tier,
    };
  });

  return (
    <CustomerWorkspace
      initialCustomers={customers}
      title={title}
      subtitle={subtitle}
      totalCustomers={total}
      page={page}
      limit={limit}
      query={query}
      settings={settings}
      canToggleStatus={canToggleStatus}
    />
  )
}
