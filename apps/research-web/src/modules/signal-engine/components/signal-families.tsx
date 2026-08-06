'use client';

import { useSignalFamilies } from '../hooks/use-signal-engine';
import {
  InfoCard,
  SignalEngineEmpty,
  SignalEngineError,
  SignalEngineLoading,
} from './signal-engine-atoms';

/** Signal Families / Namespaces — groupings of related signals. */
export function SignalFamilies() {
  const { data, isLoading, isError, refetch } = useSignalFamilies();

  if (isLoading) return <SignalEngineLoading />;
  if (isError) return <SignalEngineError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <SignalEngineEmpty label="No signal families." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((family) => (
        <InfoCard key={family.id} title={`${family.namespace} / ${family.family}`}>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{family.description}</p>
            <p className="text-xs uppercase text-muted-foreground">
              {family.signalCount} {family.signalCount === 1 ? 'signal' : 'signals'}
            </p>
          </div>
        </InfoCard>
      ))}
    </div>
  );
}
