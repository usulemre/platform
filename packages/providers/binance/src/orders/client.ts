/**
 * `BinanceOrderClient` — the port the order service needs from the venue's order REST API, plus the
 * default adapter over the existing resilient {@link BinanceRestClient}. This is the Hexagonal seam:
 * the order service depends only on this interface, and the adapter reuses the already-implemented,
 * signed, resilient REST calls (retry / circuit-breaker / rate-limit) — no HTTP is reimplemented. It
 * exposes only the documented order operations for the configured market; it enforces no policy.
 */
import type { BinanceRestClient } from '../http/rest-client';
import type { BinanceParamValue } from '../auth/authentication';
import type {
  BinanceCancelReplaceResponse,
  BinanceFuturesAck,
  BinanceOrder,
  BinanceUserTrade,
} from '../types/binance';

/** A Binance request parameter record. */
export type BinanceParamRecord = Record<string, BinanceParamValue>;

/** A reference to an existing order (by venue id or client id). */
export interface OrderRef {
  readonly orderId?: number;
  readonly clientOrderId?: string;
}

export interface BinanceOrderClient {
  createOrder(params: BinanceParamRecord): Promise<BinanceOrder>;
  queryOrder(venueSymbol: string, ref: OrderRef): Promise<BinanceOrder>;
  cancelOrder(venueSymbol: string, ref: OrderRef): Promise<BinanceOrder>;
  cancelAllOrders(venueSymbol: string): Promise<readonly BinanceOrder[] | BinanceFuturesAck>;
  cancelReplaceOrder(params: BinanceParamRecord): Promise<BinanceCancelReplaceResponse>;
  modifyOrder(params: BinanceParamRecord): Promise<BinanceOrder>;
  openOrders(venueSymbol?: string): Promise<readonly BinanceOrder[]>;
  myTrades(venueSymbol: string): Promise<readonly BinanceUserTrade[]>;
}

/** Default adapter binding the port to the resilient `BinanceRestClient`. */
export class BinanceRestOrderClient implements BinanceOrderClient {
  constructor(private readonly rest: BinanceRestClient) {}

  createOrder(params: BinanceParamRecord): Promise<BinanceOrder> {
    return this.rest.newOrder(params);
  }
  queryOrder(venueSymbol: string, ref: OrderRef): Promise<BinanceOrder> {
    return this.rest.queryOrder(venueSymbol, ref);
  }
  cancelOrder(venueSymbol: string, ref: OrderRef): Promise<BinanceOrder> {
    return this.rest.cancelOrder(venueSymbol, ref);
  }
  cancelAllOrders(venueSymbol: string): Promise<readonly BinanceOrder[] | BinanceFuturesAck> {
    return this.rest.cancelAllOrders(venueSymbol);
  }
  cancelReplaceOrder(params: BinanceParamRecord): Promise<BinanceCancelReplaceResponse> {
    return this.rest.cancelReplaceOrder(params);
  }
  modifyOrder(params: BinanceParamRecord): Promise<BinanceOrder> {
    return this.rest.modifyOrder(params);
  }
  openOrders(venueSymbol?: string): Promise<readonly BinanceOrder[]> {
    return this.rest.openOrders(venueSymbol);
  }
  myTrades(venueSymbol: string): Promise<readonly BinanceUserTrade[]> {
    return this.rest.myTrades(venueSymbol);
  }
}
