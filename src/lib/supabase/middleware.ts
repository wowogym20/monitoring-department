import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Helper untuk membuat respons redirect yang aman dan anti-loop:
 * 1. Mencegah redirect jika tujuan sama persis dengan URL saat ini (mencegah loop tak terhingga).
 * 2. Menyalin semua cookie sesi yang telah diatur oleh Supabase ke respons redirect,
 *    sehingga status sesi di browser tetap sinkron dan tidak hilang saat redirect.
 */
function createSafeRedirect(
  targetUrl: URL,
  request: NextRequest,
  responseWithCookies: NextResponse
): NextResponse {
  // Guard Anti-Loop: jika target path dan query sama dengan saat ini, batalkan redirect
  if (
    targetUrl.pathname === request.nextUrl.pathname &&
    targetUrl.search === request.nextUrl.search
  ) {
    return responseWithCookies
  }

  const redirectResponse = NextResponse.redirect(targetUrl)

  // Salin seluruh cookies dari responseWithCookies ke redirectResponse
  responseWithCookies.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  return redirectResponse
}

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

  const pathname = request.nextUrl.pathname

  // Lewatkan request API auth langsung tanpa intervensi redirect
  if (pathname.startsWith("/api/auth")) {
    return { supabaseResponse, user: null, role: null }
  }

  // auth.getUser() memvalidasi token dan menyegarkan sesi cookie jika perlu
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/lupa-password" ||
    pathname === "/reset-password"

  // 1. KASUS: Pengguna BELUM login
  if (!user) {
    // Jika mengakses halaman root "/", arahkan ke /login (hanya sekali)
    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return {
        supabaseResponse: createSafeRedirect(url, request, supabaseResponse),
        user: null,
        role: null,
      }
    }

    // Jika mengakses rute terproteksi (seperti /dashboard), arahkan ke /login dengan parameter redirect
    if (!isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("redirect", pathname)
      return {
        supabaseResponse: createSafeRedirect(url, request, supabaseResponse),
        user: null,
        role: null,
      }
    }

    // Jika sudah di halaman auth (/login, /lupa-password), biarkan lewat
    return { supabaseResponse, user: null, role: null }
  }

  // 2. KASUS: Pengguna SUDAH login dan mengakses halaman auth atau root
  if (user && (isAuthRoute || pathname === "/") && pathname !== "/reset-password") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.searchParams.delete("redirect")
    url.searchParams.delete("error")
    return {
      supabaseResponse: createSafeRedirect(url, request, supabaseResponse),
      user,
      role: null,
    }
  }

  // 3. KASUS: Pengguna SUDAH login di rute terproteksi -> Cek Role & Status Akun
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single()

    const role = profile?.role || "user"
    const isActive = profile?.is_active ?? true

    if (!isActive) {
      // Akun dinonaktifkan: bersihkan sesi dan arahkan ke login
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("error", "Akun Anda telah dinonaktifkan.")
      return {
        supabaseResponse: createSafeRedirect(url, request, supabaseResponse),
        user: null,
        role: null,
      }
    }

    // Role-based route guard sesuai matriks PRD bagian 10:

    // A. Khusus Super Admin: /ketua
    if (pathname.startsWith("/ketua") && role !== "super_admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return {
        supabaseResponse: createSafeRedirect(url, request, supabaseResponse),
        user,
        role,
      }
    }

    // B. Super Admin & Admin: /aspek (Ketua / user ditolak)
    if (pathname.startsWith("/aspek") && role === "user") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return {
        supabaseResponse: createSafeRedirect(url, request, supabaseResponse),
        user,
        role,
      }
    }

    // B. Super Admin & Admin: /departemen, /periode, /ekspor (Ditolak untuk Ketua / user)
    if (
      (pathname.startsWith("/departemen") ||
        pathname.startsWith("/periode") ||
        pathname.startsWith("/ekspor")) &&
      role === "user"
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return {
        supabaseResponse: createSafeRedirect(url, request, supabaseResponse),
        user,
        role,
      }
    }

    // C. Form input penilaian anggota (/penilaian/[anggotaId]): Ditolak untuk Admin (SDM)
    const isPenilaianForm =
      pathname.startsWith("/penilaian/") && pathname !== "/penilaian"
    if (isPenilaianForm && role === "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/penilaian"
      return {
        supabaseResponse: createSafeRedirect(url, request, supabaseResponse),
        user,
        role,
      }
    }

    return { supabaseResponse, user, role }
  }

  return { supabaseResponse, user: null, role: null }
}
