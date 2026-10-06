import { login } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const params = await searchParams
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">SuperMarket</h1>
          <p className="text-[var(--color-text-muted)]">Connectez-vous à votre espace</p>
        </div>
        
        <Card className="p-8">
          <form className="space-y-6">
            <Input
              id="email"
              name="email"
              type="email"
              label="Adresse email"
              placeholder="admin@supermarket.local"
              required
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              required
            />
            
            {params?.message && (
              <p className="text-sm text-[var(--color-danger)] text-center bg-red-50 p-2 rounded-md">
                {params.message}
              </p>
            )}
            
            <Button formAction={login} className="w-full">
              Se connecter
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
