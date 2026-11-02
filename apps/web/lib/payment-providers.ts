export const paymentProviders = [
  {
    id: "stripe",
    pricingUrl: "https://stripe.com/en-pt/pricing",
    pricingAction: "See Stripe's pricing",
    name: "Stripe",
    region: "International",
    methods: "Cards, plus Apple Pay and Google Pay where you've enabled them",
    summary: "Cards, plus Apple Pay and Google Pay where you've enabled them in Stripe and registered the checkout domain.",
  },
  {
    id: "easypay",
    pricingUrl: "https://www.easypay.pt/precos",
    pricingAction: "Ask Easypay for a proposal",
    name: "Easypay",
    region: "Portugal",
    methods: "Multibanco, MB WAY, Card",
    summary: "Multibanco references, MB WAY and cards through your Easypay account.",
  },
  {
    id: "ifthenpay",
    pricingUrl: "https://ifthenpay.com/?lang=en#pricing",
    pricingAction: "See Ifthenpay's pricing",
    name: "Ifthenpay",
    region: "Portugal",
    methods: "Multibanco, MB WAY, Card",
    summary: "Multibanco, MB WAY and cards through Ifthenpay, if that's where your account is.",
  },
] as const
