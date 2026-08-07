/**
 * `TradingRuleMapper` — distils a symbol's canonical filters into an actionable {@link TradingRule}
 * (min/max price, tick, min/max quantity, step, notional bounds, order-count cap). Where the order
 * mapper *builds* orders, this exposes the constraints an order must satisfy — but it enforces nothing
 * and submits nothing (no trading logic). Pure and deterministic; consumes the canonical filters so it
 * never touches Binance field names.
 */
import type { ExchangeFilter, TradingRule } from './types';

function paramOf(
  filters: readonly ExchangeFilter[],
  type: ExchangeFilter['type'],
  key: string,
): number | undefined {
  const value = filters.find((f) => f.type === type)?.params[key];
  return value !== undefined && value > 0 ? value : undefined;
}

export class TradingRuleMapper {
  toCanonical(filters: readonly ExchangeFilter[]): TradingRule {
    const maxNumOrders = filters.find((f) => f.type === 'MAX_NUM_ORDERS')?.params['maxNumOrders'];
    return {
      minPrice: paramOf(filters, 'PRICE', 'minPrice'),
      maxPrice: paramOf(filters, 'PRICE', 'maxPrice'),
      tickSize: paramOf(filters, 'PRICE', 'tickSize'),
      minQuantity: paramOf(filters, 'LOT_SIZE', 'minQty'),
      maxQuantity: paramOf(filters, 'LOT_SIZE', 'maxQty'),
      stepSize: paramOf(filters, 'LOT_SIZE', 'stepSize'),
      minNotional: paramOf(filters, 'MIN_NOTIONAL', 'minNotional'),
      maxNotional: paramOf(filters, 'MIN_NOTIONAL', 'maxNotional'),
      maxNumOrders: maxNumOrders !== undefined && maxNumOrders > 0 ? maxNumOrders : undefined,
    };
  }
}
