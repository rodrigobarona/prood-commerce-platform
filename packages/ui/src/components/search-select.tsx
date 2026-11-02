"use client"

import { useState } from "react"
import { CaretUpDown, Check } from "@phosphor-icons/react"

import { Button } from "@prood/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@prood/ui/components/command"
import { Popover, PopoverContent, PopoverTrigger } from "@prood/ui/components/popover"
import { cn } from "@prood/ui/lib/utils"

export interface SearchSelectOption {
  value: string
  label: string
}

/** A select for long lists, like countries and timezones: type to narrow it down. */
export function SearchSelect({
  id,
  value,
  options,
  onValueChange,
  placeholder,
  searchLabel,
  emptyText,
  invalid,
  describedBy,
}: {
  id: string
  value: string
  options: SearchSelectOption[]
  onValueChange: (value: string) => void
  placeholder: string
  searchLabel: string
  emptyText: string
  invalid?: boolean
  describedBy?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="h-9 w-full justify-between border-input bg-card px-2.5 font-normal md:h-9 dark:bg-card"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected?.label ?? placeholder}</span>
          <CaretUpDown aria-hidden className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-56 rounded-xl p-0">
        <Command>
          <CommandInput placeholder={searchLabel} aria-label={searchLabel} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value ? <Check aria-hidden className="ml-auto size-4" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
