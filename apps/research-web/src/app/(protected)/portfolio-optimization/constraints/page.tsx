import type { Metadata } from 'next';
import { ConstraintEditor } from '@/modules/portfolio-optimization';

export const metadata: Metadata = { title: 'Constraint editor · Research Platform' };

/** Constraint Editor page. */
export default function ConstraintEditorPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Constraint editor</h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        Configure the constraints applied to every optimizer. Changes here flow through the
        allocation explorer, efficient frontier and comparison.
      </p>
      <ConstraintEditor />
    </div>
  );
}
