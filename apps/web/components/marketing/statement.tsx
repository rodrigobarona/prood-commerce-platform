import { Container, Photo, StockNote } from "@/components/marketing/section"

export function Statement() {
  return (
    <section aria-labelledby="statement-title" className="pt-20 pb-20 md:pt-28 md:pb-32 lg:pt-36">
      <Container>
        <h2 id="statement-title" className="max-w-6xl text-display-lg">
          <span className="block">Your name over the door.</span>
          <span className="block">Your money in the till.</span>
        </h2>
        <figure className="relative mt-14 md:mt-20">
          <Photo
            slug="owner-blue-door"
            sizes="(min-width: 1344px) 1248px, (min-width: 640px) 100vw, 170vw"
            position="62% 78%"
            className="aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/8]"
          />
          <figcaption>
            <StockNote className="mt-5 sm:mt-3 sm:text-right" />
          </figcaption>
        </figure>
      </Container>
    </section>
  )
}
