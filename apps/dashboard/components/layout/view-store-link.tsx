import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@prood/ui/components/sidebar"
import { getStoreSettings } from "@/lib/admin-api"

export async function ViewStoreLink() {
  // A sidebar link isn't worth failing every dashboard page over.
  const store = await getStoreSettings().catch(() => null)
  if (!store) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="View store">
          <a href={store.url} target="_blank" rel="noopener noreferrer">
            <ArrowSquareOut />
            <span>View store</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
