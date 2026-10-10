import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Card } from '@/components/ui/card'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { verifySignedToken, PENDING_SIGNUP_COOKIE } from '@/lib/email/otp-security'

interface PendingSignUpPayload {
  first_name: string
  last_name: string
  email: string
  phone: string
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const pendingCookie = cookieStore.get(PENDING_SIGNUP_COOKIE)?.value
  const pendingData = pendingCookie ? verifySignedToken<PendingSignUpPayload>(pendingCookie) : null

  const initialData = pendingData
    ? {
        firstName: pendingData.first_name,
        lastName: pendingData.last_name,
        email: pendingData.email,
        phone: pendingData.phone,
      }
    : undefined

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col items-center bg-[var(--color-background)] p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md my-auto space-y-5 py-4 sm:py-6">
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
          <SignUpForm initialMessage={params?.message} initialData={initialData} />
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
