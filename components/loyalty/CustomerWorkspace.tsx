"use client"

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { UserManager } from '@/components/shared/UserManager'

export function CustomerWorkspace({ initialCustomers = [] }: { initialCustomers?: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return initialCustomers
    return initialCustomers.filter((c) =>
      [c.first_name, c.last_name, c.email, c.phone_number]
        .filter(Boolean)
        .some((field: string) => field.toLowerCase().includes(q))
    )
  }, [initialCustomers, searchQuery])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Espace Client</h2>
        <p className="text-[var(--color-text-muted)]">Recherchez un client pour lui attribuer ou déduire des points, ou créez un nouveau profil.</p>
      </div>

      <div className="w-full">
        <SearchInput
          placeholder="Nom, prénom, téléphone ou email..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      <Card className="p-6">
        <UserManager
          initialUsers={filteredCustomers}
          roleToManage="CUSTOMER"
          title="Nouveau Client"
          description={
            searchQuery
              ? `${filteredCustomers.length} résultat(s) pour « ${searchQuery} »`
              : "Créer un nouveau profil client directement depuis la caisse."
          }
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Activité Récente</h3>
        <p className="text-[var(--color-text-muted)] mb-6">
          Historique des dernières transactions.
        </p>
        <div className="border border-dashed border-[var(--color-border)] rounded-[var(--radius-card,16px)] p-8 text-center text-[var(--color-text-muted)] text-sm">
          Aucune transaction récente
        </div>
      </Card>
    </div>
  )
}
