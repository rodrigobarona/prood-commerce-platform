# DPIA screening and DPO assessment

Whether Prood must carry out a data protection impact assessment (Art. 35 GDPR) or appoint a data protection officer (Art. 37). Both answers are no today, on the facts below. `/privacy` says Prood has no DPO. Counsel has not reviewed this yet.

Last reviewed: 2026-11-07.

---

## DPIA screening

Screened against the nine criteria in the Article 29 Working Party guidelines WP 248 rev.01 (endorsed by the EDPB). Those guidelines say a DPIA is generally needed where two or more criteria are met. The screening covers Prood as controller and, as a courtesy to merchants, Prood's platform as processor.

| Criterion | Met? | Reason |
|---|---|---|
| Evaluation or scoring | No | No profiling (`/privacy`: "we do not build profiles") |
| Automated decisions with legal or similar effect | No | None. Rate limits and bans (`user.banned`) are applied by a person or by rule to accounts, not scored on behaviour |
| Systematic monitoring | No | Visit statistics load only after consent and Vercel reports totals only. `agent_event` records what a merchant's own agents did, not what anyone did in public. Session and rate-limit data is security processing |
| Sensitive or highly personal data | No, with a note | No special categories (DPA clause 3 forbids them). Orders carry contact details, addresses and Multibanco references. No card or bank details reach Prood: they go to the merchant's own payment provider |
| Large-scale processing | No, today | Prood is in an early stage, on a Free plan, with few or no paying merchants (`/terms`). **Unverified**: the number of live stores and shoppers is not recorded here. As a processor, the total across all stores is what counts, so this is the first criterion to cross |
| Matching or combining datasets | No, with a note | After email verification, guest customer rows with the same email in every store are linked to one shopper account (`autoLinkGuestCustomers`). The account holder controls the account and sees the result. Each store still sees only its own rows. Not a combination for a new purpose, but watch it |
| Vulnerable data subjects | No | Merchants are businesses. Shoppers are the public: a store can sell to anyone, but Prood does not target children or other vulnerable groups |
| Innovative technology | Partly | Agent Auth and the MCP server let third-party AI agents act on a store once a person approves them (`apps/api/lib/auth/server.ts`). Prood provides no AI model, stores no arguments or results, and the public catalog is the only default (`apps/api/lib/auth/agent-config.ts`). Counted as "partly" because the pattern is new |
| Blocks a right, service or contract | No | None |

**Count.** None fully met, two partly. Not enough for a mandatory DPIA.

**CNPD list.** Art. 35(4) lets each supervisory authority publish a list of operations that need a DPIA. The Portuguese list is CNPD Regulation 1/2018. Nothing in Prood's processing appears to fall on it. Counsel should check the current published wording (the number and date of the regulation are from memory: verify).

**Conclusion.** No DPIA is required. As a processor, Prood helps merchants with their own DPIAs (`/dpa`, "Helping with compliance").

**One thing to assess before shipping.** The self-service exports (account export and store export, ships with this change) produce a single file that holds a store's customers, addresses and orders. The file is a new place for personal data to leak from. In the working tree on 2026-11-07 the store export is limited to a signed-in owner or admin (an API key or an agent gets 403), is streamed with `Cache-Control: no-store` (`apps/api/app/api/store/export/route.ts`, `packages/auth/src/download.ts`), and is not logged: there is no record of who downloaded it. A stolen session could take a whole customer list in one request. Treat that as an open item (see [open items](./open-items.md)). This is not a DPIA, but it is the same analysis at feature scale.

---

## DPO assessment

Art. 37(1) requires a DPO in three cases.

| Case | Applies? | Reason |
|---|---|---|
| Public authority or body | No | Private company |
| Core activities need regular and systematic monitoring of data subjects on a large scale | No | Core activity is hosting stores. Prood does not observe individuals. As a processor it does not decide on the monitoring a merchant does. Revisit if analytics grows beyond consented totals |
| Core activities involve large-scale special categories or criminal data | No | Forbidden in the DPA, and not processed |

Portuguese law (Lei 58/2019) does not appear to add a duty for a company of this kind. Counsel should confirm.

**Conclusion.** Not required. hello@prood.com is the contact point and the owner handles privacy matters. A voluntary DPO is not appointed. If the company appoints one later, it must tell CNPD and update `/privacy` (Art. 37(7)).

---

## Reassess when

- Prood sells or hosts something where personal data becomes central (health, identity documents, minors)
- Stores or shoppers grow to a scale WP 248 would call large: review at each funding round, or yearly at the latest
- Prood adds analytics beyond consented totals, advertising, profiling, or combines data across stores for a new purpose
- Prood provides, or embeds, an AI model that evaluates people, or agents are allowed to act without a person's approval (the `autonomous` mode is enabled in `apps/api/lib/auth/server.ts`: see [EU obligations](./eu-obligations.md))
- A new provider handles merchants' data outside the EEA in a new way
- A serious incident shows a risk this screening missed
