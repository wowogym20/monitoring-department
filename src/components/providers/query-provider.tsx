"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 3 * 60 * 1000, // 3 menit
        gcTime: 10 * 60 * 1000,    // 10 menit
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: reuse client across renders
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

/**
 * Membersihkan seluruh cache TanStack Query dan penyimpanan lokal (localStorage)
 * yang terkait data pengguna. Dipanggil saat logout untuk menjamin tidak ada
 * kebocoran data sensitif antar sesi di perangkat yang sama.
 */
export function clearAppClientCache() {
  if (browserQueryClient) {
    browserQueryClient.clear()
  }

  if (typeof localStorage !== "undefined") {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("tazakka_qc_")) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    } catch (e) {
      console.warn("Gagal membersihkan cache lokal:", e)
    }
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
