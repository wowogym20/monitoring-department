import "server-only"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"

/**
 * Supabase Admin Client menggunakan SUPABASE_SERVICE_ROLE_KEY.
 * HANYA digunakan pada Server Action atau Route Handler untuk operasi administratif
 * yang memerlukan bypass RLS atau hak akses auth.admin (seperti pembuatan akun auth).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) belum dikonfigurasi."
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
