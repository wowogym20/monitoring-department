import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dashboard Integrasi Tazakka",
    short_name: "Tazakka Integrasi",
    description:
      "Portal terintegrasi pemantauan kinerja, standarisasi penilaian, dan pelaporan seluruh departemen di lingkungan Pondok Modern Tazakka.",
    start_url: "/",
    display: "standalone",
    background_color: "#047857",
    theme_color: "#047857",
    orientation: "portrait-primary",
    scope: "/",
    id: "/",
    categories: ["productivity", "education", "business"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
