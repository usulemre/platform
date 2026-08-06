import type { Metadata } from 'next';
import { LimitConfiguration } from '@/modules/risk-engine';

export const metadata: Metadata = { title: 'Limit configuration · Admin' };

/** Limit Configuration page. */
export default function RiskLimitsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Limit configuration</h1>
      <LimitConfiguration />
    </div>
  );
}
