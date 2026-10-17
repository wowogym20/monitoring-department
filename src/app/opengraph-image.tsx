import { ImageResponse } from "next/og"
import fs from "fs"
import path from "path"

export const alt = "Dashboard Integrasi Tazakka"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  // Baca logo resmi Tazakka dari public/logo-tazakka.png
  let logoDataUrl = ""
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-tazakka.png")
    const logoBuffer = fs.readFileSync(logoPath)
    logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`
  } catch (err) {
    console.warn("Gagal membaca logo-tazakka.png untuk Open Graph:", err)
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#064e3b",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #047857 0%, transparent 50%), radial-gradient(circle at 80% 80%, #b45309 0%, transparent 50%)",
          fontFamily: "sans-serif",
          padding: "40px",
          color: "white",
          position: "relative",
        }}
      >
        {/* Border decorative frame */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            right: 24,
            bottom: 24,
            border: "2px solid rgba(255, 255, 255, 0.15)",
            borderRadius: 24,
            display: "flex",
          }}
        />

        {/* Logo Tazakka Resmi */}
        {logoDataUrl && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 110,
              height: 110,
              borderRadius: 24,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              padding: 10,
              marginBottom: 16,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              border: "2px solid rgba(16, 185, 129, 0.5)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoDataUrl}
              alt="Logo Tazakka"
              width={90}
              height={90}
              style={{ objectFit: "contain" }}
            />
          </div>
        )}

        {/* Institution Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            padding: "6px 20px",
            borderRadius: 9999,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            marginBottom: 20,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fde047">
            <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z" />
          </svg>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Pondok Modern Tazakka
          </span>
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: 58,
            fontWeight: 800,
            textAlign: "center",
            letterSpacing: "-0.02em",
            margin: "0 0 12px 0",
            maxWidth: 1000,
            lineHeight: 1.15,
            textShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          Dashboard Integrasi Tazakka
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 22,
            textAlign: "center",
            maxWidth: 880,
            margin: "0 0 28px 0",
            color: "#e2e8f0",
            lineHeight: 1.4,
            fontWeight: 400,
          }}
        >
          Portal Pemantauan Kinerja, Standarisasi Evaluasi, dan Pelaporan Terpadu Antar Departemen
        </p>

        {/* Features / Pillars */}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(4, 120, 87, 0.6)",
              padding: "8px 18px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              border: "1px solid rgba(16, 185, 129, 0.4)",
            }}
          >
            <span>Standarisasi Mutu</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(180, 83, 9, 0.6)",
              padding: "8px 18px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              border: "1px solid rgba(245, 158, 11, 0.4)",
            }}
          >
            <span>Penilaian Objektif</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(4, 120, 87, 0.6)",
              padding: "8px 18px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              border: "1px solid rgba(16, 185, 129, 0.4)",
            }}
          >
            <span>Akses PWA Lintas Perangkat</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
