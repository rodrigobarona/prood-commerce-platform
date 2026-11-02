import { formatDate, formatDateTime, formatWhen } from "@/lib/format"

/** A point in time. The exact UTC time is one hover away. */
export function Timestamp({
  date,
  dateOnly = false,
}: {
  date: Date
  /** For long-past facts like "Joined", where a relative time adds nothing. */
  dateOnly?: boolean
}) {
  return (
    <time dateTime={date.toISOString()} title={formatDateTime(date)}>
      {dateOnly ? formatDate(date) : formatWhen(date)}
    </time>
  )
}
