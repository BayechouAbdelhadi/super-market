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

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isCashierRoute = request.nextUrl.pathname.startsWith('/cashier')
  const isLoyaltyRoute = request.nextUrl.pathname.startsWith('/loyalty')

  const isProtectedRoute = isAdminRoute || isCashierRoute || isLoyaltyRoute

  if (!user && isProtectedRoute) {
    console.log(`[Middleware] Blocked unauthenticated access to ${request.nextUrl.pathname} -> Redirecting to /login`)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = user.user_metadata?.role || 'CUSTOMER'
    
    // Redirect authenticated users away from login
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = role === 'ADMIN' ? '/admin' : '/cashier'
      console.log(`[Middleware] Authenticated user (${role}) trying to access login -> Redirecting to ${url.pathname}`)
      return NextResponse.redirect(url)
    }

    // Protect Admin routes
    if (isAdminRoute && role !== 'ADMIN') {
      console.warn(`[Middleware] User (${role}) attempted to access ADMIN route ${request.nextUrl.pathname} -> Redirecting to /cashier`)
      const url = request.nextUrl.clone()
      url.pathname = '/cashier'
      return NextResponse.redirect(url)
    }

    // Protect Cashier/Loyalty routes — only CASHIER and ADMIN can access
    if ((isCashierRoute || isLoyaltyRoute) && role !== 'CASHIER' && role !== 'ADMIN') {
      console.warn(`[Middleware] User (${role}) attempted to access Cashier route ${request.nextUrl.pathname} -> Redirecting to /login`)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
