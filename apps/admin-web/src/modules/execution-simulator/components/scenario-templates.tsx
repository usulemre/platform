'use client';

import { useScenarioTemplates } from '../hooks/use-execution-simulator';
import {
  ExecutionEmpty,
  ExecutionError,
  ExecutionLoading,
  InfoCard,
  StatusBadge,
} from './execution-atoms';

/** Scenario Templates — the reusable simulation scenario templates. */
export function ScenarioTemplates() {
  const { data, isLoading, isError, refetch } = useScenarioTemplates();
  if (isLoading) return <ExecutionLoading />;
  if (isError) return <ExecutionError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <ExecutionEmpty label="No scenario templates." />;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {data.map((template) => (
        <InfoCard key={template.id} title={template.name}>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{template.description}</p>
            <div className="flex flex-wrap gap-1">
              <StatusBadge label={`fill: ${template.fillModel}`} tone="info" />
              <StatusBadge label={`venue: ${template.venueModel}`} tone="neutral" />
            </div>
          </div>
        </InfoCard>
      ))}
    </div>
  );
}
