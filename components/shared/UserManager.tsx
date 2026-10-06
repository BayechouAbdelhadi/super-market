"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PaginatedList } from '@/components/ui/PaginatedList'
import { createUser, editUser } from '@/app/admin/actions'

interface UserManagerProps {
  initialUsers: any[];
  roleToManage: 'CASHIER' | 'CUSTOMER';
  title: string;
  description: string;
}

export function UserManager({ initialUsers, roleToManage, title, description }: UserManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  function openCreate() {
    setEditingUser(null)
    setError('')
    setSuccessMsg('')
    setIsOpen(true)
  }

  function openEdit(user: any) {
    setEditingUser(user)
    setError('')
    setSuccessMsg('')
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
    setEditingUser(null)
    setError('')
    setSuccessMsg('')
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    
    if (editingUser) {
      formData.append('user_id', editingUser.id)
      const result = await editUser(formData)
      if (result.error) {
        setError(result.error)
      } else {
        close()
      }
    } else {
      formData.append('role', roleToManage);
      const result = await createUser(formData)
      if (result.error) {
        setError(result.error)
      } else {
        const roleName = result.role === 'CASHIER' ? 'Caissier' : 'Client';
        setSuccessMsg(`${roleName} créé avec succès !`)
      }
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-[var(--color-text-muted)]">
          {description}
        </p>
        <Button onClick={openCreate}>+ Ajouter un {roleToManage === 'CASHIER' ? 'caissier' : 'client'}</Button>
      </div>

      <PaginatedList
        items={initialUsers}
        keyExtractor={(u) => u.id}
        defaultPageSize={8}
        pageSizeOptions={[8, 20, 50]}
        renderItem={(u) => (
          <div className="flex justify-between items-center p-3 border border-[var(--color-border)] rounded-[var(--radius-card,16px)] bg-[var(--color-surface)]">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">{u.first_name} {u.last_name}</p>
              <div className="flex gap-4 text-xs text-[var(--color-text-muted)] mt-0.5">
                <span>{u.email}</span>
                {u.phone_number && <span>📞 {u.phone_number}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-md hidden sm:block">
                Actif
              </div>
              <Button variant="secondary" onClick={() => openEdit(u)} className="px-3 py-1.5 text-xs min-h-0 h-auto">
                Modifier
              </Button>
            </div>
          </div>
        )}
        emptyState={
          <div className="border border-dashed border-[var(--color-border)] rounded-[var(--radius-card,16px)] p-10 text-center text-sm text-[var(--color-text-muted)]">
            Aucun utilisateur pour le moment.
          </div>
        }
      />

      <Modal 
        isOpen={isOpen} 
        onClose={close} 
        title={editingUser ? `Modifier ${editingUser.first_name}` : `Ajouter un ${roleToManage === 'CASHIER' ? 'caissier' : 'client'}`}
      >
        <div className="p-6">
          {successMsg ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-[var(--radius-button,12px)] text-sm font-medium">
                {successMsg}
              </div>
              <Button onClick={close} className="w-full">Fermer</Button>
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input id="first_name" name="first_name" label="Prénom" defaultValue={editingUser?.first_name || ''} required />
                <Input id="last_name" name="last_name" label="Nom" defaultValue={editingUser?.last_name || ''} required />
              </div>
              
              <Input 
                id="email" 
                name="email" 
                type="email" 
                label="Adresse Email" 
                defaultValue={editingUser?.email || ''} 
                required 
                disabled={!!editingUser}
              />
              
              <Input 
                id="phone_number" 
                name="phone_number" 
                type="tel" 
                label="Numéro de téléphone" 
                defaultValue={editingUser?.phone_number || ''} 
                required 
              />
              
              {!editingUser && (
                <Input id="password" name="password" type="password" label="Mot de passe" required />
              )}
              
              {error && <p className="text-sm text-red-600 p-2 bg-red-50 rounded-md">{error}</p>}
              
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={close}>Annuler</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : (editingUser ? 'Mettre à jour' : 'Créer')}</Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  )
}
