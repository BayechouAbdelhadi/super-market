import { ReactNode } from 'react'
import { Sidebar } from '@/components/ui/Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
  role: 'ADMIN' | 'CASHIER' | 'CUSTOMER'
  email: string
}

export function DashboardLayout({ children, role, email }: DashboardLayoutProps) {
  return (
    <div className="h-full w-full overflow-hidden bg-[var(--color-background)] flex flex-col md:flex-row">
      <Sidebar role={role} email={email} />

      {/* Main Content Area — flex-1 + min-h-0 ensures it doesn't blow past the viewport */}
      <main className="flex-1 min-h-0 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
