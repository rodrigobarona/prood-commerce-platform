import {
  GlobeSimpleIcon,
  KeyIcon,
  PackageIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  TagIcon,
  UserListIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"

import { Section, SectionHeading } from "@/components/marketing/section"

const features = [
  {
    icon: PackageIcon,
    title: "Catalog",
    body: "Products with variants, categories and stock levels.",
  },
  {
    icon: ShoppingCartIcon,
    title: "Cart and checkout",
    body: "Hosted checkout pages with cards, wallets and Portuguese local methods.",
  },
  {
    icon: ReceiptIcon,
    title: "Orders",
    body: "Payment, fulfillment and status history on every order. Fulfill, cancel or refund.",
  },
  {
    icon: UserListIcon,
    title: "Customers",
    body: "Every customer with their order history.",
  },
  {
    icon: TagIcon,
    title: "Coupons",
    body: "Discount codes your customers apply at checkout.",
  },
  {
    icon: GlobeSimpleIcon,
    title: "Custom domains",
    body: "Add your domain and we provision it, HTTPS included.",
  },
  {
    icon: UsersThreeIcon,
    title: "Team",
    body: "Invite teammates by email. Everyone signs in with their own account.",
  },
  {
    icon: KeyIcon,
    title: "API keys",
    body: "Keys per organization for your own scripts and integrations.",
  },
] as const

export function Features() {
  return (
    <Section id="features" labelledBy="features-title">
      <SectionHeading
        id="features-title"
        eyebrow="What you get"
        title="Everything a store needs on day one."
        description="The essentials are built in and work together, on every plan."
      />
      <ul className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, body }) => (
          <li key={title} className="border-t border-border pt-5">
            <Icon className="size-6 text-foreground" aria-hidden />
            <h3 className="mt-4 font-sans text-base font-semibold">{title}</h3>
            <p className="mt-2 text-[0.9375rem] leading-6 text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
