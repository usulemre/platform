/**
 * `BinanceFuturesRequestBuilder` — builds the officially-documented USDⓈ-M Futures request parameter
 * sets from canonical inputs, for every Futures operation (create/modify order, position-margin change,
 * config reads/writes). It encodes the Futures order semantics that differ from Spot: `positionSide`
 * (hedge mode), `reduceOnly`, `closePosition`, `activationPrice`/`callbackRate` (trailing stop),
 * `workingType` and `priceProtection`, and the Futures order-type names (`STOP_MARKET`, `STOP`, …).
 * Symbols are translated through the reused {@link BinanceSymbolMapper}. Pure and deterministic — it
 * only *builds* parameters; it never sends a request and enforces no policy (the validator's job).
 */
import { toBinanceSide } from '../mappers/parse';
import { BinanceSymbolMapper } from '../mappers/symbol-mapper';
import { toFuturesOrderType } from './constants';
import type { BinanceParamValue } from '../auth/authentication';
import type { OrderReference } from '../orders/request-builder';
import type { FuturesMarginDirection, FuturesOrderRequest, PositionSide } from './types';

type Params = Record<string, BinanceParamValue>;

/** A canonical Futures modify request (amend price/quantity of a working order). */
export interface FuturesModifyRequest {
  readonly symbol: string;
  readonly side: FuturesOrderRequest['side'];
  readonly quantity: number;
  readonly price?: number;
  readonly reference: OrderReference;
}

function orderRefParams(reference: OrderReference): Params {
  return { orderId: reference.orderId, origClientOrderId: reference.clientOrderId };
}

export class BinanceFuturesRequestBuilder {
  private readonly symbols = new BinanceSymbolMapper('FUTURES');

  /** The venue symbol for a canonical symbol. */
  venueSymbol(canonicalSymbol: string): string {
    return this.symbols.toBinance(canonicalSymbol);
  }

  /** Build the `POST /fapi/v1/order` parameters for a create request. */
  buildCreate(request: FuturesOrderRequest): Params {
    const hasPrice = request.price !== undefined;
    const type = toFuturesOrderType(request.type, hasPrice);
    const params: Params = {
      symbol: this.venueSymbol(request.symbol),
      side: toBinanceSide(request.side),
      type,
      // RESULT gives the fully-evaluated order back (Futures has no FULL/fills-on-create).
      newOrderRespType: 'RESULT',
    };

    if (request.positionSide) params['positionSide'] = request.positionSide;

    // `closePosition` closes the whole position and MUST NOT be combined with a quantity.
    if (request.closePosition) {
      params['closePosition'] = true;
    } else {
      params['quantity'] = request.quantity;
      // reduceOnly is only meaningful in one-way mode and is incompatible with closePosition.
      if (request.reduceOnly) params['reduceOnly'] = true;
    }

    const isLimit = type === 'LIMIT' || type === 'STOP' || type === 'TAKE_PROFIT';
    if (hasPrice && isLimit) {
      params['price'] = request.price;
      params['timeInForce'] = request.timeInForce ?? 'GTC';
    }

    if (request.stopPrice !== undefined) params['stopPrice'] = request.stopPrice;
    if (request.type === 'TRAILING_STOP') {
      if (request.activationPrice !== undefined)
        params['activationPrice'] = request.activationPrice;
      if (request.callbackRate !== undefined) params['callbackRate'] = request.callbackRate;
    }
    if (request.workingType) params['workingType'] = request.workingType;
    if (request.priceProtection !== undefined)
      params['priceProtect'] = request.priceProtection ? 'TRUE' : 'FALSE';
    if (request.clientOrderId) params['newClientOrderId'] = request.clientOrderId;
    return params;
  }

  /** Build the `PUT /fapi/v1/order` modify parameters (amend price/quantity of a working order). */
  buildModify(request: FuturesModifyRequest): Params {
    return {
      symbol: this.venueSymbol(request.symbol),
      side: toBinanceSide(request.side),
      quantity: request.quantity,
      price: request.price,
      ...orderRefParams(request.reference),
    };
  }

  /** Build query/cancel parameters for a single order. */
  buildOrderRef(canonicalSymbol: string, reference: OrderReference): Params {
    return { symbol: this.venueSymbol(canonicalSymbol), ...orderRefParams(reference) };
  }

  /** Build `POST /fapi/v1/positionMargin` parameters (type 1 = add, 2 = reduce). */
  buildPositionMargin(
    canonicalSymbol: string,
    amount: number,
    direction: FuturesMarginDirection,
    positionSide?: PositionSide,
  ): Params {
    const params: Params = {
      symbol: this.venueSymbol(canonicalSymbol),
      amount,
      type: direction === 'ADD' ? 1 : 2,
    };
    if (positionSide) params['positionSide'] = positionSide;
    return params;
  }
}
