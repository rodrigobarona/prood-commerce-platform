import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export const metadata = { title: "Overview" }

const placeholderStats = [
  { label: "Revenue", value: "—" },
  { label: "Orders", value: "—" },
  { label: "Customers", value: "—" },
  { label: "Products", value: "—" },
]

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Overview</h2>
        <p className="text-sm text-muted-foreground">
          A snapshot of your store. Live metrics arrive with the store admin
          phase.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {placeholderStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
