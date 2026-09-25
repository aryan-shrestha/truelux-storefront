import { ImageResponse } from "next/og";

import { env } from "@/lib/env";

export const alt = env.brandName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse cannot read CSS variables, so these repeat the light theme's
// values from app/globals.css.
const IVORY = "#faf6f1";
const ESPRESSO = "#2b1d17";
const ROSE = "#8e5a52";
const SHADES = ["#f3dcc8", "#e9c6a8", "#dcb08c", "#c99571", "#ae7a56", "#8c5c3e", "#6b432c", "#4a2e1f"];

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
          background: IVORY,
          color: ESPRESSO,
        }}
      >
        <div style={{ fontSize: 112, fontFamily: "serif" }}>{env.brandName}</div>
        <div style={{ fontSize: 40, color: ROSE }}>
          Skincare, makeup and fragrance, delivered across Nepal.
        </div>
        <div style={{ display: "flex", width: 560, height: 20, marginTop: 24 }}>
          {SHADES.map((shade) => (
            <div key={shade} style={{ flex: 1, background: shade }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
