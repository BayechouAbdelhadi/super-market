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
  const isCustomersRoute = request.nextUrl.pathname.startsWith('/customers')

  const isStaffRoute = isAdminRoute || isCashierRoute || isLoyaltyRoute || isCustomersRoute

  if (!user && isStaffRoute) {
    console.log(`[Middleware] Blocked unauthenticated access to ${request.nextUrl.pathname} -> Redirecting to /login`)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = user.user_metadata?.role || 'CUSTOMER'
    
    // Redirect authenticated staff users away from login
    if (isAuthRoute) {
      if (role === 'ADMIN') {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        console.log(`[Middleware] Authenticated ADMIN trying to access login -> Redirecting to /admin`)
        return NextResponse.redirect(url)
      }
      if (role === 'CASHIER') {
        const url = request.nextUrl.clone()
        url.pathname = '/cashier'
        console.log(`[Middleware] Authenticated CASHIER trying to access login -> Redirecting to /cashier`)
        return NextResponse.redirect(url)
      }
      // CUSTOMER role is allowed to stay on /login so they can log in as staff
    }

    // Protect Admin routes — only ADMIN can access
    if (isAdminRoute && role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'CASHIER' ? '/cashier' : '/login'
      console.warn(`[Middleware] User (${role}) attempted to access ADMIN route ${request.nextUrl.pathname} -> Redirecting to ${url.pathname}`)
      return NextResponse.redirect(url)
    }

    // Protect Cashier/Staff routes — only CASHIER and ADMIN can access
    if (isStaffRoute && role !== 'CASHIER' && role !== 'ADMIN') {
      console.warn(`[Middleware] User (${role}) attempted to access staff route ${request.nextUrl.pathname} -> Redirecting to /login`)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
