import type { Order } from "@prood/commerce"
import { FOLD_CELL, ListTable, RowLink, SortableHead } from "@prood/ui/components/list-table"
import { Status } from "@prood/ui/components/status-badge"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { formatPrice } from "@prood/ui/lib/commerce"
import type { ListState } from "@prood/ui/lib/list-params"
import { formatRelative, personName } from "@/lib/format"
import { orderState, paymentException } from "@/lib/status"

const WIDE = "hidden @2xl:table-cell"

function customerLabel(order: Order): string {
  const address = order.shippingAddress ?? order.billingAddress
  if (address) return personName(address)
  return order.contactEmail ?? "—"
}

/**
 * The order list. One state per order, filled only when it needs the merchant,
 * and a line under it for a payment that went wrong. In a narrow space each row
 * folds into two lines, so the state and the total stay on screen.
 */
export function OrdersTable({
  orders,
  now,
  timeZone,
  showCustomer = true,
  sortable,
}: {
  orders: Order[]
  now: Date
  timeZone?: string
  /** Off on a customer's own page, where every row is the same person. */
  showCustomer?: boolean
  /** Off on the overview and a customer's page, which show a short list. */
  sortable?: { list: ListState; pathname: string }
}) {
  return (
    <ListTable>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          {sortable ? (
            <SortableHead {...sortable} field="createdAt" firstDirection="desc" className={WIDE}>
              Date
            </SortableHead>
          ) : (
            <TableHead className={WIDE}>Date</TableHead>
          )}
          {showCustomer ? <TableHead className={WIDE}>Customer</TableHead> : null}
          <TableHead className={WIDE}>Status</TableHead>
          {sortable ? (
            <SortableHead {...sortable} field="total" firstDirection="desc" align="right">
              Total
            </SortableHead>
          ) : (
            <TableHead className="text-right">Total</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const state = orderState(order)
          const date = formatRelative(order.createdAt, now, timeZone)
          const customer = customerLabel(order)
          const exception = paymentException(order)
          return (
            <TableRow key={order.id} className="relative">
              <TableCell className={FOLD_CELL}>
                <RowLink href={`/orders/${order.id}`} stretch className="font-mono text-[0.8125rem]">
                  {order.orderNumber}
                </RowLink>
                <div className="text-xs text-muted-foreground @2xl:hidden">
                  {showCustomer ? <div className="truncate">{customer}</div> : null}
                  <div>{date}</div>
                </div>
              </TableCell>
              <TableCell className={`${WIDE} text-muted-foreground`}>{date}</TableCell>
              {showCustomer ? <TableCell className={WIDE}>{customer}</TableCell> : null}
              <TableCell className={WIDE}>
                <Status look={state} />
                {exception ? <div className="mt-0.5 text-xs text-muted-foreground">{exception}</div> : null}
              </TableCell>
              <TableCell className="text-right align-top tabular-nums @2xl:align-middle">
                {formatPrice(order.totals.total)}
                <div className="flex justify-end @2xl:hidden">
                  <Status look={state} />
                </div>
                {exception ? <div className="text-xs text-muted-foreground @2xl:hidden">{exception}</div> : null}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </ListTable>
  )
}
