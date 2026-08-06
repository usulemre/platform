import { Badge, Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import type { FeatureRegistryVm } from '../domain/view-model';

/**
 * Feature Registry view — surfaces Feature Registry (FRG) facts: registration,
 * versioning, manifest/provenance and marketplace availability. Read-only.
 */
export function FeatureRegistryPanel({ registry }: { registry: FeatureRegistryVm }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Feature registry</CardTitle>
        <Badge variant={registry.marketplaceAvailable ? 'default' : 'secondary'}>
          {registry.marketplaceAvailable ? 'In marketplace' : 'Not in marketplace'}
        </Badge>
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
