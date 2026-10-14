import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://monitoring.tazakka.or.id"

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/lupa-password"],
        disallow: [
          "/dashboard",
          "/anggota",
          "/penilaian",
          "/rekap",
          "/departemen",
          "/ketua",
          "/periode",
          "/aspek",
          "/profil",
          "/ekspor",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
