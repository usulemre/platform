import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import type { SignalRegistryVm } from '../domain/view-model';

/**
 * Signal Registry view — surfaces Signal Registry (SIG) facts: registration,
 * versioning, manifest/provenance and (read-only) execution eligibility. The
 * eligibility value is owned by Execution Governance and shown for traceability.
 */
export function SignalRegistryPanel({ registry }: { registry: SignalRegistryVm }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Signal registry</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          {registry.rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 border-b py-1 text-sm">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
