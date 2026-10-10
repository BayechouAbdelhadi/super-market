'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function ResetPasswordHashHandler() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // If URL contains hash with access_token (Supabase Implicit flow)
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken) {
        import('@/lib/supabase/client').then(({ supabase }) => {
          supabase.auth
            .setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            })
            .then(({ error }) => {
              if (!error) {
                // Clear the hash from URL cleanly without reload
                window.history.replaceState(null, '', window.location.pathname + window.location.search)
                router.refresh()
              }
            })
        })
      }
    }
  }, [router])

  return null
}
