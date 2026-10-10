import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.error(`[Middleware] Supabase Auth Error on ${request.nextUrl.pathname}:`, userError.message)
  }

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/reset-password') ||
    request.nextUrl.pathname.startsWith('/auth/callback')
  const isPublicAuthEntry =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/forgot-password')
  const isAccountRoute = request.nextUrl.pathname === '/account' || request.nextUrl.pathname.startsWith('/account/')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isCashierRoute = request.nextUrl.pathname.startsWith('/cashier')
  const isLoyaltyRoute = request.nextUrl.pathname.startsWith('/loyalty')
  const isCustomersRoute = request.nextUrl.pathname.startsWith('/customers')
  const isApiAdminRoute = request.nextUrl.pathname.startsWith('/api/admin')
  const isApiLoyaltyRoute = request.nextUrl.pathname.startsWith('/api/loyalty')

  // Defense-in-depth: Block unauthenticated API calls immediately
  if (!user && (isApiAdminRoute || isApiLoyaltyRoute)) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentification requise." },
      { status: 401 }
    )
  }

  const isStaffRoute = isAdminRoute || isCashierRoute || isLoyaltyRoute || isCustomersRoute

  if (!user && (isStaffRoute || isAccountRoute)) {
    console.log(`[Middleware] Blocked unauthenticated access to ${request.nextUrl.pathname} -> Redirecting to /login`)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = user.user_metadata?.role || 'CUSTOMER'
    
    // Redirect authenticated users from login / signup to their appropriate dashboard
    // Keep users on /reset-password so they can set their new password
    if (isPublicAuthEntry) {
      if (role === 'ADMIN') {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
      if (role === 'CASHIER') {
        const url = request.nextUrl.clone()
        url.pathname = '/cashier'
        return NextResponse.redirect(url)
      }
      if (role === 'CUSTOMER') {
        const url = request.nextUrl.clone()
        url.pathname = '/account'
        return NextResponse.redirect(url)
      }
    }

    if (isAccountRoute) {
      if (role === 'ADMIN') {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
      if (role === 'CASHIER') {
        const url = request.nextUrl.clone()
        url.pathname = '/cashier'
        return NextResponse.redirect(url)
      }
      // CUSTOMER is allowed to access /account
    }

    // Protect Admin routes — only ADMIN can access
    if (isAdminRoute && role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'CASHIER' ? '/cashier' : '/account'
      return NextResponse.redirect(url)
    }

    // Protect Cashier/Staff routes — only CASHIER and ADMIN can access
    if (isStaffRoute && role !== 'CASHIER' && role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/account'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
