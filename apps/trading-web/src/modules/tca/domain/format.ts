/**
 * Presentation formatting for the TCA UI — pure string/tone helpers. No logic that affects a
 * decision; the real cost calculations live in `@platform/tca-sdk`. Cost sign convention: a positive
 * value is a cost (unfavorable), so lower/negative is better and shown in a positive tone.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export function fmtBps(bps: number, digits = 2): string {
  if (!Number.isFinite(bps)) return '—';
  const sign = bps > 0 ? '+' : '';
  return `${sign}${bps.toFixed(digits)} bps`;
}

export function fmtCurrency(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function fmtNotional(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function fmtPct(ratio: number, digits = 2): string {
  if (!Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function fmtPrice(value: number, digits = 4): string {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}

export function fmtNumber(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString('en-US') : '—';
}

export function fmtScore(score: number): string {
  return Number.isFinite(score) ? score.toFixed(1) : '—';
}

/** Cost tone — negative (favorable) is positive; small cost is neutral; large cost is danger. */
export function costTone(bps: number): Tone {
  if (!Number.isFinite(bps)) return 'neutral';
  if (bps <= 0) return 'positive';
  if (bps < 10) return 'neutral';
  if (bps < 30) return 'warning';
  return 'danger';
}

export function scoreTone(score: number): Tone {
  if (score >= 80) return 'positive';
  if (score >= 60) return 'warning';
  return 'danger';
}

export function gradeTone(grade: string): Tone {
  if (grade === 'A' || grade === 'B') return 'positive';
  if (grade === 'C' || grade === 'D') return 'warning';
  return 'danger';
}

export function sideTone(side: string): Tone {
  return side === 'BUY' ? 'info' : 'neutral';
}

export function modeTone(mode: string): Tone {
  return mode === 'LIVE' ? 'danger' : mode === 'PAPER' ? 'info' : 'neutral';
}

export function favorableTone(favorable: boolean): Tone {
  return favorable ? 'positive' : 'warning';
}

export function shortTime(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}
