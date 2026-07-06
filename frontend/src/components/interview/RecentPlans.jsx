import { useNavigate } from 'react-router'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { matchScoreColor } from '@/lib/plans'

export function RecentPlans({ plans }) {
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="text-2xl font-bold text-balance">My Recent Interview Plans</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Review and continue preparing with your previously generated strategies.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.slice(0, 6).map((plan) => (
          <Card
            key={plan._id}
            className="flex h-full flex-col transition-colors hover:border-primary/50 cursor-pointer"
            onClick={() => navigate(`/interview/${plan._id}`)}
          >
            <CardHeader>
              <CardTitle className="leading-snug text-balance">{plan.title || "Untitled Plan"}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-muted-foreground">
              Generated on {new Date(plan.createdAt).toLocaleDateString()}
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
