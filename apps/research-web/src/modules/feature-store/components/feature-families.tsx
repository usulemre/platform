'use client';

import { useFeatureFamilies } from '../hooks/use-feature-store';
import {
  FeatureStoreEmpty,
  FeatureStoreError,
  FeatureStoreLoading,
  InfoCard,
} from './feature-store-atoms';

/** Feature Families / Namespaces — groupings of related features. */
export function FeatureFamilies() {
  const { data, isLoading, isError, refetch } = useFeatureFamilies();

  if (isLoading) return <FeatureStoreLoading />;
  if (isError) return <FeatureStoreError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <FeatureStoreEmpty label="No feature families." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((family) => (
        <InfoCard key={family.id} title={`${family.namespace} / ${family.family}`}>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{family.description}</p>
            <p className="text-xs uppercase text-muted-foreground">
              {family.featureCount} {family.featureCount === 1 ? 'feature' : 'features'}
            </p>
          </div>
        </InfoCard>
      ))}
    </div>
  );
}
