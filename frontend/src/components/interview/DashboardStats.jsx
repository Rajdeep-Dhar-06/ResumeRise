import { FileText, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function DashboardStats({ plans }) {
  const total = plans.length
  const average = total ? Math.round(plans.reduce((sum, p) => sum + p.matchScore, 0) / total) : 0
  const best = total ? Math.max(...plans.map((p) => p.matchScore)) : 0

  const stats = [
    { label: 'Total Plans', value: total, icon: FileText },
    { label: 'Average Match', value: `${average}%`, icon: Target },
    { label: 'Best Match', value: `${best}%`, icon: TrendingUp },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <stat.icon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
