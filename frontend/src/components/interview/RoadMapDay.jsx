import { Badge } from '@/components/ui/badge';

export const RoadMapDay = ({ day }) => (
  <div className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-card">
    <div className="flex items-center gap-2.5">
      <Badge variant="default" className="px-2.5 py-0.5 rounded-full font-bold">
        Day {day.dayNumber}
      </Badge>
      <h3 className="text-base font-semibold text-foreground">{day.dailyFocus}</h3>
    </div>
    <ul className="flex flex-col gap-2 list-none p-0 m-0 pl-1">
      {day.dailyTasks.map((task, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
          <span className="flex-1">{task}</span>
        </li>
      ))}
    </ul>
  </div>
);
