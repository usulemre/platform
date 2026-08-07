/**
 * The USDⓈ-M Futures REST **ports** — the Hexagonal seams the Futures services depend on, grouped by
 * concern (trading, account, configuration, market data). The services depend only on these interfaces;
 * the default adapter ({@link ./rest-client}.BinanceFuturesRestClient) binds them to the resilient
 * {@link ../http/rest-client}.BinanceRestClient, so no HTTP, signing or resilience is reimplemented.
 * Ports expose only documented Futures operations; they enforce no policy.
 */
import type { BinanceParamValue } from '../auth/authentication';
import type { OrderRef } from '../orders/client';
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

/** A Binance request parameter record. */
export type BinanceParamRecord = Record<string, BinanceParamValue>;

export type { OrderRef };

/** Futures order operations (`/fapi/v1/order`, `/fapi/v1/openOrders`, `/fapi/v1/userTrades`). */
export interface FuturesTradingClient {
  createOrder(params: BinanceParamRecord): Promise<BinanceOrder>;
  queryOrder(venueSymbol: string, ref: OrderRef): Promise<BinanceOrder>;
  cancelOrder(venueSymbol: string, ref: OrderRef): Promise<BinanceOrder>;
  cancelAllOrders(venueSymbol: string): Promise<BinanceFuturesAck>;
  modifyOrder(params: BinanceParamRecord): Promise<BinanceOrder>;
  openOrders(venueSymbol?: string): Promise<readonly BinanceOrder[]>;
  userTrades(venueSymbol: string): Promise<readonly BinanceUserTrade[]>;
}

/** Futures account reads (`/fapi/v2/account`, `/fapi/v2/balance`, `/fapi/v2/positionRisk`). */
export interface FuturesAccountClient {
  account(): Promise<BinanceFuturesAccountInfo>;
  balances(): Promise<readonly BinanceFuturesBalance[]>;
  positionRisk(venueSymbol?: string): Promise<readonly BinancePositionRisk[]>;
}

/** Futures configuration operations (leverage, margin type, position mode, isolated margin). */
export interface FuturesConfigClient {
  setLeverage(venueSymbol: string, leverage: number): Promise<BinanceLeverageResponse>;
  setMarginType(venueSymbol: string, marginType: string): Promise<BinanceCodeMsg>;
  modifyPositionMargin(params: BinanceParamRecord): Promise<BinancePositionMarginResponse>;
  getPositionMode(): Promise<BinancePositionSideDual>;
  setPositionMode(dualSidePosition: boolean): Promise<BinanceCodeMsg>;
  leverageBracket(venueSymbol?: string): Promise<readonly BinanceLeverageBracket[]>;
}

/** Futures market-data reads with no Spot equivalent (mark price / funding). */
export interface FuturesMarketDataClient {
  premiumIndex(venueSymbol?: string): Promise<BinancePremiumIndex | readonly BinancePremiumIndex[]>;
  fundingRateHistory(venueSymbol?: string, limit?: number): Promise<readonly BinanceFundingRate[]>;
}

/** The full USDⓈ-M Futures REST port (the union the default adapter implements). */
export interface BinanceFuturesClientPort
  extends FuturesTradingClient,
    FuturesAccountClient,
    FuturesConfigClient,
    FuturesMarketDataClient {}
