import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export const ResourceCard = ({ item }) => (
  <Card>
    <CardHeader>
      <CardTitle className="capitalize text-base font-bold">
        {item.requirementName}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid gap-3 md:grid-cols-2">
        {item.resources && item.resources.length > 0 ? (
          item.resources.map((resource, idx) => (
            <a
              key={idx}
              href={resource.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between p-4 rounded-lg border border-border bg-accent/5 hover:bg-accent/15 hover:border-muted-foreground/30 transition-all cursor-pointer"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {resource.resourceTitle}
                  </h4>
                  <ExternalLink size={14} className="text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {resource.resourceSnippet || "No description provided."}
                </p>
              </div>
              <div className="mt-3 text-[10px] font-bold text-primary tracking-wider uppercase flex items-center gap-1">
                <span>View Tutorial</span>
              </div>
            </a>
          ))
        ) : (
          <p className="text-xs text-muted-foreground col-span-2">No learning resources found for this skill.</p>
        )}
      </div>
    </CardContent>
  </Card>
);
