# Transfer register

Providers that handle personal data outside the EEA, the safeguard Prood states for each, and a transfer impact summary. The safeguards below are copied from the public `/subprocessors` and `/dpa` Annex 3 as of 2026-11-07. **Nobody has read the providers' own terms for this register**, and `_docs/LEGAL.md` (review list, item 1) says the entities, certifications and safeguards still need confirming. Treat every "stated" below as unverified until the owner has checked the provider's current DPA and recorded the date here.

---

## Register

| Provider | Role | Data | Location | Safeguard stated publicly | Notes |
|---|---|---|---|---|---|
| Vercel Inc. (USA) | Processor | All traffic, logs, visit statistics if allowed | Functions in Frankfurt (`fra1`: set in the Vercel project, not in the repo, so unverified from the code). Global delivery network. Logs may be processed in the USA | DPF and SCCs | DPF listing status and the SCC module for Prood's own data as controller: unverified. States SOC 2 Type 2, ISO 27001:2022 |
| Databricks, Inc. and Neon, LLC (USA) | Processor | All stored platform data | Frankfurt (AWS `eu-central-1`) | SCCs | Which SCC module applies depends on the DPA actually accepted: **unverified whether one has been accepted**. DPA 7.2 says Module Three is in place |
| Upstash, Inc. (USA) | Processor | Checkout sessions (24 hours, or 7 days once a payment has started), rate-limit counters with IP addresses | Frankfurt (`prood-redis`) | SCCs | SOC 2 Type II stated. Whether a DPA has been signed: unverified |
| Cloudflare, Inc. (USA) | Processor | Public images and their addresses | R2 bucket `prood-public`, EU jurisdiction. Delivered from a global network | DPF and SCCs | Per the owner's notes the bucket sits on Eleva's Cloudflare account, so Cloudflare's contract may be with Eleva and not with Búzios e Tartarugas: confirm who the processor's customer is. Not verifiable from the repo |
| Plus Five Five, Inc., trading as Resend (USA) | Processor | Service email: addresses, names, message content | Message data and logs stored in the USA | SCCs | DPF status unverified, so public texts cite SCCs only. Delivery log period unverified |
| Geoapify (Keptagon s.r.o.), Czech Republic | Processor | Address text typed at checkout, and the shopper's IP address, sent from the browser | EU | None needed | A DPA with Geoapify is still needed under Art. 28: unverified |
| INTH | Processor | Choice, session ID, IP address, language, browser details | Frankfurt | Not needed for storage. Support access from outside the EEA covered by its terms | Unverified: INTH's legal entity and where its support staff sit. Retention period unverified |
| Stripe Payments Europe, Ltd. (Ireland) | Likely a separate controller for payment data. `/privacy` calls it a processor: see [open items](./open-items.md) | Prood's own plan fees: organization name, owner's email, billing address, tax number | EU and USA | DPF and SCCs | Test mode only today. Applies once paid plans open |
| A store's own Stripe, Easypay or Ifthenpay account | The merchant's own provider, not a Prood sub-processor | Name, contact details, amount, and payment details the shopper enters | Provider's own | Provider's own terms | Prood passes the data on the merchant's instruction. Easypay and Ifthenpay are Portuguese providers (location unverified) |
| TOConline | Not live | Invoice data for Prood's own fees | Portugal (unverified) | None expected | Add here and to `/privacy` and `/subprocessors` when billing goes live (`_docs/LEGAL.md`) |

---

## Transfer impact summary

This summary is carried over from the sibling EUlabel register, read on 2026-11-01. It is not rechecked for 2026-11-07 and counsel should verify every legal reference.

**Law of the destination.** All US providers are electronic communication service providers, so they may receive requests under FISA section 702. The Commission's adequacy decision (EU) 2023/1795 assessed US law after Executive Order 14086, and that assessment also supports SCC transfers to the US, as the EDPB information note on the decision acknowledges.

**Status of the DPF.** The General Court dismissed the challenge in Latombe v Commission (T-553/23). An appeal, C-703/25 P, was pending on 2026-11-01. Where a provider offers both, Prood relies on SCCs as well, so a loss of the DPF would not stop the transfer.

**What the data is.**

- Application data is at rest in Frankfurt. The provider holds the encryption keys, so encryption does not defeat a compelled request (`/subprocessors`, "Jurisdiction and government access", which Prood publishes under Art. 28 of the Data Act).
- Merchants' data is contact details, addresses, order contents and Multibanco references. No special categories, and no card data.
- Shoppers' passwords are stored only as scrypt hashes.
- Provider credentials for each store are encrypted with AES-256-GCM in the database, with a key that Prood holds (`INTEGRATION_ENCRYPTION_KEY`), so the database provider cannot read them without that key.

**Conclusion.** Residual risk is low for the data held today. This is a statement of Prood's view, not a transfer impact assessment signed off by counsel.

---

## If a safeguard fails

| Event | Response |
|---|---|
| DPF annulled or suspended | SCCs carry Vercel and Cloudflare. The others already rest on SCCs or are in the EU. Rerun this assessment and update `/privacy`, `/subprocessors` and `/dpa` Annex 3 |
| SCCs alone found insufficient | `/dpa` 7.3: seek another safeguard, or move the provider, and tell merchants, who may end the contract. Candidates need EU hosting |
| Resend transfer fails | Move sending to an EU email provider. Update DNS first, so the new sender is not refused |
| Upstash transfer fails | Checkout and rate limits need Redis. Move to another Redis in the EU. Sessions are short-lived, so no migration is needed |
| Cloudflare transfer fails | Move images to another EU object store. URLs in the database change, so plan a bulk update |

Changing a sub-processor needs 30 days' notice to merchants and 14 days for them to object, and the objecting merchant's data may not move until it is resolved (`/dpa` 6.2, 6.3). In practice a provider change can be held back by weeks.

---

## Open

- Whether DPAs have been accepted with every provider above, and which SCC module each uses (`/dpa` 7.2 says Module Three is in place).
- Whether Vercel's own security-incident notices have been read.
- The Cloudflare account holder: the R2 bucket sits on Eleva's account.
- Sub-processor lists of each provider (`/dpa` 6.5 links them from `/subprocessors`): nobody has checked they are current.

See [open items](./open-items.md).
