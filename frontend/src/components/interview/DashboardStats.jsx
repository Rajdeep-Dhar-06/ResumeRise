import { FileText, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function DashboardStats({ stats }) {
  const items = [
    { label: 'Total Plans', value: stats.totalPlans, icon: FileText },
    { label: 'Average Match', value: `${stats.averageMatch}%`, icon: Target },
    { label: 'Best Match', value: `${stats.bestMatch}%`, icon: TrendingUp },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((stat) => (
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

