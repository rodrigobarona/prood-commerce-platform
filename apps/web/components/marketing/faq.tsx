import { PlusIcon } from "@phosphor-icons/react/dist/ssr"

export function Faq({ items }: { items: readonly { question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <details key={item.question} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md py-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
            {item.question}
            <PlusIcon
              className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-standard group-open:rotate-45"
              aria-hidden
            />
          </summary>
          <p className="max-w-3xl pb-5 leading-7 text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
