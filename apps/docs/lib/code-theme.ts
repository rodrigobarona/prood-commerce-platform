import { createCssVariablesTheme } from 'shiki/core';

/**
 * Shiki writes CSS variables instead of colors, so highlighted code takes its
 * palette from `global.css` and follows Paper, Ink and the surfaces like
 * everything else. The two schemes share one theme.
 */
const theme = createCssVariablesTheme({
  name: 'prood',
  variablePrefix: '--code-',
  fontStyle: true,
});

export const codeThemes = { light: theme, dark: theme };
