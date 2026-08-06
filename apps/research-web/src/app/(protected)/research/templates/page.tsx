import type { Metadata } from 'next';
import { ResearchTemplates } from '@/modules/research';

export const metadata: Metadata = { title: 'Research templates · Research Platform' };

/** Research Templates page. */
export default function ResearchTemplatesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Research templates</h1>
      <ResearchTemplates />
    </div>
  );
}
