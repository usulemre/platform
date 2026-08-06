'use client';

import { usePortfolioFamilies } from '../hooks/use-portfolio-construction';
import {
  PortfolioConstructionEmpty,
  PortfolioConstructionError,
  PortfolioConstructionLoading,
  InfoCard,
} from './portfolio-construction-atoms';

/** Portfolio Families / Namespaces — groupings of related portfolios. */
export function PortfolioFamilies() {
  const { data, isLoading, isError, refetch } = usePortfolioFamilies();

  if (isLoading) return <PortfolioConstructionLoading />;
  if (isError) return <PortfolioConstructionError onRetry={() => refetch()} />;
  if (!data || data.length === 0)
    return <PortfolioConstructionEmpty label="No portfolio families." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((family) => (
        <InfoCard key={family.id} title={`${family.namespace} / ${family.family}`}>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{family.description}</p>
            <p className="text-xs uppercase text-muted-foreground">
              {family.portfolioCount} {family.portfolioCount === 1 ? 'portfolio' : 'portfolios'}
            </p>
          </div>
        </InfoCard>
      ))}
    </div>
  );
}
