import type { Metadata } from 'next';
import { RiskPolicies, RuleExplorer } from '@/modules/risk-engine';

export const metadata: Metadata = { title: 'Risk policies · Admin' };

/** Risk Policies + Rule Explorer page. */
export default function RiskPoliciesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Risk policies</h1>
        <p className="max-w-prose text-muted-foreground">
          The registry of risk policies and the rule explorer. Rule evaluation is performed by
          deterministic engines; statuses are reflected here, never decided.
        </p>
      </div>
      <RiskPolicies />
      <RuleExplorer />
    </div>
  );
}
