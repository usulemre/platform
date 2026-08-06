import type { Metadata } from 'next';
import { PortfolioComparison } from '@/modules/portfolio-optimization';

export const metadata: Metadata = { title: 'Portfolio comparison · Research Platform' };

/** Portfolio Comparison page. */
export default function PortfolioComparisonPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Portfolio comparison</h1>
      <PortfolioComparison />
    </div>
  );
}
