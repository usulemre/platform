/**
 * `BinanceFuturesOrderMapper` — raw Binance Futures order ⇄ canonical {@link FuturesOrder}. It projects
 * a venue order (`POST/GET/PUT/DELETE /fapi/v1/order`) onto the canonical Futures order, preserving the
 * Futures-only fields (`positionSide`, `reduceOnly`, `closePosition`, `workingType`, stop/activation
 * price) alongside the base canonical order shape. USDⓈ-M Futures returns no `fills[]` on create, so a
 * create response carries the order and an empty fill set (fills are read from user trades). Symbol
 * translation is delegated to the reused {@link BinanceSymbolMapper}; numeric parsing to `../mappers/parse`.
 */
import {
  isoFromMillis,
  num,
  toCanonicalSide,
  toCanonicalStatus,
  toCanonicalTif,
} from '../mappers/parse';
import { BinanceSymbolMapper } from '../mappers/symbol-mapper';
import { fromFuturesOrderType, toCanonicalMarginType, toCanonicalPositionSide } from './constants';
import type { BinanceOrder, BinanceSymbolInfo } from '../types/binance';
import type { FuturesOrder, FuturesOrderResponse, FuturesWorkingType } from './types';

function workingType(value: string | undefined): FuturesWorkingType | undefined {
  if (!value) return undefined;
  return value.toUpperCase() === 'MARK_PRICE' ? 'MARK_PRICE' : 'CONTRACT_PRICE';
}

export class BinanceFuturesOrderMapper {
  private readonly symbols = new BinanceSymbolMapper('FUTURES');

  /** Raw Binance Futures order → canonical Futures order. */
  toCanonical(order: BinanceOrder, info?: BinanceSymbolInfo): FuturesOrder {
    const quantity = num(order.origQty);
    const filled = num(order.executedQty);
    const price = num(order.price);
    const avg = num(order.avgPrice);
    return {
      venueOrderId: String(order.orderId),
      clientOrderId: order.clientOrderId,
      symbol: this.symbols.toCanonicalSymbol(order.symbol, info),
      side: toCanonicalSide(order.side),
      type: fromFuturesOrderType(order.origType ?? order.type),
      status: toCanonicalStatus(order.status),
      quantity,
      filledQuantity: filled,
      remainingQuantity: Math.max(0, quantity - filled),
      price: price > 0 ? price : undefined,
      averagePrice: avg > 0 ? avg : undefined,
      timeInForce: toCanonicalTif(order.timeInForce),
      reduceOnly: order.reduceOnly,
      positionSide: toCanonicalPositionSide(order.positionSide),
      closePosition: order.closePosition,
      stopPrice: order.stopPrice !== undefined ? num(order.stopPrice) || undefined : undefined,
      workingType: workingType(order.workingType),
      createdAt: isoFromMillis(order.time),
      updatedAt: isoFromMillis(order.updateTime ?? order.transactTime),
    };
  }

  /** A create/replace response: the canonical order with no create-time fills (Futures convention). */
  toResponse(order: BinanceOrder, info?: BinanceSymbolInfo): FuturesOrderResponse {
    return {
      order: this.toCanonical(order, info),
      fills: [],
      commissions: [],
      transactTime: order.updateTime ?? order.transactTime,
    };
  }

  /** Map many venue orders. */
  toCanonicalMany(
    orders: readonly BinanceOrder[],
    info?: (venueSymbol: string) => BinanceSymbolInfo | undefined,
  ): readonly FuturesOrder[] {
    return orders.map((o) => this.toCanonical(o, info?.(o.symbol)));
  }
}

/** Re-exported for the position mapper's convenience (margin-type normalization shares this rule). */
export { toCanonicalMarginType };
