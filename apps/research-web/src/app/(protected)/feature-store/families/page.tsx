import type { Metadata } from 'next';
import { FeatureFamilies } from '@/modules/feature-store';

export const metadata: Metadata = { title: 'Feature families · Research Platform' };

/** Feature Families page. */
export default function FeatureFamiliesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Feature families</h1>
      <FeatureFamilies />
    </div>
  );
}
