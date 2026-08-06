import type { Metadata } from 'next';
import { FeatureDashboard, FeaturesView } from '@/modules/feature';

export const metadata: Metadata = {
  title: 'Features · Research Platform',
};

/** Feature Dashboard + Catalog page (Server Component). Interactive parts are
 *  Client Components that fetch through the application service. */
export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Features</h1>
        <p className="max-w-prose text-muted-foreground">
          The feature catalog and registry. Read-only presentation — registration, validation and
          approval into the marketplace occur through governed workflows, never from this console.
        </p>
      </div>
      <FeatureDashboard />
      <FeaturesView />
    </div>
  );
}
