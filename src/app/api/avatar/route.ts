import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const avatarPathSchema = z
  .string()
  .min(1, "Path avatar wajib diisi")
  .regex(/^[a-zA-Z0-9_\-\.\/]+$/, "Format path avatar tidak valid")
  .refine((p) => !p.includes(".."), "Path traversal tidak diizinkan")

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parseResult = avatarPathSchema.safeParse(searchParams.get("path"))

  if (!parseResult.success) {
    return new NextResponse(parseResult.error.errors[0]?.message || "Path avatar tidak valid", {
      status: 400,
    })
  }

  const path = parseResult.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // Unduh objek avatar dari bucket privat menggunakan adminClient
  // agar role user tidak terhambat oleh keterbatasan RLS Supabase Storage
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.storage.from("avatars").download(path)

  if (error || !data) {
    return new NextResponse("Avatar tidak ditemukan", { status: 404 })
  }

  const arrayBuffer = await data.arrayBuffer()
  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": data.type || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  })
}
