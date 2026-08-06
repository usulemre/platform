import type { Metadata } from 'next';
import { PortfolioBuilder } from '@/modules/portfolio-construction';

export const metadata: Metadata = { title: 'Portfolio builder · Research Platform' };

/** Portfolio Builder page — guided construction lifecycle + templates. */
export default function PortfolioBuilderPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Portfolio builder</h1>
      <p className="max-w-prose text-muted-foreground">
        The guided construction lifecycle and reusable templates. Construction is orchestrated by
        the engine and executed by deterministic engines and the optimizer; nothing is computed
        here.
      </p>
      <PortfolioBuilder />
    </div>
  );
}
