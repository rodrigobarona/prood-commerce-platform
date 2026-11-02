/** A field's problem, beside the field. The field points at it with `aria-describedby`. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-destructive text-sm">
      {message}
    </p>
  )
}
