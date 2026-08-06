import type { Metadata } from 'next';
import { PortfolioDashboard, PortfoliosView } from '@/modules/portfolio';

export const metadata: Metadata = {
  title: 'Portfolios · Research Platform',
};

/** Portfolio Dashboard + Catalog page (Server Component). Interactive parts are
 *  Client Components that fetch through the application service. */
export default function PortfoliosPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Portfolios</h1>
        <p className="max-w-prose text-muted-foreground">
          Research portfolios composed from approved strategies. Read-only presentation — portfolios
          are proposed allocations and never authorize live trading; deployment is governed.
        </p>
      </div>
      <PortfolioDashboard />
      <PortfoliosView />
    </div>
  );
}
