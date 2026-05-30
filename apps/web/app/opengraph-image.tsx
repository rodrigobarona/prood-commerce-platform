import { ImageResponse } from "next/og"

import { heroCopy, siteConfig } from "@/lib/site"

export const alt = siteConfig.tagline
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#fafafa",
          color: "#0a0a0a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#16a34a",
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 52,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          {heroCopy.title} {heroCopy.titleAccent}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 22,
            lineHeight: 1.5,
            color: "rgba(10, 10, 10, 0.65)",
            maxWidth: 820,
          }}
        >
          {`yourname.${siteConfig.storeDomain} on Free · Admin at ${siteConfig.platformHosts.dashboard} · 0% Prood fee on sales`}
        </div>
      </div>
    ),
    { ...size }
  )
}
