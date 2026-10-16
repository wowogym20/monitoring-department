"use client"

import * as React from "react"
import { useQueryClient, dehydrate, hydrate } from "@tanstack/react-query"

interface QueryPersisterProps {
  userId: string
  maxAgeMs?: number
}

const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000

/**
 * Komponen sinkronisasi persistensi cache TanStack Query ke localStorage.
 * Memastikan data tersimpan di browser per-user ID dan di-hydrate instan saat hard refresh (F5).
 * Mendukung structural sharing bawaan TanStack Query sehingga tidak memicu re-render atau layout shift.
 */
export function QueryPersister({
  userId,
  maxAgeMs = DEFAULT_MAX_AGE,
}: QueryPersisterProps) {
  const queryClient = useQueryClient()
  const storageKey = `tazakka_qc_${userId}`

  // 1. Hydrate dari localStorage saat pertama kali dimuat
  React.useEffect(() => {
    if (!userId || typeof window === "undefined") return

    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.timestamp && Date.now() - parsed.timestamp < maxAgeMs) {
          if (parsed?.clientState) {
            hydrate(queryClient, parsed.clientState)
          }
        } else {
          localStorage.removeItem(storageKey)
        }
      }
    } catch (err) {
      console.warn("Gagal menghidrasi cache dari localStorage:", err)
    }
  }, [queryClient, storageKey, userId, maxAgeMs])

  // 2. Berlangganan perubahan query cache dan simpan ke localStorage secara debounced
  React.useEffect(() => {
    if (!userId || typeof window === "undefined") return

    let timeoutId: NodeJS.Timeout | null = null

    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (timeoutId) clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        try {
          const dehydrated = dehydrate(queryClient, {
            shouldDehydrateQuery: (query) =>
              query.state.status === "success" &&
              Boolean(query.state.data),
          })

          localStorage.setItem(
            storageKey,
            JSON.stringify({
              timestamp: Date.now(),
              clientState: dehydrated,
            })
          )
        } catch (err) {
          console.warn("Gagal menyimpan cache query ke localStorage:", err)
        }
      }, 500)
    })

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [queryClient, storageKey, userId])

  return null
}
