/**
 * `BinanceExecutionMapper` — a Binance user-data `executionReport` / futures `ORDER_TRADE_UPDATE`
 * event → canonical {@link CanonicalExecution}. This is the streaming counterpart to the order mapper:
 * it captures an order state change (last fill, cumulative fill, status) rather than a static snapshot.
 */
import { isoFromMillis, num, toCanonicalSide, toCanonicalStatus, toCanonicalType } from './parse';
import type { BinanceSymbolMapper } from './symbol-mapper';
import type { BinanceExecutionReport, BinanceSymbolInfo } from '../types/binance';
import type { CanonicalExecution } from '../types/canonical';

export class BinanceExecutionMapper {
  constructor(private readonly symbols: BinanceSymbolMapper) {}

  toCanonical(event: BinanceExecutionReport, info?: BinanceSymbolInfo): CanonicalExecution {
    return {
      venueOrderId: String(event.i),
      clientOrderId: event.c,
      symbol: this.symbols.toCanonicalSymbol(event.s, info),
      side: toCanonicalSide(event.S),
      status: toCanonicalStatus(event.X),
      lastFilledQuantity: num(event.l),
      cumulativeFilledQuantity: num(event.z),
      lastFilledPrice: num(event.L),
      orderType: toCanonicalType(event.o),
      eventAt: isoFromMillis(event.E) ?? new Date(0).toISOString(),
    };
  }
}
