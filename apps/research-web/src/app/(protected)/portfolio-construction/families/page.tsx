import type { Metadata } from 'next';
import { PortfolioFamilies } from '@/modules/portfolio-construction';

export const metadata: Metadata = { title: 'Portfolio families · Research Platform' };

/** Portfolio Families page. */
export default function PortfolioFamiliesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Portfolio families</h1>
      <PortfolioFamilies />
    </div>
  );
}
