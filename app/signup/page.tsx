import { signup } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import { SignUpSubmitButton } from '@/components/auth/SignUpSubmitButton'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center mb-1 group">
            <div className="h-20 w-20 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] p-1 shadow-[0_6px_24px_rgba(0,0,0,0.08)] group-hover:scale-105 transition-transform overflow-hidden flex items-center justify-center">
              <Image
                src="/logo-hq.png"
                alt="SuperMarket Logo"
                width={80}
                height={80}
                priority
                className="h-full w-full object-contain"
              />
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
            Créer votre compte
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            Rejoignez le programme fidélité Super Market Calais et cumulez des points
          </p>
        </div>

        {/* Signup Form Card */}
        <Card className="p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[var(--color-border)]">
          <form action={signup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="first_name"
                name="first_name"
                type="text"
                label="Prénom"
                placeholder="Jean"
                required
                className="h-11"
              />
              <Input
                id="last_name"
                name="last_name"
                type="text"
                label="Nom"
                placeholder="Dupont"
                required
                className="h-11"
              />
            </div>

            <Input
              id="phone"
              name="phone"
              type="tel"
              label="Numéro de téléphone"
              placeholder="06 12 34 56 78"
              required
              className="h-11"
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Adresse email"
              placeholder="jean.dupont@example.com"
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

            <SignUpSubmitButton />

            <div className="pt-2 text-center border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)]">
                Déjà un compte ?{" "}
                <Link
                  href="/login"
                  className="font-bold text-[var(--color-primary)] hover:underline ml-1"
                >
                  Se connecter
                </Link>
              </p>
            </div>
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
