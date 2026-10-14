import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { HeroLanding } from "@/components/home/hero-landing"

export default async function HomePage() {
  let isLoggedIn = false
  let userEmail: string | null = null

  try {
    const cookieStore = await cookies()
    const hasAuthToken = cookieStore.getAll().some(
      (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
    )

    if (hasAuthToken) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        isLoggedIn = true
        userEmail = user.email || null
      }
    }
  } catch {
    isLoggedIn = false
  }

  return <HeroLanding isLoggedIn={isLoggedIn} userEmail={userEmail} />
}
