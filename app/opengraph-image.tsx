import { ImageResponse } from "next/og";

import { env } from "@/lib/env";

export const alt = env.brandName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse cannot read CSS variables, so these repeat the light theme's
// values from app/globals.css.
const BACKGROUND = "#fdfdfb";
const FOREGROUND = "#333333";
const MUTED_FOREGROUND = "#66655f";
const STONE = "#e8e6dd";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          gap: 32,
          background: BACKGROUND,
          color: FOREGROUND,
        }}
      >
        <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: 12, textTransform: "uppercase" }}>
          {env.brandName}
        </div>
        <div style={{ fontSize: 40, color: MUTED_FOREGROUND }}>
          Skincare, makeup and fragrance, delivered across Nepal.
        </div>
        <div style={{ display: "flex", width: 560, height: 16, marginTop: 24, background: STONE }} />
      </div>
    ),
    size,
  );
}
