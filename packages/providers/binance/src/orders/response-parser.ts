/**
 * `BinanceOrderResponseParser` — turns a raw Binance order/create/replace response into the canonical
 * {@link CanonicalOrderResponse} (the order projected onto the neutral model, plus its fills and
 * aggregated commissions). It reuses the provider's {@link BinanceOrderMapper} for the order projection
 * and the fill/commission mappers for the execution detail. Pure and deterministic.
 */
import { BinanceFillMapper } from './fill-mapper';
import { BinanceCommissionMapper } from './commission-mapper';
import type { BinanceOrderMapper } from '../mappers/order-mapper';
import type {
  BinanceCancelReplaceResponse,
  BinanceOrder,
  BinanceSymbolInfo,
} from '../types/binance';
import type { CanonicalOrder, CanonicalOrderResponse } from './canonical';

function isOrder(value: unknown): value is BinanceOrder {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as BinanceOrder).orderId === 'number'
  );
}

export class BinanceOrderResponseParser {
  constructor(
    private readonly orderMapper: BinanceOrderMapper,
    private readonly fills: BinanceFillMapper = new BinanceFillMapper(),
    private readonly commissions: BinanceCommissionMapper = new BinanceCommissionMapper(),
  ) {}

  /** Project a raw order onto the canonical order (no fills). */
  parseOrder(order: BinanceOrder, info?: BinanceSymbolInfo): CanonicalOrder {
    return this.orderMapper.toCanonical(order, info);
  }

  /** Parse a full order response (order + fills + aggregated commissions). */
  parse(order: BinanceOrder, info?: BinanceSymbolInfo): CanonicalOrderResponse {
    const fills = this.fills.toCanonicalMany(order.fills);
    return {
      order: this.orderMapper.toCanonical(order, info),
      fills,
      commissions: this.commissions.aggregate(fills),
      transactTime: order.transactTime ?? order.workingTime ?? order.updateTime,
    };
  }

  /** Parse a Spot `cancelReplace` response (from its `newOrderResponse`). Returns null if absent. */
  parseCancelReplace(
    response: BinanceCancelReplaceResponse,
    info?: BinanceSymbolInfo,
  ): CanonicalOrderResponse | null {
    return isOrder(response.newOrderResponse) ? this.parse(response.newOrderResponse, info) : null;
  }
}
