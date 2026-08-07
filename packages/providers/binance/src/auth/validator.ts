/**
 * `AuthenticationValidator` — deterministic structural validation of raw user-data payloads and of
 * signed-request timing. Payloads are checked for their documented required fields before mapping
 * (throwing a {@link BinanceStreamValidationError}); {@link withinRecvWindow} implements Binance's
 * documented server-side timestamp rule (`timestamp <= serverTime + 1000` and
 * `serverTime - timestamp <= recvWindow`) so a request can be pre-validated before it is sent. Pure;
 * no IO.
 */
import { BinanceStreamValidationError } from '../websocket/errors';
import type {
  BinanceBalanceUpdate,
  BinanceSpotExecutionReport,
  BinanceFuturesAccountUpdate,
  BinanceFuturesOrderTradeUpdate,
  BinanceListenKeyExpired,
  BinanceOutboundAccountPosition,
} from './binance-user-events';

type Kind = 'string' | 'number' | 'boolean' | 'array' | 'object';

function kindOf(value: unknown): Kind | 'unknown' {
  if (value === null) return 'unknown';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'object') return t as Kind;
  return 'unknown';
}

function require(
  event: string,
  data: unknown,
  fields: Readonly<Record<string, Kind>>,
): Record<string, unknown> {
  if (kindOf(data) !== 'object')
    throw new BinanceStreamValidationError(event, 'payload is not an object.');
  const obj = data as Record<string, unknown>;
  for (const [key, kind] of Object.entries(fields)) {
    const actual = kindOf(obj[key]);
    if (actual !== kind)
      throw new BinanceStreamValidationError(
        event,
        `field "${key}" expected ${kind}, got ${actual}.`,
      );
  }
  return obj;
}

export class AuthenticationValidator {
  outboundAccountPosition(data: unknown): BinanceOutboundAccountPosition {
    require('outboundAccountPosition', data, { E: 'number', u: 'number', B: 'array' });
    return data as BinanceOutboundAccountPosition;
  }

  balanceUpdate(data: unknown): BinanceBalanceUpdate {
    require('balanceUpdate', data, { E: 'number', a: 'string', d: 'string', T: 'number' });
    return data as BinanceBalanceUpdate;
  }

  executionReport(data: unknown): BinanceSpotExecutionReport {
    require('executionReport', data, {
      E: 'number',
      s: 'string',
      c: 'string',
      S: 'string',
      o: 'string',
      x: 'string',
      X: 'string',
      i: 'number',
      l: 'string',
      z: 'string',
      L: 'string',
      q: 'string',
      p: 'string',
      T: 'number',
      t: 'number',
      m: 'boolean',
    });
    return data as BinanceSpotExecutionReport;
  }

  futuresAccountUpdate(data: unknown): BinanceFuturesAccountUpdate {
    const obj = require('ACCOUNT_UPDATE', data, { E: 'number', T: 'number', a: 'object' });
    require('ACCOUNT_UPDATE.a', obj['a'], { B: 'array', P: 'array' });
    return data as BinanceFuturesAccountUpdate;
  }

  futuresOrderTradeUpdate(data: unknown): BinanceFuturesOrderTradeUpdate {
    const obj = require('ORDER_TRADE_UPDATE', data, { E: 'number', T: 'number', o: 'object' });
    require('ORDER_TRADE_UPDATE.o', obj['o'], {
      s: 'string',
      c: 'string',
      S: 'string',
      o: 'string',
      x: 'string',
      X: 'string',
      i: 'number',
      l: 'string',
      z: 'string',
      L: 'string',
      q: 'string',
      p: 'string',
      T: 'number',
      t: 'number',
      m: 'boolean',
    });
    return data as BinanceFuturesOrderTradeUpdate;
  }

  listenKeyExpired(data: unknown): BinanceListenKeyExpired {
    require('listenKeyExpired', data, { E: 'number' });
    return data as BinanceListenKeyExpired;
  }

  /** Binance's documented signed-request timestamp rule. */
  withinRecvWindow(serverTimeMs: number, timestampMs: number, recvWindowMs: number): boolean {
    return timestampMs <= serverTimeMs + 1000 && serverTimeMs - timestampMs <= recvWindowMs;
  }
}
