'use client';

import { PORTFOLIO_STAGES, describeStage } from '@platform/portfolio-sdk';
import { usePortfolioTemplates } from '../hooks/use-portfolio-construction';
import {
  GovernanceNotice,
  InfoCard,
  PortfolioConstructionEmpty,
  PortfolioConstructionError,
  PortfolioConstructionLoading,
  StatusBadge,
} from './portfolio-construction-atoms';

/** Portfolio Templates — the reusable construction templates available to the builder. */
function TemplateGrid() {
  const { data, isLoading, isError, refetch } = usePortfolioTemplates();
  if (isLoading) return <PortfolioConstructionLoading rows={3} />;
  if (isError) return <PortfolioConstructionError onRetry={() => refetch()} />;
  if (!data || data.length === 0)
    return <PortfolioConstructionEmpty label="No templates available." />;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {data.map((template) => (
        <InfoCard key={template.id} title={template.name}>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{template.description}</p>
            <p className="text-xs uppercase text-muted-foreground">Allocation model</p>
            <StatusBadge label={template.allocationModel} tone="info" />
            <div className="flex flex-wrap gap-1 pt-1">
              {template.constraintKinds.map((kind) => (
                <StatusBadge key={kind} label={kind} tone="neutral" />
              ))}
            </div>
          </div>
        </InfoCard>
      ))}
    </div>
  );
}

/** Portfolio Builder — a guided, read-only walkthrough of the construction lifecycle and
 *  the reusable templates. Construction itself is orchestrated by the engine and executed
 *  by deterministic engines and the optimizer; nothing is computed here. */
export function PortfolioBuilder() {
  return (
    <div className="space-y-6">
      <GovernanceNotice />
      <InfoCard title="Construction lifecycle">
        <ol className="space-y-2 text-sm">
          {PORTFOLIO_STAGES.map((stage, index) => {
            const descriptor = describeStage(stage);
            return (
              <li key={stage} className="flex items-start gap-3 border-b py-1.5">
                <span className="font-mono text-xs text-muted-foreground">{index + 1}</span>
                <div className="flex flex-1 items-start justify-between gap-2">
                  <span>
                    <span className="font-medium">{descriptor.label}</span>
                    {descriptor.gate ? (
                      <span className="ml-2 text-xs uppercase text-muted-foreground">gate</span>
                    ) : null}
                    <p className="text-xs text-muted-foreground">{descriptor.description}</p>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        <p role="note" className="mt-3 text-xs text-muted-foreground">
          No stage may be skipped; gates (validation, review, approval) are decided by deterministic
          engines and accountable humans.
        </p>
      </InfoCard>
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Templates</h2>
        <TemplateGrid />
      </div>
    </div>
  );
}
