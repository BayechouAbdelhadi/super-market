"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PaginatedList } from '@/components/ui/PaginatedList'
import { StatusBadge } from '@/components/loyalty/StatusBadge'
import { NewCustomerModal } from '@/components/loyalty/NewCustomerModal'
import { createUser, editUser } from '@/app/admin/actions'
import { LOYALTY_CONFIG } from '@/lib/loyalty/config'
import { toast } from '@/components/ui/sonner'

interface UserManagerProps {
  initialUsers: any[];
  roleToManage: 'CASHIER' | 'CUSTOMER';
  title: string;
  description: string;
  onViewDetail?: (user: any) => void;
  onAddCustomer?: () => void;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  alwaysShowPagination?: boolean;
}

export function UserManager({
  initialUsers,
  roleToManage,
  title: _title,
  description,
  onViewDetail,
  onAddCustomer,
  defaultPageSize = LOYALTY_CONFIG.pagination.tablePageSize,
  pageSizeOptions = [5, 10, 20, 50],
  alwaysShowPagination = true,
}: UserManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  function openCreate() {
    if (roleToManage === 'CUSTOMER') {
      if (onAddCustomer) {
        onAddCustomer()
      } else {
        setIsNewCustomerModalOpen(true)
      }
      return
    }
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
        toast.error(result.error)
      } else {
        toast.success("Utilisateur mis à jour avec succès !")
        close()
      }
    } else {
      formData.append('role', roleToManage);
      const result = await createUser(formData)
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        const roleName = result.role === 'CASHIER' ? 'Caissier' : 'Client';
        toast.success(`${roleName} créé avec succès !`)
        close()
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
        <Button onClick={openCreate}>+ {roleToManage === 'CASHIER' ? 'Ajouter un caissier' : 'Nouveau client'}</Button>
      </div>

      <PaginatedList
        items={initialUsers}
        keyExtractor={(u) => u.id}
        defaultPageSize={defaultPageSize}
        pageSizeOptions={pageSizeOptions}
        alwaysShow={alwaysShowPagination}
        renderItem={(u) => {
          const tier = u.status || 'BRONZE';
          const points = u.loyalty_points ?? 0;
          const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() || 'U';
          return (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-4.5 border border-[var(--color-border)] rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] gap-4 hover:border-[var(--color-border-hover)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-10 w-10 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center font-bold text-xs text-[var(--color-text)] shrink-0 shadow-2xs">
                  {initials}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="text-sm font-bold text-[var(--color-text)]">
                      {u.first_name} {u.last_name}
                    </p>
                    {roleToManage === 'CUSTOMER' && (
                      <StatusBadge status={tier} size="sm" />
                    )}
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-full font-semibold">
                      Actif
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">✉️ {u.email}</span>
                    {u.phone_number && (
                      <span className="flex items-center gap-1 font-mono">📞 {u.phone_number}</span>
                    )}
                    {roleToManage === 'CUSTOMER' && (
                      <span className="flex items-center gap-1 font-semibold text-[var(--color-primary)]">
                        ⭐ {points.toLocaleString('fr-FR')} point{points > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {roleToManage === 'CUSTOMER' && onViewDetail && (
                  <Button
                    variant="primary"
                    onClick={() => onViewDetail(u)}
                    className="px-3.5 py-1.5 text-xs min-h-[38px] h-auto flex items-center gap-1.5"
                  >
                    <span>🏆</span>
                    <span>Détails &amp; Fidélité</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => openEdit(u)}
                  className="px-3 py-1.5 text-xs min-h-[38px] h-auto"
                >
                  Modifier
                </Button>
              </div>
            </div>
          );
        }}
        emptyState={
          <div className="border border-dashed border-[var(--color-border)] rounded-[var(--radius-card,16px)] p-10 text-center text-sm text-[var(--color-text-muted)]">
            Aucun utilisateur pour le moment.
          </div>
        }
      />

      {/* Edit modal or Cashier creation modal */}
      {(editingUser || roleToManage === 'CASHIER') && (
        <Modal 
          isOpen={isOpen} 
          onClose={close} 
          title={editingUser ? `Modifier ${editingUser.first_name}` : `Ajouter un caissier`}
        >
          <div className="p-6">
            {successMsg ? (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-[var(--radius-button,12px)] text-sm font-medium">
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
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-[var(--radius-button,12px)] text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                    ✉️ Un email de confirmation sera automatiquement envoyé pour inviter l&apos;utilisateur à définir son mot de passe et activer son accès.
                  </div>
                )}
                
                {error && (
                  <p className="text-xs text-rose-700 dark:text-rose-300 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-[var(--radius-button,12px)]">
                    {error}
                  </p>
                )}
                
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={close} disabled={loading}>Annuler</Button>
                  <Button type="submit" loading={loading}>{loading ? 'Enregistrement...' : (editingUser ? 'Mettre à jour' : 'Créer')}</Button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}

      {/* Unified Customer Creation Modal (fallback if not handled by parent) */}
      {roleToManage === 'CUSTOMER' && !onAddCustomer && (
        <NewCustomerModal
          isOpen={isNewCustomerModalOpen}
          onClose={() => setIsNewCustomerModalOpen(false)}
          onCustomerCreated={(newCust) => {
            setIsNewCustomerModalOpen(false)
            if (onViewDetail) {
              onViewDetail(newCust)
            }
          }}
          onOpenExisting={(existingCust) => {
            setIsNewCustomerModalOpen(false)
            if (onViewDetail) {
              onViewDetail(existingCust)
            }
          }}
        />
      )}
    </div>
  )
}
