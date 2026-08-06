import type { Metadata } from 'next';
import { ScenarioTemplates } from '@/modules/execution-simulator';

export const metadata: Metadata = { title: 'Scenario templates · Admin' };

/** Scenario Templates page. */
export default function ScenarioTemplatesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Scenario templates</h1>
      <ScenarioTemplates />
    </div>
  );
}
