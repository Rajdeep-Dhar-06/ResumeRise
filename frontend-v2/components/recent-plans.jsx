import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { matchScoreColor } from '@/lib/plans'

export function RecentPlans({ plans }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-balance">My Recent Interview Plans</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Review and continue preparing with your previously generated strategies.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex h-full flex-col transition-colors hover:border-primary/50">
            <CardHeader>
              <CardTitle className="leading-snug text-balance">{plan.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-muted-foreground">
              Generated on {plan.generatedOn}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Match Score</span>
              <Badge className={matchScoreColor(plan.matchScore)}>{plan.matchScore}%</Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
