import { useNavigate } from 'react-router';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { matchScoreColor } from '@/lib/plans';
import { Trash2 } from 'lucide-react';

export function ReportCardGrid({ plans, onDelete }) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan._id}
          className="group relative flex h-full flex-col transition-colors hover:border-primary/50 cursor-pointer"
          onClick={() => navigate(`/interview/${plan._id}`)}
        >
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Stop navigation click
                onDelete(plan._id);
              }}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              title="Delete Plan"
            >
              <Trash2 size={16} />
            </button>
          )}

          <CardHeader className="pr-10">
            <CardTitle className="leading-snug text-balance">{plan.reportTitle || "Untitled Plan"}</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 text-sm text-muted-foreground flex flex-col justify-end">
            Generated on {new Date(plan.createdAt).toLocaleDateString()}
          </CardContent>
          
          <CardFooter className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Match Score</span>
            <Badge className={matchScoreColor(plan.matchScore)}>{plan.matchScore}%</Badge>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
