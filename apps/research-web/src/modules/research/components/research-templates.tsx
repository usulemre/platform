'use client';

import { useTemplates } from '../hooks/use-research';
import { InfoCard, ResearchEmpty, ResearchError, ResearchLoading } from './research-atoms';
import { Badge } from '@platform/ui';

/** Research Templates — reusable project lifecycles and objectives. */
export function ResearchTemplates() {
  const { data, isLoading, isError, refetch } = useTemplates();

  if (isLoading) return <ResearchLoading />;
  if (isError) return <ResearchError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <ResearchEmpty label="No templates." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((template) => (
        <InfoCard key={template.id} title={template.name}>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">{template.description}</p>
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Stages</h3>
              <div className="flex flex-wrap gap-1">
                {template.stageLabels.map((label) => (
                  <Badge key={label} variant="secondary">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Objectives
              </h3>
              <ul className="list-inside list-disc text-muted-foreground">
                {template.objectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            </div>
          </div>
        </InfoCard>
      ))}
    </div>
  );
}
