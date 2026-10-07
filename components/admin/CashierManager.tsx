'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { createCashier } from '@/app/admin/actions'

export function CashierManager({ initialCashiers }: { initialCashiers: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    
    const result = await createCashier(formData)
    
    if (result.error) {
      setError(result.error)
    } else {
      setSuccessMsg(`Caissier créé avec succès ! Le mot de passe temporaire est : ${result.password}`)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-[var(--color-text-muted)]">
          Gérez les accès caissiers de votre établissement.
        </p>
        <Button onClick={() => setIsOpen(true)}>+ Ajouter un caissier</Button>
      </div>

      <div className="space-y-4">
        {initialCashiers.map(c => (
          <div key={c.id} className="flex justify-between items-center p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
            <div>
              <p className="font-medium text-[var(--color-text)]">{c.first_name} {c.last_name}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{c.email}</p>
            </div>
            <div className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md">
              Actif
            </div>
          </div>
        ))}
        {initialCashiers.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            Aucun caissier pour le moment.
          </div>
        )}
      </div>

      <Modal 
        isOpen={isOpen} 
        onClose={() => { setIsOpen(false); setSuccessMsg(''); setError(''); }} 
        title="Ajouter un caissier"
      >
        <div className="p-6">
          {successMsg ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-[var(--radius-button,12px)] text-sm font-medium">
                {successMsg}
                <br /><br />
                <span className="text-xs text-green-600">Pensez à copier ce mot de passe, il ne sera plus affiché.</span>
              </div>
              <Button onClick={() => { setIsOpen(false); setSuccessMsg(''); }} className="w-full">Fermer</Button>
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              <Input id="first_name" name="first_name" label="Prénom" required />
              <Input id="last_name" name="last_name" label="Nom" required />
              <Input id="email" name="email" type="email" label="Adresse Email" required />
              
              {error && <p className="text-sm text-red-600 p-2 bg-red-50 rounded-md">{error}</p>}
              
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Création...' : 'Créer'}</Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  )
}
