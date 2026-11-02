"use client"

import { createShikiHighlighter } from "fumadocs-core/highlight/shiki"
import { defaultShikiFactory } from "fumadocs-core/highlight/shiki/full"
import { createOpenAPIPage } from "fumadocs-openapi/ui"
import { codeThemes } from "@/lib/code-theme"

export const APIPage = createOpenAPIPage({
  highlighter: createShikiHighlighter(() => defaultShikiFactory.getOrInit(), {
    defaultColor: false,
    themes: codeThemes,
  }),
})
