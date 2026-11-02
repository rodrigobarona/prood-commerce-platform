import { Container } from "@/components/layout/container"

/** A store with no photographs yet: its name and what it sells, so the products start in the first fold. */
export function StoreIntro({ name, description }: { name: string; description: string }) {
  return (
    <section className="bg-muted">
      <Container className="flex flex-col gap-3 py-10 md:py-14">
        <h1 className="text-display-md text-balance">{name}</h1>
        <p className="text-lead text-muted-foreground max-w-2xl text-pretty">{description}</p>
      </Container>
    </section>
  )
}
