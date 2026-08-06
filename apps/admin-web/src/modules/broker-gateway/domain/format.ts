/**
 * Presentation formatting for the Broker Gateway UI — pure string/tone helpers. No logic that affects
 * a decision; the lifecycle, health and capability rules live in `@platform/broker-sdk`.
 */
import type { BrokerStatus, HealthLevel } from '@platform/broker-sdk';

export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export function statusTone(status: BrokerStatus): Tone {
  switch (status) {
    case 'HEALTHY':
      return 'positive';
    case 'CONNECTED':
      return 'info';
    case 'DEGRADED':
      return 'warning';
    case 'DISCONNECTED':
      return 'danger';
    case 'ARCHIVED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function healthTone(level: HealthLevel): Tone {
  switch (level) {
    case 'HEALTHY':
      return 'positive';
    case 'DEGRADED':
      return 'warning';
    case 'UNHEALTHY':
      return 'danger';
    case 'OFFLINE':
      return 'neutral';
  }
}

export function envTone(env: string): Tone {
  return env === 'LIVE' ? 'danger' : env === 'PAPER' ? 'info' : 'neutral';
}

export function title(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function fmtNumber(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString('en-US') : '—';
}

export function fmtScore(value: number): string {
  return Number.isFinite(value) ? value.toFixed(0) : '—';
}

export function fmtMs(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(0)} ms` : '—';
}

export function fmtPct(ratio: number, digits = 1): string {
  return Number.isFinite(ratio) ? `${(ratio * 100).toFixed(digits)}%` : '—';
}

export function fmtMoney(value: number, currency = 'USD'): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M ${currency}`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K ${currency}`;
  return `${value.toFixed(2)} ${currency}`;
}

export function shortTime(iso?: string): string {
  return iso ? iso.slice(0, 16).replace('T', ' ') : '—';
}
