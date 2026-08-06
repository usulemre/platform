import type { Metadata } from 'next';
import { EfficientFrontier } from '@/modules/portfolio-optimization';

export const metadata: Metadata = { title: 'Efficient frontier · Research Platform' };

/** Efficient Frontier page. */
export default function EfficientFrontierPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Efficient frontier</h1>
      <EfficientFrontier />
    </div>
  );
}
