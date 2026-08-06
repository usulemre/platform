import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import { Radio } from 'lucide-react';
import type { CompositionEntryVm } from '../domain/view-model';

/**
 * Signal composition view — the signals combined into the strategy. Weights are
 * descriptive metadata (no optimization is performed here). Each entry links to
 * the Signal Module.
 */
export function SignalComposition({ composition }: { composition: readonly CompositionEntryVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Signal composition</CardTitle>
      </CardHeader>
      <CardContent>
        {composition.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No signals"
            description="No signals are composed into this strategy yet."
          />
        ) : (
          <ul className="space-y-1 text-sm">
            {composition.map((entry) => (
              <li
                key={entry.signalId}
                className="flex items-center justify-between gap-4 border-b py-1"
              >
                <Link href={entry.href} className="font-medium hover:underline">
                  {entry.name}
                </Link>
                <span className="flex items-center gap-3 text-muted-foreground">
                  <span className="text-xs uppercase">{entry.assetClass}</span>
                  <span className="font-medium text-foreground">{entry.weight}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
