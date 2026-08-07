/**
 * Numeric/enumeration parsing helpers shared by the Binance mappers. Binance returns numbers as
 * strings; these helpers parse them safely (NaN → 0 for quantities/prices is deliberate: a malformed
 * numeric field must never silently poison downstream arithmetic, and the raw payload is preserved
 * upstream for auditing). Pure and deterministic.
 */
import type {
  CanonicalOrderStatus,
  CanonicalOrderType,
  CanonicalSide,
  CanonicalTimeInForce,
} from '../types/canonical';

/** Parse a Binance numeric string to a finite number (0 when absent or non-finite). */
export function num(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Map a Binance side to canonical. */
export function toCanonicalSide(side: string): CanonicalSide {
  return side.toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
}

/** Map a canonical side to Binance. */
export function toBinanceSide(side: CanonicalSide): 'BUY' | 'SELL' {
  return side === 'SELL' ? 'SELL' : 'BUY';
}

const ORDER_STATUS: Readonly<Record<string, CanonicalOrderStatus>> = {
  NEW: 'NEW',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  FILLED: 'FILLED',
  CANCELED: 'CANCELED',
  PENDING_CANCEL: 'PENDING_CANCEL',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  EXPIRED_IN_MATCH: 'EXPIRED',
};

export function toCanonicalStatus(status: string): CanonicalOrderStatus {
  return ORDER_STATUS[status.toUpperCase()] ?? 'NEW';
}

const ORDER_TYPE_TO_CANONICAL: Readonly<Record<string, CanonicalOrderType>> = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
  STOP: 'STOP_LIMIT',
  STOP_LOSS: 'STOP',
  STOP_LOSS_LIMIT: 'STOP_LIMIT',
  STOP_MARKET: 'STOP',
  TAKE_PROFIT: 'TAKE_PROFIT',
  TAKE_PROFIT_LIMIT: 'TAKE_PROFIT',
  TAKE_PROFIT_MARKET: 'TAKE_PROFIT',
  LIMIT_MAKER: 'LIMIT',
};

export function toCanonicalType(type: string): CanonicalOrderType {
  return ORDER_TYPE_TO_CANONICAL[type.toUpperCase()] ?? 'LIMIT';
}

/** Map a canonical order type to the Binance order type (market-appropriate). */
export function toBinanceType(type: CanonicalOrderType): string {
  switch (type) {
    case 'MARKET':
      return 'MARKET';
    case 'LIMIT':
      return 'LIMIT';
    case 'STOP':
      return 'STOP_LOSS';
    case 'STOP_LIMIT':
      return 'STOP_LOSS_LIMIT';
    case 'TAKE_PROFIT':
      return 'TAKE_PROFIT';
  }
}

const TIF: Readonly<Record<string, CanonicalTimeInForce>> = {
  GTC: 'GTC',
  IOC: 'IOC',
  FOK: 'FOK',
  GTD: 'GTD',
};

export function toCanonicalTif(tif: string | undefined): CanonicalTimeInForce | undefined {
  if (!tif) return undefined;
  return TIF[tif.toUpperCase()];
}

/** ISO-8601 string for a Binance epoch-millis timestamp (undefined passes through). */
export function isoFromMillis(ms: number | undefined): string | undefined {
  if (ms === undefined || !Number.isFinite(ms) || ms <= 0) return undefined;
  return new Date(ms).toISOString();
}
