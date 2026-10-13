import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Jangan memproses jika environment variable belum dikonfigurasi
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { supabaseResponse, user: null, role: null }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options?: Record<string, unknown>
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof supabaseResponse.cookies.set>[2]
            )
          )
        },
      },
    }
  )

  // auth.getUser() memvalidasi token dan memperbarui sesi cookie
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 1. Jika belum login dan mengakses rute terlindungi
  const isAuthRoute = pathname === "/login"
  const isPublicRoute = isAuthRoute || pathname === "/"

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return { supabaseResponse: NextResponse.redirect(url), user: null, role: null }
  }

  // 2. Jika sudah login dan mengakses /login atau /
  if (user && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.searchParams.delete("redirect")
    return { supabaseResponse: NextResponse.redirect(url), user, role: null }
  }

  // 3. Verifikasi role pengguna untuk otorisasi rute
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single()

    const role = profile?.role || "user"
    const isActive = profile?.is_active ?? true

    if (!isActive) {
      // Akun dinonaktifkan
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("error", "Akun Anda telah dinonaktifkan.")
      return { supabaseResponse: NextResponse.redirect(url), user: null, role: null }
    }

    // Role-based route guard:
    // /ketua dan /aspek: hanya super_admin
    if (
      (pathname.startsWith("/ketua") || pathname.startsWith("/aspek")) &&
      role !== "super_admin"
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return { supabaseResponse: NextResponse.redirect(url), user, role }
    }

    // /departemen, /periode, /ekspor: super_admin dan admin
    if (
      (pathname.startsWith("/departemen") ||
        pathname.startsWith("/periode") ||
        pathname.startsWith("/ekspor")) &&
      role === "user"
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return { supabaseResponse: NextResponse.redirect(url), user, role }
    }

    return { supabaseResponse, user, role }
  }

  return { supabaseResponse, user: null, role: null }
}
