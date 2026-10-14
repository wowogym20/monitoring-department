import { createClient } from "@/lib/supabase/server"
import { HeroLanding } from "@/components/home/hero-landing"

export default async function HomePage() {
  let isLoggedIn = false
  let userEmail: string | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      isLoggedIn = true
      userEmail = user.email || null
    }
  } catch {
    isLoggedIn = false
  }

  return <HeroLanding isLoggedIn={isLoggedIn} userEmail={userEmail} />
}
