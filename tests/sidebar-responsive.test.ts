import { describe, it, expect } from "vitest"
import {
  TABLET_PORTRAIT_QUERY,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_PREF_COOKIE,
} from "@/components/layout/sidebar-context"

describe("Sidebar Responsive Configuration & Tablet Portrait Overlay", () => {
  it("harus menggunakan query CSS media spesifik tablet portrait (768px - 1024px, portrait)", () => {
    expect(TABLET_PORTRAIT_QUERY).toBe(
      "(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)"
    )
  })

  it("harus mengekspor nama cookie state sidebar yang valid", () => {
    expect(SIDEBAR_COOKIE_NAME).toBe("sidebar_state")
    expect(SIDEBAR_PREF_COOKIE).toBe("sidebar_custom_pref")
  })
})
