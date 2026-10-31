export const paymentProviders = [
  {
    id: "stripe",
    name: "Stripe",
    region: "Worldwide",
    methods: ["Cards", "Apple Pay", "Google Pay"],
    summary: "Cards everywhere, plus express checkout with Apple Pay and Google Pay.",
  },
  {
    id: "easypay",
    name: "Easypay",
    region: "Portugal",
    methods: ["Multibanco", "MB WAY"],
    summary: "Multibanco references and MB WAY, the way most Portuguese shoppers pay.",
  },
  {
    id: "ifthenpay",
    name: "Ifthenpay",
    region: "Portugal",
    methods: ["Multibanco", "MB WAY"],
    summary: "Multibanco and MB WAY through Ifthenpay, if that's where your account is.",
  },
] as const
