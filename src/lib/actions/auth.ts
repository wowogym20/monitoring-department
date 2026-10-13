"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  loginSchema,
  updateProfileSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  LoginInput,
  UpdateProfileInput,
  UpdatePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/lib/validations/auth"
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit"

export async function loginAction(input: LoginInput) {
  const parseResult = loginSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Input tidak valid",
    }
  }

  const { email, password } = parseResult.data

  // Rate limiting sederhana di sisi server (maksimal 5 percobaan per menit per email)
  const headerList = await headers()
  const clientIp = headerList.get("x-forwarded-for") || "unknown"
  const rateLimitKey = `login:${email.toLowerCase()}:${clientIp}`
  const limitStatus = checkRateLimit(rateLimitKey, 5, 60 * 1000)

  if (!limitStatus.allowed) {
    return {
      success: false,
      error: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${limitStatus.retryAfterSeconds} detik.`,
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    let errorMessage = "Email atau password salah."
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Email atau password yang Anda masukkan salah."
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Email Anda belum diverifikasi."
    }
    return {
      success: false,
      error: errorMessage,
    }
  }

  // Bersihkan catatan rate limit jika berhasil login
  resetRateLimit(rateLimitKey)

  revalidatePath("/", "layout")
  return { success: true }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}

export async function forgotPasswordAction(input: ForgotPasswordInput) {
  const parseResult = forgotPasswordSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Input email tidak valid",
    }
  }

  const { email } = parseResult.data
  const headerList = await headers()
  const origin = headerList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  })

  if (error) {
    return {
      success: false,
      error: "Gagal mengirim tautan reset password: " + error.message,
    }
  }

  return {
    success: true,
    message: "Tautan reset password telah dikirim ke email Anda. Silakan periksa kotak masuk atau spam.",
  }
}

export async function resetPasswordAction(input: ResetPasswordInput) {
  const parseResult = resetPasswordSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Input tidak valid",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: "Sesi reset password tidak valid atau telah kedaluwarsa. Silakan ajukan reset kembali.",
    }
  }

  const { passwordBaru } = parseResult.data
  const { error } = await supabase.auth.updateUser({
    password: passwordBaru,
  })

  if (error) {
    return {
      success: false,
      error: "Gagal memperbarui password: " + error.message,
    }
  }

  return {
    success: true,
    message: "Password Anda berhasil diperbarui. Silakan login kembali.",
  }
}

export async function updateProfileAction(input: UpdateProfileInput) {
  const parseResult = updateProfileSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Input tidak valid",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: "Anda belum login. Silakan login kembali.",
    }
  }

  const { nama, no_hp, foto_url } = parseResult.data

  const updateData: Record<string, unknown> = {
    nama,
    no_hp: no_hp || null,
    updated_at: new Date().toISOString(),
  }

  if (foto_url !== undefined) {
    updateData.foto_url = foto_url || null
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)

  if (error) {
    return {
      success: false,
      error: "Gagal memperbarui profil: " + error.message,
    }
  }

  revalidatePath("/profil")
  revalidatePath("/dashboard", "layout")
  return {
    success: true,
    message: "Profil berhasil diperbarui.",
  }
}

export async function updatePasswordAction(input: UpdatePasswordInput) {
  const parseResult = updatePasswordSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Input tidak valid",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: "Anda belum login. Silakan login kembali.",
    }
  }

  const { passwordBaru } = parseResult.data

  const { error } = await supabase.auth.updateUser({
    password: passwordBaru,
  })

  if (error) {
    return {
      success: false,
      error: "Gagal memperbarui password: " + error.message,
    }
  }

  return {
    success: true,
    message: "Password berhasil diperbarui.",
  }
}
