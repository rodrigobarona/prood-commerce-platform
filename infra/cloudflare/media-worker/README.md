# prood-media Worker

Read-only delivery for the `prood-public` R2 bucket. It answers GET and HEAD
with Range and conditional requests, and it never lists keys.

Live at `https://prood-media.rbarona.workers.dev`, which is the value of
`S3_PUBLIC_URL` in production. `prood.app` DNS is on Vercel and `prood.com`
isn't on this Cloudflare account, so a custom domain isn't available yet. To
move later, change `S3_PUBLIC_URL`, rebuild, and rewrite stored image URLs.

Deploy with `npx wrangler deploy` from this folder.

Responses are cached for a day unless the object sets `Cache-Control`, so a
deleted object can stay reachable for up to 24 hours.
