export interface DemoPolicy {
  slug: string
  title: string
  paragraphs: string[]
}

/** Fiction for a fictional store: no real store's terms, and nothing a shopper can rely on. */
export const DEMO_POLICIES: DemoPolicy[] = [
  {
    slug: "terms",
    title: "Example terms",
    paragraphs: [
      "Casa Exemplo is a made-up store, so nothing here is for sale and no contract can be formed.",
      "A real store would say here who runs it, how an order becomes a sale, and which law applies.",
    ],
  },
  {
    slug: "privacy",
    title: "Example privacy notice",
    paragraphs: [
      "This demo takes no orders. Anything you type at checkout stays in this browser tab.",
      "A real store would say here what it collects, why, how long it keeps it, and how to ask for it to be deleted.",
    ],
  },
  {
    slug: "returns",
    title: "Example returns policy",
    paragraphs: [
      "Nothing ships from Casa Exemplo, so there's nothing to return.",
      "A real store would say here how long you have to send something back, who pays for it, and when the refund arrives.",
    ],
  },
]
