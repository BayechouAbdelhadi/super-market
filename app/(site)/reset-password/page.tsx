import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { AuthShell } from '@/components/public/AuthShell'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { verifyPasswordResetToken } from '@/lib/email/otp-security'

export const metadata: Metadata = { title: 'Nouveau mot de passe', robots: PRIVATE_PAGE_ROBOTS };
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo/config";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string
    message?: string
    token?: string
  }>
}) {
  const params = await searchParams
  const token = params?.token?.trim() || ''

  // Decode cryptographically signed email strictly from token (not from browser cookies/session)
  const pendingData = token ? verifyPasswordResetToken(token) : null
  const targetEmail = pendingData?.email || params?.email?.trim() || ''

  return (
    <AuthShell
      icon={ShieldCheck}
      iconTone="success"
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe sûr pour accéder à votre compte."
    >
      <div className="space-y-5">
        {targetEmail && (
          <Alert variant="success">
            Lien vérifié pour <strong className="break-all">{targetEmail}</strong>
          </Alert>
        )}
        <ResetPasswordForm email={targetEmail} token={token} errorMessage={params?.message} />
      </div>
    </AuthShell>
  )
}
