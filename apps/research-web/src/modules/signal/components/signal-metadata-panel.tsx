import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import type { MetadataRowVm } from '../domain/view-model';

/** Signal metadata panel. Renders pre-mapped rows; no formatting logic. */
export function SignalMetadataPanel({ rows }: { rows: readonly MetadataRowVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          {rows.map((row) => (
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
