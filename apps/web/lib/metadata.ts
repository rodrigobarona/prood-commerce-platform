import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"

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
    },
    twitter: { card: "summary_large_image", title: socialTitle, description },
  }
}
