"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getUnreadCommentsCountAction } from "@/lib/actions/rekap"

export const UNREAD_COMMENTS_QUERY_KEY = ["unread-comments-count"] as const

export function useUnreadComments(role?: string) {
  return useQuery({
    queryKey: UNREAD_COMMENTS_QUERY_KEY,
    queryFn: async () => {
      return await getUnreadCommentsCountAction()
    },
    enabled: role === "user",
    staleTime: 15 * 1000, // 15 detik
    refetchInterval: 30 * 1000, // polling halus setiap 30 detik
    refetchOnWindowFocus: true,
  })
}

export function useInvalidateUnreadComments() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: UNREAD_COMMENTS_QUERY_KEY })
  }
}
