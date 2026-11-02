import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"

/** A page's own `openGraph` and `twitter` replace the root's, images included. */
const socialImage = { url: "/opengraph-image", width: 1200, height: 630, alt: "Prood: open your store, keep the keys" }

/** Per-page metadata with canonical URL and matching Open Graph/Twitter fields. */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title?: string
  description: string
  path: `/${string}`
}): Metadata {
  const socialTitle = title ? `${title} · ${siteConfig.name}` : siteConfig.title
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      url: path,
      title: socialTitle,
      description,
      images: [socialImage],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [socialImage] },
  }
}
