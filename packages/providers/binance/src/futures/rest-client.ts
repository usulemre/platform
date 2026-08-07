/**
 * `BinanceFuturesRestClient` — the default adapter binding the USDⓈ-M Futures REST ports
 * ({@link ./client}) to the resilient, signed {@link ../http/rest-client}.BinanceRestClient. It adds no
 * transport, signing or resilience of its own — it simply organizes the already-implemented Futures
 * endpoints (order, account, leverage, margin type, position mode, isolated margin, mark price,
 * funding, leverage brackets) behind the Futures ports so the services stay decoupled and testable. It
 * holds no secrets and enforces no policy.
 */
import type { BinanceRestClient } from '../http/rest-client';
import type { BinanceParamRecord, BinanceFuturesClientPort, OrderRef } from './client';
import type {
  BinanceCodeMsg,
  BinanceFundingRate,
  BinanceFuturesAccountInfo,
  BinanceFuturesAck,
  BinanceFuturesBalance,
  BinanceLeverageBracket,
  BinanceLeverageResponse,
  BinanceOrder,
  BinancePositionMarginResponse,
  BinancePositionRisk,
  BinancePositionSideDual,
  BinancePremiumIndex,
  BinanceUserTrade,
} from '../types/binance';

export class BinanceFuturesRestClient implements BinanceFuturesClientPort {
  constructor(private readonly rest: BinanceRestClient) {}

  /* ------------------------------ trading ------------------------------ */

  createOrder(params: BinanceParamRecord): Promise<BinanceOrder> {
    return this.rest.newOrder(params);
  }
  queryOrder(venueSymbol: string, ref: OrderRef): Promise<BinanceOrder> {
    return this.rest.queryOrder(venueSymbol, ref);
  }
  cancelOrder(venueSymbol: string, ref: OrderRef): Promise<BinanceOrder> {
    return this.rest.cancelOrder(venueSymbol, ref);
  }
  cancelAllOrders(venueSymbol: string): Promise<BinanceFuturesAck> {
    return this.rest.cancelAllOrders<BinanceFuturesAck>(venueSymbol);
  }
  modifyOrder(params: BinanceParamRecord): Promise<BinanceOrder> {
    return this.rest.modifyOrder(params);
  }
  openOrders(venueSymbol?: string): Promise<readonly BinanceOrder[]> {
    return this.rest.openOrders(venueSymbol);
  }
  userTrades(venueSymbol: string): Promise<readonly BinanceUserTrade[]> {
    return this.rest.myTrades(venueSymbol);
  }

  /* ------------------------------ account ------------------------------ */

  account(): Promise<BinanceFuturesAccountInfo> {
    return this.rest.futuresAccount();
  }
  balances(): Promise<readonly BinanceFuturesBalance[]> {
    return this.rest.futuresBalances();
  }
  positionRisk(venueSymbol?: string): Promise<readonly BinancePositionRisk[]> {
    return this.rest.positionRisk(venueSymbol);
  }

  /* ------------------------------ configuration ------------------------------ */

  setLeverage(venueSymbol: string, leverage: number): Promise<BinanceLeverageResponse> {
    return this.rest.setLeverage(venueSymbol, leverage);
  }
  setMarginType(venueSymbol: string, marginType: string): Promise<BinanceCodeMsg> {
    return this.rest.setMarginType(venueSymbol, marginType);
  }
  modifyPositionMargin(params: BinanceParamRecord): Promise<BinancePositionMarginResponse> {
    return this.rest.modifyPositionMargin(params);
  }
  getPositionMode(): Promise<BinancePositionSideDual> {
    return this.rest.positionModeDual();
  }
  setPositionMode(dualSidePosition: boolean): Promise<BinanceCodeMsg> {
    return this.rest.setPositionMode(dualSidePosition);
  }
  leverageBracket(venueSymbol?: string): Promise<readonly BinanceLeverageBracket[]> {
    return this.rest.leverageBracket(venueSymbol);
  }

  /* ------------------------------ market data ------------------------------ */

  premiumIndex(
    venueSymbol?: string,
  ): Promise<BinancePremiumIndex | readonly BinancePremiumIndex[]> {
    return this.rest.premiumIndex(venueSymbol);
  }
  fundingRateHistory(venueSymbol?: string, limit?: number): Promise<readonly BinanceFundingRate[]> {
    return this.rest.fundingRateHistory(venueSymbol, limit);
  }
}
