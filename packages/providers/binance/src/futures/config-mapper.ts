/**
 * `BinanceFuturesConfigMapper` — translates the acknowledgement payloads of the USDⓈ-M Futures
 * configuration endpoints (leverage, margin type, position mode, isolated position margin) into their
 * canonical result models. These endpoints return small `{ code, msg }`-style acknowledgements or thin
 * value objects; this mapper keeps that venue vocabulary at the boundary. Symbols are canonicalized via
 * the injected resolver. Pure and deterministic.
 */
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import { toCanonicalMarginType, toPositionMode } from './constants';
import type {
  BinanceCodeMsg,
  BinanceLeverageResponse,
  BinancePositionMarginResponse,
  BinancePositionSideDual,
} from '../types/binance';
import type {
  FuturesLeverage,
  FuturesMarginDirection,
  FuturesMarginType,
  FuturesMarginTypeChange,
  FuturesPositionMarginChange,
  FuturesPositionModeState,
} from './types';

const OK_CODE = 200;

export class BinanceFuturesConfigMapper {
  constructor(private readonly resolver: SymbolResolver = IDENTITY_SYMBOL_RESOLVER) {}

  private symbol(venueSymbol: string): string {
    return this.resolver.toCanonical(venueSymbol);
  }

  /** `POST /fapi/v1/leverage` → canonical leverage result. */
  leverage(response: BinanceLeverageResponse): FuturesLeverage {
    return {
      symbol: this.symbol(response.symbol),
      venueSymbol: response.symbol,
      leverage: response.leverage,
      maxNotionalValue: Number(response.maxNotionalValue) || 0,
    };
  }

  /** `POST /fapi/v1/marginType` → canonical margin-type change. */
  marginType(
    venueSymbol: string,
    requested: FuturesMarginType,
    response: BinanceCodeMsg,
  ): FuturesMarginTypeChange {
    return {
      symbol: this.symbol(venueSymbol),
      venueSymbol,
      marginType: toCanonicalMarginType(requested),
      acknowledged: response.code === OK_CODE,
    };
  }

  /** `GET /fapi/v1/positionSide/dual` → canonical position mode. */
  positionMode(response: BinancePositionSideDual): FuturesPositionModeState {
    return { mode: toPositionMode(response.dualSidePosition) };
  }

  /** `POST /fapi/v1/positionMargin` → canonical isolated-margin change. */
  positionMargin(
    venueSymbol: string,
    direction: FuturesMarginDirection,
    response: BinancePositionMarginResponse,
  ): FuturesPositionMarginChange {
    return {
      symbol: this.symbol(venueSymbol),
      venueSymbol,
      amount: response.amount,
      direction,
      acknowledged: response.code === OK_CODE,
    };
  }
}
