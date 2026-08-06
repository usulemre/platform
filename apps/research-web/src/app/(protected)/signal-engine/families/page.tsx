import type { Metadata } from 'next';
import { SignalFamilies } from '@/modules/signal-engine';

export const metadata: Metadata = { title: 'Signal families · Research Platform' };

/** Signal Families page. */
export default function SignalFamiliesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Signal families</h1>
      <SignalFamilies />
    </div>
  );
}
