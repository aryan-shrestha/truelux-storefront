import { ImageResponse } from "next/og";

import { env } from "@/lib/env";

export const alt = env.brandName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse cannot read CSS variables, so these repeat the ink and gold
// values from app/globals.css: the card is the logo's green and gold.
const INK = "#143532";
const GOLD = "#ebba65";
const INK_MUTED = "#a9bcb5";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 96,
        gap: 32,
        background: INK,
        color: GOLD,
      }}
    >
      <div
        style={{ fontSize: 104, fontWeight: 700, letterSpacing: 12, textTransform: "uppercase" }}
      >
        {env.brandName}
      </div>
      <div style={{ fontSize: 40, color: INK_MUTED }}>
        Skincare, makeup and fragrance, delivered across Nepal.
      </div>
      <div style={{ display: "flex", width: 560, height: 16, marginTop: 24, background: GOLD }} />
    </div>,
    size,
  );
}
