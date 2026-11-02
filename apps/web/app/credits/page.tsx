import { mediaCredits } from "@prood/media"
import { Container, Eyebrow } from "@/components/marketing/section"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Photo and film credits",
  description: "The photographers and filmmakers whose work appears across Prood's sites and apps.",
  path: "/credits",
})

export default function CreditsPage() {
  return (
    <Container className="py-16 md:py-24">
      <Eyebrow>Credits</Eyebrow>
      <h1 className="mt-4 max-w-3xl text-display-md">The people behind the pictures.</h1>
      <p className="mt-6 max-w-2xl text-lead text-muted-foreground">
        The photographs and film across Prood&apos;s sites and apps come from Pexels. The people in them are not Prood
        customers and don&apos;t endorse Prood. Thank you to everyone whose work we use.
      </p>
      <ul className="mt-12 gap-x-8 space-y-3 sm:columns-2 lg:columns-4">
        {mediaCredits().map((person) => (
          <li key={person.url}>
            <a href={person.url} className="font-mono text-sm underline decoration-border decoration-2 underline-offset-4 hover:decoration-brand">
              {person.name}
            </a>
          </li>
        ))}
      </ul>
    </Container>
  )
}
