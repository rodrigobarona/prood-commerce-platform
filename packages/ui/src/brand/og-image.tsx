import { brandColors } from "@prood/ui/brand/colors"
import {
  lockup,
  markGlyphPaths,
  markRadius,
  markSize,
  wordmarkPaths,
} from "@prood/ui/brand/geometry"

export const ogImageSize = { width: 1200, height: 630 } as const

type OgImageProps = {
  /** Pass an array to control line breaks; Satori has no balanced wrapping. */
  title: string | string[]
  description?: string
  /** Product surface after the logo, e.g. "Docs" or "Dashboard". */
  label?: string
  /** Host shown in the footer, e.g. "prood.com". */
  host: string
}

/**
 * Branded 1200 × 630 card for `next/og` ImageResponse. Inline styles only:
 * ImageResponse renders with Satori, which does not read CSS variables.
 */
export function OgImage({ title, description, label, host }: OgImageProps) {
  const { ink, paper, telha, telhaLight, paperMuted, line } = brandColors

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: ink,
        color: paper,
        position: "relative",
      }}
    >
      <svg
        width="560"
        height="560"
        viewBox="0 0 24 24"
        style={{ position: "absolute", right: -150, top: 140 }}
      >
        <circle cx="12" cy="12" r="9.25" fill="none" stroke={line} strokeWidth="5.5" />
      </svg>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <svg width={214} height={64} viewBox={`0 0 ${lockup.width} ${lockup.height}`}>
          <rect width={markSize} height={markSize} rx={markRadius} fill={telha} />
          {markGlyphPaths.map((d) => (
            <path key={d} d={d} fill={paper} fillRule="evenodd" />
          ))}
          <g
            transform={`translate(${lockup.wordmarkX} ${lockup.wordmarkY}) scale(${lockup.wordmarkScale})`}
          >
            {wordmarkPaths.map((d) => (
              <path key={d} d={d} fill={paper} fillRule="evenodd" />
            ))}
          </g>
        </svg>
        {label ? (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: paperMuted,
              borderLeft: `2px solid ${line}`,
              paddingLeft: 24,
            }}
          >
            {label}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {(Array.isArray(title) ? title : [title]).map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        {description ? (
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              lineHeight: 1.4,
              color: paperMuted,
              maxWidth: 820,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26 }}>
        <div style={{ width: 40, height: 8, borderRadius: 4, background: telhaLight }} />
        <div style={{ color: paper }}>{host}</div>
      </div>
    </div>
  )
}

/** App icon (favicon/apple-icon) as an ImageResponse element. */
export function MarkImage() {
  const { telha, paper } = brandColors
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${markSize} ${markSize}`}>
      <rect width={markSize} height={markSize} fill={telha} />
      {markGlyphPaths.map((d) => (
        <path key={d} d={d} fill={paper} fillRule="evenodd" />
      ))}
    </svg>
  )
}
