"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { UserManager } from '@/components/shared/UserManager'

export function CustomerWorkspace({ initialCustomers = [] }: { initialCustomers?: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')

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
          initialUsers={initialCustomers} 
          roleToManage="CUSTOMER"  
          title="Nouveau Client" 
          description="Créer un nouveau profil client directement depuis la caisse." 
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Activité Récente</h3>
        <p className="text-[var(--color-text-muted)] mb-6">
          Historique des dernières transactions.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          Aucune transaction récente
        </div>
      </Card>
    </div>
  )
}
