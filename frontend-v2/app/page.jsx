import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardStats } from '@/components/dashboard-stats'
import { CreatePlan } from '@/components/create-plan'
import { RecentPlans } from '@/components/recent-plans'
import { samplePlans } from '@/lib/plans'

export default function Page() {
  // Later, replace `samplePlans` with data from your database.
  const plans = samplePlans

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* Sticky top bar with the collapse toggle */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <span className="text-sm font-medium text-muted-foreground">Interview Prep Dashboard</span>
        </header>

        <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-10">
          {/* Dashboard: heading + quick stats */}
          <section id="dashboard" className="scroll-mt-20">
            <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
              Interview Prep <span className="text-primary">Dashboard</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Generate tailored interview roadmaps and track your match scores in one place.
            </p>
            <div className="mt-6">
              <DashboardStats plans={plans} />
            </div>
          </section>

          {/* Create plan section */}
          <section id="create" className="mt-12 scroll-mt-20">
            <h2 className="mb-5 text-2xl font-bold text-balance">
              Create Your Custom <span className="text-primary">Interview Plan</span>
            </h2>
            <CreatePlan />
          </section>

          {/* Recent plans section */}
          <section id="plans" className="mt-14 scroll-mt-20">
            <RecentPlans plans={plans} />
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
