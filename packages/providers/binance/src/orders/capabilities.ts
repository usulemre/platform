/**
 * `BinanceOrderCapabilities` — the truthful, per-market declaration of which order operations, order
 * types, times-in-force and order features Binance officially supports. Spot and Futures differ
 * materially (e.g. `quoteOrderQty` is Spot-only, `reduceOnly`/`positionSide` are Futures-only, Spot
 * returns `fills` on create while Futures does not, Spot replaces via `cancelReplace` while Futures
 * modifies via `PUT`). Deterministic reference data; the validator and request builder consult it so no
 * unsupported feature is ever sent to a market that does not document it.
 */
import type { BinanceMarket } from '../constants';
import type { CanonicalOrderType, CanonicalTimeInForce } from './canonical';

/** The order operations an order service may expose. */
export type OrderOperation = 'CREATE' | 'QUERY' | 'CANCEL' | 'CANCEL_ALL' | 'REPLACE';

interface OrderCapabilityProfile {
  readonly market: BinanceMarket;
  readonly operations: readonly OrderOperation[];
  readonly orderTypes: readonly CanonicalOrderType[];
  readonly timeInForce: readonly CanonicalTimeInForce[];
  /** Spot MARKET orders accept `quoteOrderQty` (spend a quote amount). */
  readonly supportsQuoteQuantity: boolean;
  /** Futures orders accept `reduceOnly` / `positionSide`. */
  readonly supportsReduceOnly: boolean;
  readonly supportsStopPrice: boolean;
  /** Spot returns `fills[]` on create (`newOrderRespType=FULL`); Futures does not. */
  readonly returnsFillsOnCreate: boolean;
}

const SPOT: OrderCapabilityProfile = {
  market: 'SPOT',
  operations: ['CREATE', 'QUERY', 'CANCEL', 'CANCEL_ALL', 'REPLACE'],
  orderTypes: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'TAKE_PROFIT'],
  timeInForce: ['GTC', 'IOC', 'FOK'],
  supportsQuoteQuantity: true,
  supportsReduceOnly: false,
  supportsStopPrice: true,
  returnsFillsOnCreate: true,
};

const FUTURES: OrderCapabilityProfile = {
  market: 'FUTURES',
  operations: ['CREATE', 'QUERY', 'CANCEL', 'CANCEL_ALL', 'REPLACE'],
  orderTypes: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'TAKE_PROFIT'],
  timeInForce: ['GTC', 'IOC', 'FOK'],
  supportsQuoteQuantity: false,
  supportsReduceOnly: true,
  supportsStopPrice: true,
  returnsFillsOnCreate: false,
};

export class BinanceOrderCapabilities {
  private readonly profile: OrderCapabilityProfile;

  constructor(market: BinanceMarket) {
    this.profile = market === 'FUTURES' ? FUTURES : SPOT;
  }

  get market(): BinanceMarket {
    return this.profile.market;
  }

  supportsOperation(operation: OrderOperation): boolean {
    return this.profile.operations.includes(operation);
  }

  supportsOrderType(type: CanonicalOrderType): boolean {
    return this.profile.orderTypes.includes(type);
  }

  supportsTimeInForce(tif: CanonicalTimeInForce): boolean {
    return this.profile.timeInForce.includes(tif);
  }

  get supportsQuoteQuantity(): boolean {
    return this.profile.supportsQuoteQuantity;
  }

  get supportsReduceOnly(): boolean {
    return this.profile.supportsReduceOnly;
  }

  get returnsFillsOnCreate(): boolean {
    return this.profile.returnsFillsOnCreate;
  }

  /** The full immutable profile (for introspection / UI). */
  describe(): OrderCapabilityProfile {
    return this.profile;
  }
}
