import { login } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import { LoginSubmitButton } from '@/components/auth/LoginSubmitButton'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const params = await searchParams
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center mb-1 group">
            <div className="h-14 w-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-transform overflow-hidden">
              <Image
                src="/logo.jpeg"
                alt="SuperMarket Logo"
                width={48}
                height={48}
                priority
                className="h-full w-full object-cover rounded-xl"
              />
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
            Espace SuperMarket
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            Accédez à la gestion de caisse et au programme fidélité
          </p>
        </div>
        
        {/* Login Form Card */}
        <Card className="p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[var(--color-border)]">
          <form action={login} className="space-y-5">
            <Input
              id="email"
              name="email"
              type="email"
              label="Adresse email"
              placeholder="admin@supermarket.local"
              required
              className="h-11"
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              required
              className="h-11"
            />
            
            {params?.message && (
              <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 text-center bg-rose-500/10 border border-rose-500/20 p-3 rounded-[var(--radius-button,12px)]">
                {params.message}
              </div>
            )}
            
            <LoginSubmitButton />
          </form>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Retour au site public</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
