/** `%q%` for LIKE, with the caller's own `%`, `_` and `\\` matched as themselves. */
export function contains(q: string): string {
  return `%${q.replace(/[\\%_]/g, '\\$&')}%`
}
