import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/**
 * Route Handler: /api/keep-alive
 * 
 * Bertujuan untuk melakukan aktivitas database minimal (query SELECT 1 baris)
 * secara berkala via Vercel Cron Job agar proyek Supabase gratis tidak terkena auto-pause.
 */
export async function GET(request: Request) {
  // 1. Verifikasi keamanan CRON_SECRET jika dikonfigurasi di environment
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Token CRON_SECRET tidak valid atau tidak disertakan.",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    )
  }

  const startTime = Date.now()

  try {
    // 2. Jalankan query baca (SELECT) sangat ringan menggunakan admin client
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("departments")
      .select("id")
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[Keep-Alive Error] Gagal melakukan query ke Supabase:", error.message)
      return NextResponse.json(
        {
          success: false,
          error: "Gagal terhubung ke database: " + error.message,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      )
    }

    const latencyMs = Date.now() - startTime

    // 3. Kembalikan respons berhasil beserta metrik latensi
    return NextResponse.json(
      {
        success: true,
        message: "Supabase keep-alive ping successful.",
        timestamp: new Date().toISOString(),
        latencyMs,
        recordFound: Boolean(data),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan sistem internal."
    console.error("[Keep-Alive Exception]:", errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    )
  }
}
