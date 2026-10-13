import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get("path")

  if (!path) {
    return new NextResponse("Path avatar tidak ditemukan", { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // Unduh objek avatar dari bucket privat
  const { data, error } = await supabase.storage.from("avatars").download(path)

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
