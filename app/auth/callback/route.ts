import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/reset-password'

  const redirectTo = new URL(next, request.url)
  let response = NextResponse.redirect(redirectTo)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[Auth Callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(
        new URL(
          `/reset-password?message=${encodeURIComponent("Lien de réinitialisation expiré ou invalide.")}`,
          request.url
        )
      )
    }
  } else if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: (type as any) || 'recovery',
    })
    if (error) {
      console.error('[Auth Callback] verifyOtp error:', error.message)
      return NextResponse.redirect(
        new URL(
          `/reset-password?message=${encodeURIComponent("Lien de réinitialisation expiré ou invalide.")}`,
          request.url
        )
      )
    }
  }

  return response
}
