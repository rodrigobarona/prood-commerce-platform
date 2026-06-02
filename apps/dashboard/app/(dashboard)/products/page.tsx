import Link from "next/link"
import { Package, Plus } from "@phosphor-icons/react/dist/ssr"
import type { Product } from "@prood/commerce"
import { DashboardEmpty } from "@/components/dashboard-empty"
import { Button } from "@prood/ui/components/button"
import { Badge } from "@prood/ui/components/badge"
import {
  Card,
  CardContent,
} from "@prood/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { localized, formatPrice } from "@prood/ui/lib/commerce"
import { listProducts } from "@/lib/admin-api"

export const metadata = { title: "Products" }

export default async function ProductsPage() {
  let products: Product[] = []
  let total = 0
  let failed = false
  try {
    const result = await listProducts({ page: 1, perPage: 50 })
    products = result.items
    total = result.total
  } catch {
    failed = true
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-medium">Products</h2>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"} in your catalog.
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus />
            <span>New product</span>
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="px-0">
          {products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="pl-5 font-medium">
                      {localized(product.name)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.productType}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.status === "active" ? "default" : "outline"}
                      >
                        {product.status ?? "draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={product.inStock ? "secondary" : "outline"}
                      >
                        {product.inStock ? "In stock" : "Out of stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/products/${product.id}/edit`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <DashboardEmpty
              className="mx-5 border-0 py-10"
              icon={Package}
              title={failed ? "Catalog unavailable" : "No products yet"}
              description={
                failed
                  ? "Could not load products. Check the database connection."
                  : "Create your first product to start selling."
              }
              actionLabel={failed ? undefined : "New product"}
              actionHref={failed ? undefined : "/products/new"}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
