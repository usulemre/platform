import type { Metadata } from 'next';
import { PortfolioComparisons } from '@/modules/portfolio-construction';

export const metadata: Metadata = { title: 'Portfolio comparisons · Research Platform' };

/** Portfolio Comparison list page. */
export default function PortfolioComparisonsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Portfolio comparisons</h1>
      <PortfolioComparisons />
    </div>
  );
}
