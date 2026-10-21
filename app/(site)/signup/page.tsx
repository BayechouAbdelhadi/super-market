import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { AuthShell } from '@/components/public/AuthShell'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { verifySignedToken, PENDING_SIGNUP_COOKIE } from '@/lib/email/otp-security'

export const metadata: Metadata = { title: 'Créer un compte', robots: PRIVATE_PAGE_ROBOTS };
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo/config";

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
    <AuthShell
      title="Créer votre compte"
      description="Rejoignez le programme fidélité gratuit et cumulez des points à chaque passage en caisse."
    >
      <SignUpForm initialMessage={params?.message} initialData={initialData} />
    </AuthShell>
  )
}
