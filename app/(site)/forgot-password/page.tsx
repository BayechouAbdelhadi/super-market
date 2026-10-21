import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { cn } from 'cn'
import { requestPasswordReset } from './actions'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { OtpSubmitButton } from '@/components/auth/OtpSubmitButton'
import { AuthShell, authLinkClass } from '@/components/public/AuthShell'

export const metadata: Metadata = { title: 'Mot de passe oublié', robots: PRIVATE_PAGE_ROBOTS };
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo/config";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; status?: string; email?: string }>
}) {
  const params = await searchParams
  const isSent = params?.status === 'sent'
  const emailSentTo = params?.email || ''

  if (isSent) {
    return (
      <AuthShell
        icon={MailCheck}
        iconTone="success"
        title="Email envoyé"
        description="Vérifiez votre boîte de réception pour réinitialiser votre mot de passe."
      >
        <div className="space-y-5">
          <p className="text-base leading-relaxed text-text">
            Nous venons d&apos;envoyer un lien à{' '}
            {emailSentTo ? <strong className="font-semibold break-all">{emailSentTo}</strong> : 'votre adresse'}.
          </p>
          <p className="text-sm leading-relaxed text-text-muted">
            Cliquez sur le bouton dans l&apos;email pour définir votre nouveau mot de passe. Le lien est valable
            pendant 1 heure. Pensez à regarder dans vos courriers indésirables.
          </p>
          <Link href="/login" className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}>
            <ArrowLeft />
            <span>Retour à la connexion</span>
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Entrez votre adresse email : nous vous envoyons un lien sécurisé pour en choisir un nouveau."
      footer={
        <Link href="/login" className={authLinkClass}>
          <ArrowLeft className="h-4 w-4" />
          <span>Retour à la connexion</span>
        </Link>
      }
    >
      <form action={requestPasswordReset} className="space-y-5">
        <Input
          id="email"
          name="email"
          type="email"
          label="Adresse email"
          placeholder="email@gmail.com"
          autoComplete="email"
          required
          autoFocus
        />
        {params?.message && <Alert variant="danger">{params.message}</Alert>}
        <OtpSubmitButton label="Envoyer le lien" />
      </form>
    </AuthShell>
  )
}
