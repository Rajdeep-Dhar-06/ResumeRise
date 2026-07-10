import { Badge } from '@/components/ui/badge';
import { QuestionCard } from './QuestionCard.jsx';
import { EmptyTabState } from './EmptyTabState.jsx';

export const QuestionsList = ({ title, questions }) => (
  <section className="flex flex-col gap-4">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <Badge variant="secondary">{questions?.length || 0} questions</Badge>
    </div>
    <div className="flex flex-col gap-3">
      {questions && questions.length > 0 ? (
        questions.map((q, i) => (
          <QuestionCard key={i} item={q} index={i} />
        ))
      ) : (
        <EmptyTabState message={`No ${title.toLowerCase()} found.`} />
      )}
    </div>
  </section>
);
