import { Badge } from '@platform/ui';
import type { Tone } from '../domain/view-model';

const TONE_VARIANT: Record<Tone, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  neutral: 'secondary',
  positive: 'default',
  warning: 'outline',
  danger: 'destructive',
  info: 'outline',
};

/** Presentational status/tone badge. Text label always present (not colour-only). */
export function RiskStatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant={TONE_VARIANT[tone]}>{label}</Badge>;
}
