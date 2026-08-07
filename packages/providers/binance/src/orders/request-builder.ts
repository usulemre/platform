/**
 * `BinanceOrderRequestBuilder` — builds the officially-documented Binance request parameter sets for
 * every order operation (create, query, cancel, cancel-all, replace/modify) from canonical inputs. It
 * is market-aware: order-type names differ between Spot (`STOP_LOSS`, `TAKE_PROFIT_LIMIT`, …) and
 * USDⓈ-M Futures (`STOP_MARKET`, `STOP`, …), Spot MARKET orders may use `quoteOrderQty`, Futures orders
 * may set `reduceOnly`, and Spot requests `newOrderRespType=FULL` to receive fills. Symbol names are
 * translated through the reused {@link BinanceSymbolMapper}. Pure and deterministic; it only *builds*
 * parameters — it never sends a request and enforces no policy (that is the validator's job).
 */
import { toBinanceSide } from '../mappers/parse';
import { BinanceSymbolMapper } from '../mappers/symbol-mapper';
import type { BinanceMarket } from '../constants';
import type { BinanceParamValue } from '../auth/authentication';
import type { CanonicalOrderRequest, CanonicalOrderType } from './canonical';

type Params = Record<string, BinanceParamValue>;

/** A reference to an existing order (by venue id or client id). */
export interface OrderReference {
  readonly orderId?: number;
  readonly clientOrderId?: string;
}

/** Parameters for a Spot cancel-replace / Futures modify. */
export interface ReplaceOrderRequest extends CanonicalOrderRequest {
  readonly reference: OrderReference;
}

function toBinanceOrderType(
  market: BinanceMarket,
  type: CanonicalOrderType,
  hasPrice: boolean,
): string {
  if (market === 'FUTURES') {
    switch (type) {
      case 'MARKET':
        return 'MARKET';
      case 'LIMIT':
        return 'LIMIT';
      case 'STOP':
        return 'STOP_MARKET';
      case 'STOP_LIMIT':
        return 'STOP';
      case 'TAKE_PROFIT':
        return hasPrice ? 'TAKE_PROFIT' : 'TAKE_PROFIT_MARKET';
    }
  }
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
      return hasPrice ? 'TAKE_PROFIT_LIMIT' : 'TAKE_PROFIT';
  }
}

function orderRefParams(reference: OrderReference): Params {
  return { orderId: reference.orderId, origClientOrderId: reference.clientOrderId };
}

export class BinanceOrderRequestBuilder {
  private readonly symbols: BinanceSymbolMapper;

  constructor(private readonly market: BinanceMarket) {
    this.symbols = new BinanceSymbolMapper(market);
  }

  /** The venue symbol for a canonical symbol. */
  venueSymbol(canonicalSymbol: string): string {
    return this.symbols.toBinance(canonicalSymbol);
  }

  /** Build the `newOrder` parameters for a create request. */
  buildCreate(request: CanonicalOrderRequest): Params {
    const type = toBinanceOrderType(this.market, request.type, request.price !== undefined);
    const params: Params = {
      symbol: this.venueSymbol(request.symbol),
      side: toBinanceSide(request.side),
      type,
    };

    if (
      this.market === 'SPOT' &&
      request.type === 'MARKET' &&
      request.quoteQuantity !== undefined
    ) {
      params['quoteOrderQty'] = request.quoteQuantity;
    } else {
      params['quantity'] = request.quantity;
    }

    const isLimit = type === 'LIMIT' || type.endsWith('LIMIT');
    if (request.price !== undefined && isLimit) {
      params['price'] = request.price;
      params['timeInForce'] = request.timeInForce ?? 'GTC';
    }
    if (request.stopPrice !== undefined) params['stopPrice'] = request.stopPrice;
    if (request.clientOrderId) params['newClientOrderId'] = request.clientOrderId;
    if (this.market === 'FUTURES' && request.reduceOnly) params['reduceOnly'] = true;
    if (this.market === 'SPOT') params['newOrderRespType'] = 'FULL';
    return params;
  }

  /** Build query parameters for a single order lookup. */
  buildQuery(canonicalSymbol: string, reference: OrderReference): Params {
    return { symbol: this.venueSymbol(canonicalSymbol), ...orderRefParams(reference) };
  }

  /** Build cancel parameters for a single order. */
  buildCancel(canonicalSymbol: string, reference: OrderReference): Params {
    return { symbol: this.venueSymbol(canonicalSymbol), ...orderRefParams(reference) };
  }

  /** Build cancel-all parameters for a symbol. */
  buildCancelAll(canonicalSymbol: string): Params {
    return { symbol: this.venueSymbol(canonicalSymbol) };
  }

  /** Build Spot `cancelReplace` parameters (atomic cancel + new order). */
  buildCancelReplace(request: ReplaceOrderRequest): Params {
    return {
      ...this.buildCreate(request),
      cancelReplaceMode: 'STOP_ON_FAILURE',
      cancelOrderId: request.reference.orderId,
      cancelOrigClientOrderId: request.reference.clientOrderId,
    };
  }

  /** Build Futures `PUT /fapi/v1/order` modify parameters (amend price/quantity of a working order). */
  buildModify(request: ReplaceOrderRequest): Params {
    return {
      symbol: this.venueSymbol(request.symbol),
      side: toBinanceSide(request.side),
      quantity: request.quantity,
      price: request.price,
      ...orderRefParams(request.reference),
    };
  }
}
