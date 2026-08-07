/**
 * `BinanceOrderMapper` — canonical ⇄ Binance order translation, both directions:
 *  - {@link toBinanceParams} turns a {@link CanonicalOrderRequest} into the venue's `newOrder` params.
 *  - {@link toCanonical} projects a raw {@link BinanceOrder} onto the neutral {@link CanonicalOrder}.
 *  - {@link toSyncRecord} projects onto the Broker Gateway SDK's {@link OrderSyncRecord} (the shape the
 *    gateway's account-synchronization read returns).
 * Symbol translation is delegated to the {@link BinanceSymbolMapper}; numeric parsing to `./parse`.
 */
import {
  isoFromMillis,
  num,
  toBinanceSide,
  toBinanceType,
  toCanonicalSide,
  toCanonicalStatus,
  toCanonicalTif,
  toCanonicalType,
} from './parse';
import type { BinanceSymbolMapper } from './symbol-mapper';
import type { BinanceOrder, BinanceSymbolInfo } from '../types/binance';
import type { CanonicalOrder, CanonicalOrderRequest, OrderSyncRecord } from '../types/canonical';
import type { BinanceParamValue } from '../auth/authentication';

export class BinanceOrderMapper {
  constructor(private readonly symbols: BinanceSymbolMapper) {}

  /** Canonical submission intent → Binance `newOrder` parameters. */
  toBinanceParams(request: CanonicalOrderRequest): Record<string, BinanceParamValue> {
    const type = toBinanceType(request.type);
    const params: Record<string, BinanceParamValue> = {
      symbol: this.symbols.toBinance(request.symbol),
      side: toBinanceSide(request.side),
      type,
      quantity: request.quantity,
    };
    const isLimit = type.endsWith('LIMIT') || type === 'LIMIT';
    if (request.price !== undefined && isLimit) {
      params['price'] = request.price;
      params['timeInForce'] = request.timeInForce ?? 'GTC';
    }
    if (request.stopPrice !== undefined) params['stopPrice'] = request.stopPrice;
    if (request.clientOrderId) params['newClientOrderId'] = request.clientOrderId;
    if (request.reduceOnly) params['reduceOnly'] = true;
    return params;
  }

  /** Raw Binance order → canonical order. */
  toCanonical(order: BinanceOrder, info?: BinanceSymbolInfo): CanonicalOrder {
    const quantity = num(order.origQty);
    const filled = num(order.executedQty);
    return {
      venueOrderId: String(order.orderId),
      clientOrderId: order.clientOrderId,
      symbol: this.symbols.toCanonicalSymbol(order.symbol, info),
      side: toCanonicalSide(order.side),
      type: toCanonicalType(order.type),
      status: toCanonicalStatus(order.status),
      quantity,
      filledQuantity: filled,
      remainingQuantity: Math.max(0, quantity - filled),
      price: order.price ? num(order.price) : undefined,
      averagePrice: order.avgPrice ? num(order.avgPrice) : undefined,
      timeInForce: toCanonicalTif(order.timeInForce),
      reduceOnly: order.reduceOnly,
      createdAt: isoFromMillis(order.time ?? order.transactTime),
      updatedAt: isoFromMillis(order.updateTime ?? order.transactTime),
    };
  }

  /** Raw Binance order → Broker Gateway SDK order-sync record. */
  toSyncRecord(order: BinanceOrder, info?: BinanceSymbolInfo): OrderSyncRecord {
    const quantity = num(order.origQty);
    const filled = num(order.executedQty);
    return {
      brokerOrderId: String(order.orderId),
      clientOrderId: order.clientOrderId,
      symbol: this.symbols.toCanonicalSymbol(order.symbol, info),
      status: toCanonicalStatus(order.status),
      filledQuantity: filled,
      remainingQuantity: Math.max(0, quantity - filled),
    };
  }
}
