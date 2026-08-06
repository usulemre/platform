import type { Metadata } from 'next';
import { PortfolioOptimizationRequests, PortfolioQueues } from '@/modules/portfolio-construction';

export const metadata: Metadata = { title: 'Optimization requests · Research Platform' };

/** Portfolio Optimization Requests + optimization/approval queues page. */
export default function PortfolioOptimizationPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Optimization requests</h1>
        <p className="max-w-prose text-muted-foreground">
          Active optimization requests and portfolios awaiting a governed decision. Optimization
          runs in the external optimizer and approvals are made by governance; these consoles
          surface the requests.
        </p>
      </div>
      <PortfolioOptimizationRequests />
      <PortfolioQueues />
    </div>
  );
}
