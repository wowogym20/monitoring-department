"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  loginSchema,
  updateProfileSchema,
  updatePasswordSchema,
  LoginInput,
  UpdateProfileInput,
  UpdatePasswordInput,
} from "@/lib/validations/auth"

export async function loginAction(input: LoginInput) {
  const parseResult = loginSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Input tidak valid",
    }
  }

  const { email, password } = parseResult.data
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

  revalidatePath("/", "layout")
  return { success: true }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
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

  const { nama, no_hp } = parseResult.data

  const { error } = await supabase
    .from("profiles")
    .update({
      nama,
      no_hp: no_hp || null,
      updated_at: new Date().toISOString(),
    })
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
