import { LayoutDashboard, FilePlus2, ListChecks, Sparkles } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navItems = [
  { label: 'Dashboard', href: '#dashboard', icon: LayoutDashboard },
  { label: 'Create Plan', href: '#create', icon: FilePlus2 },
  { label: 'My Plans', href: '#plans', icon: ListChecks },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
          <span className="text-base font-semibold">Interview Prep</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    render={
                      <a href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </a>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-sm font-medium">Ready to prep?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste a job link and upload your resume to generate a roadmap.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
