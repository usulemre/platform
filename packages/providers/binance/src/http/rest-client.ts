/**
 * `BinanceRestClient` — the typed Binance REST surface (Spot + USDⓈ-M Futures), built on the resilient
 * Common HTTP Client. It owns request construction, signing placement and response unwrapping, but no
 * lifecycle policy: every method is a single logical venue call. SIGNED endpoints receive a
 * `timestamp` (from the injected server-time source), a `recvWindow`, and an HMAC signature as the last
 * query parameter, plus the API-key header; PUBLIC endpoints are sent unsigned. All venue and transport
 * failures are funnelled through the {@link BinanceErrorMapper} so callers only ever see a
 * {@link BinanceError}. The client holds NO secrets — it delegates every secret touch to the injected
 * {@link BinanceAuthentication}.
 */
import {
  ProviderHttpClient,
  type HttpClient,
  type HttpResponse,
  type RequestOptions,
} from '@platform/http-client';
import {
  encodeParams,
  type BinanceAuthentication,
  type BinanceParamValue,
} from '../auth/authentication';
import { REST_PATHS } from '../constants';
import { BinanceErrorMapper } from '../errors';
import type { BinanceConfiguration } from '../config';
import type {
  BinanceAccountInfo,
  BinanceCancelReplaceResponse,
  BinanceCodeMsg,
  BinanceDepth,
  BinanceExchangeInfo,
  BinanceFundingRate,
  BinanceFuturesAccountInfo,
  BinanceFuturesAck,
  BinanceFuturesBalance,
  BinanceKline,
  BinanceLeverageBracket,
  BinanceLeverageResponse,
  BinanceListenKey,
  BinanceOrder,
  BinancePositionMarginResponse,
  BinancePositionRisk,
  BinancePositionSideDual,
  BinancePremiumIndex,
  BinanceServerTime,
  BinanceSpotBalance,
  BinanceUserTrade,
} from '../types/binance';

/** A monotonically-adjusted epoch-millis source (server-synced) for signed requests. */
export type TimestampSource = () => number;

export interface BinanceRestClientDeps {
  readonly config: BinanceConfiguration;
  readonly http: HttpClient;
  readonly auth: BinanceAuthentication;
  readonly timestamp: TimestampSource;
  readonly errorMapper?: BinanceErrorMapper;
}

type Params = Record<string, BinanceParamValue>;

export class BinanceRestClient extends ProviderHttpClient {
  private readonly config: BinanceConfiguration;
  private readonly auth: BinanceAuthentication;
  private readonly timestamp: TimestampSource;
  private readonly errors: BinanceErrorMapper;

  constructor(deps: BinanceRestClientDeps) {
    super({ baseUrl: deps.config.restBaseUrl, http: deps.http });
    this.config = deps.config;
    this.auth = deps.auth;
    this.timestamp = deps.timestamp;
    this.errors = deps.errorMapper ?? new BinanceErrorMapper();
  }

  private path(
    name: keyof (typeof REST_PATHS)['SPOT'] | keyof (typeof REST_PATHS)['FUTURES'],
  ): string {
    const table = REST_PATHS[this.config.market] as Record<string, string>;
    const value = table[name as string];
    if (!value)
      throw this.errors.map(
        new Error(`Endpoint "${String(name)}" is not available on ${this.config.market}.`),
      );
    return value;
  }

  /** Unwrap a JSON response, converting a non-2xx into a canonical Binance error. */
  private unwrap<T>(response: HttpResponse<T>): T {
    if (!response.ok) throw this.errors.fromResponse(response);
    return response.body;
  }

  private absolute(path: string, query?: string): string {
    const base = this.url(path);
    return query ? `${base}?${query}` : base;
  }

  private options(signed: boolean, weight?: number): RequestOptions {
    const headers = signed ? this.auth.authHeaders(this.config) : undefined;
    const metadata = weight ? { rateLimitWeight: weight } : undefined;
    return {
      responseType: 'json',
      ...(headers ? { headers } : {}),
      ...(metadata ? { metadata } : {}),
    };
  }

  /* ------------------------------ public (unsigned) ------------------------------ */

  async ping(): Promise<void> {
    try {
      this.unwrap(await this.http.get(this.absolute(this.path('ping')), this.options(false)));
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  async serverTime(): Promise<BinanceServerTime> {
    try {
      return this.unwrap(
        await this.http.get<BinanceServerTime>(
          this.absolute(this.path('time')),
          this.options(false),
        ),
      );
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  async exchangeInfo(): Promise<BinanceExchangeInfo> {
    try {
      return this.unwrap(
        await this.http.get<BinanceExchangeInfo>(
          this.absolute(this.path('exchangeInfo')),
          this.options(false, 20),
        ),
      );
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  async orderBook(binanceSymbol: string, limit = 100): Promise<BinanceDepth> {
    const query = encodeParams({ symbol: binanceSymbol, limit });
    try {
      return this.unwrap(
        await this.http.get<BinanceDepth>(
          this.absolute(this.path('depth'), query),
          this.options(false, 5),
        ),
      );
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  async klines(
    binanceSymbol: string,
    interval: string,
    limit = 500,
  ): Promise<readonly BinanceKline[]> {
    const query = encodeParams({ symbol: binanceSymbol, interval, limit });
    try {
      return this.unwrap(
        await this.http.get<readonly BinanceKline[]>(
          this.absolute(this.path('klines'), query),
          this.options(false),
        ),
      );
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  /* ------------------------------ signed helpers ------------------------------ */

  private signedQuery(params: Params): string {
    return this.auth.signParams(this.config, {
      ...params,
      recvWindow: this.config.recvWindowMs,
      timestamp: this.timestamp(),
    });
  }

  private async publicGet<T>(path: string, query?: string, weight?: number): Promise<T> {
    try {
      return this.unwrap(
        await this.http.get<T>(this.absolute(path, query), this.options(false, weight)),
      );
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  private async signedGet<T>(path: string, params: Params = {}, weight?: number): Promise<T> {
    try {
      return this.unwrap(
        await this.http.get<T>(
          this.absolute(path, this.signedQuery(params)),
          this.options(true, weight),
        ),
      );
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  private async signedPost<T>(path: string, params: Params = {}): Promise<T> {
    try {
      return this.unwrap(
        await this.http.post<T>(
          this.absolute(path, this.signedQuery(params)),
          undefined,
          this.options(true),
        ),
      );
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  private async signedPut<T>(path: string, params: Params = {}): Promise<T> {
    try {
      return this.unwrap(
        await this.http.put<T>(
          this.absolute(path, this.signedQuery(params)),
          undefined,
          this.options(true),
        ),
      );
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  private async signedDelete<T>(path: string, params: Params = {}): Promise<T> {
    try {
      return this.unwrap(
        await this.http.delete<T>(
          this.absolute(path, this.signedQuery(params)),
          this.options(true),
        ),
      );
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  /* ------------------------------ account (signed) ------------------------------ */

  account(): Promise<BinanceAccountInfo> {
    return this.signedGet<BinanceAccountInfo>(this.path('account'), {}, 10);
  }

  /** Spot balances (derived from account info). */
  async spotBalances(): Promise<readonly BinanceSpotBalance[]> {
    return (await this.account()).balances;
  }

  /** Futures wallet balances. */
  futuresBalances(): Promise<readonly BinanceFuturesBalance[]> {
    return this.signedGet<readonly BinanceFuturesBalance[]>(this.path('balance'), {}, 5);
  }

  /** Futures position risk. */
  positionRisk(binanceSymbol?: string): Promise<readonly BinancePositionRisk[]> {
    return this.signedGet<readonly BinancePositionRisk[]>(
      this.path('positionRisk'),
      binanceSymbol ? { symbol: binanceSymbol } : {},
      5,
    );
  }

  /* ------------------------------ USDⓈ-M Futures-only (signed) — Phase 9.1.7 ------------------------------ */

  /** Full USDⓈ-M Futures account document (`GET /fapi/v2/account`). */
  futuresAccount(): Promise<BinanceFuturesAccountInfo> {
    return this.signedGet<BinanceFuturesAccountInfo>(this.path('account'), {}, 5);
  }

  /** Change initial leverage on a symbol (`POST /fapi/v1/leverage`). */
  setLeverage(binanceSymbol: string, leverage: number): Promise<BinanceLeverageResponse> {
    return this.signedPost<BinanceLeverageResponse>(this.path('leverage'), {
      symbol: binanceSymbol,
      leverage,
    });
  }

  /** Change margin type ISOLATED/CROSSED on a symbol (`POST /fapi/v1/marginType`). */
  setMarginType(binanceSymbol: string, marginType: string): Promise<BinanceCodeMsg> {
    return this.signedPost<BinanceCodeMsg>(this.path('marginType'), {
      symbol: binanceSymbol,
      marginType,
    });
  }

  /** Modify isolated position margin (`POST /fapi/v1/positionMargin`; type 1 = add, 2 = reduce). */
  modifyPositionMargin(params: Params): Promise<BinancePositionMarginResponse> {
    return this.signedPost<BinancePositionMarginResponse>(this.path('positionMargin'), params);
  }

  /** Read the account's position mode (`GET /fapi/v1/positionSide/dual`). */
  positionModeDual(): Promise<BinancePositionSideDual> {
    return this.signedGet<BinancePositionSideDual>(this.path('positionSideDual'), {}, 30);
  }

  /** Change the account's position mode (`POST /fapi/v1/positionSide/dual`). */
  setPositionMode(dualSidePosition: boolean): Promise<BinanceCodeMsg> {
    return this.signedPost<BinanceCodeMsg>(this.path('positionSideDual'), { dualSidePosition });
  }

  /** Mark price & funding data (`GET /fapi/v1/premiumIndex`; public). */
  premiumIndex(
    binanceSymbol?: string,
  ): Promise<BinancePremiumIndex | readonly BinancePremiumIndex[]> {
    const query = binanceSymbol ? encodeParams({ symbol: binanceSymbol }) : undefined;
    return this.publicGet<BinancePremiumIndex | readonly BinancePremiumIndex[]>(
      this.path('premiumIndex'),
      query,
    );
  }

  /** Funding-rate history (`GET /fapi/v1/fundingRate`; public). */
  fundingRateHistory(binanceSymbol?: string, limit = 100): Promise<readonly BinanceFundingRate[]> {
    const query = encodeParams(binanceSymbol ? { symbol: binanceSymbol, limit } : { limit });
    return this.publicGet<readonly BinanceFundingRate[]>(this.path('fundingRate'), query);
  }

  /** Notional & leverage brackets (`GET /fapi/v1/leverageBracket`; signed). */
  leverageBracket(binanceSymbol?: string): Promise<readonly BinanceLeverageBracket[]> {
    return this.signedGet<readonly BinanceLeverageBracket[]>(
      this.path('leverageBracket'),
      binanceSymbol ? { symbol: binanceSymbol } : {},
      1,
    );
  }

  openOrders(binanceSymbol?: string): Promise<readonly BinanceOrder[]> {
    return this.signedGet<readonly BinanceOrder[]>(
      this.path('openOrders'),
      binanceSymbol ? { symbol: binanceSymbol } : {},
      binanceSymbol ? 3 : 40,
    );
  }

  allOrders(binanceSymbol: string, limit = 500): Promise<readonly BinanceOrder[]> {
    return this.signedGet<readonly BinanceOrder[]>(
      this.path('allOrders'),
      { symbol: binanceSymbol, limit },
      10,
    );
  }

  queryOrder(
    binanceSymbol: string,
    ref: { orderId?: number; clientOrderId?: string },
  ): Promise<BinanceOrder> {
    return this.signedGet<BinanceOrder>(this.path('order'), {
      symbol: binanceSymbol,
      orderId: ref.orderId,
      origClientOrderId: ref.clientOrderId,
    });
  }

  myTrades(binanceSymbol: string, limit = 500): Promise<readonly BinanceUserTrade[]> {
    const path = this.config.market === 'FUTURES' ? this.path('userTrades') : this.path('myTrades');
    return this.signedGet<readonly BinanceUserTrade[]>(path, { symbol: binanceSymbol, limit }, 10);
  }

  newOrder(params: Params): Promise<BinanceOrder> {
    return this.signedPost<BinanceOrder>(this.path('order'), params);
  }

  cancelOrder(
    binanceSymbol: string,
    ref: { orderId?: number; clientOrderId?: string },
  ): Promise<BinanceOrder> {
    return this.signedDelete<BinanceOrder>(this.path('order'), {
      symbol: binanceSymbol,
      orderId: ref.orderId,
      origClientOrderId: ref.clientOrderId,
    });
  }

  /**
   * Cancel all open orders on a symbol. Spot (`DELETE /api/v3/openOrders`) returns the cancelled
   * orders; Futures (`DELETE /fapi/v1/allOpenOrders`) returns a `{ code, msg }` acknowledgement.
   */
  cancelAllOrders<T = readonly BinanceOrder[] | BinanceFuturesAck>(
    binanceSymbol: string,
  ): Promise<T> {
    return this.signedDelete<T>(this.path('cancelAllOrders'), { symbol: binanceSymbol });
  }

  /** Spot atomic cancel-and-replace (`POST /api/v3/order/cancelReplace`). */
  cancelReplaceOrder(params: Params): Promise<BinanceCancelReplaceResponse> {
    return this.signedPost<BinanceCancelReplaceResponse>(this.path('cancelReplace'), params);
  }

  /** Futures modify order (`PUT /fapi/v1/order`) — amend price/quantity of a working order. */
  modifyOrder(params: Params): Promise<BinanceOrder> {
    return this.signedPut<BinanceOrder>(this.path('order'), params);
  }

  /* ------------------------------ user data stream ------------------------------ */

  /** Start a user-data stream; returns a listen key. Uses the API-key header, no signature. */
  async startUserDataStream(): Promise<string> {
    try {
      const response = await this.http.post<BinanceListenKey>(
        this.absolute(this.path('listenKey')),
        undefined,
        this.options(true),
      );
      return this.unwrap(response).listenKey;
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  async keepAliveUserDataStream(listenKey: string): Promise<void> {
    const query = this.config.market === 'SPOT' ? encodeParams({ listenKey }) : undefined;
    try {
      this.unwrap(
        await this.http.put(
          this.absolute(this.path('listenKey'), query),
          undefined,
          this.options(true),
        ),
      );
    } catch (error) {
      throw this.errors.map(error);
    }
  }

  async closeUserDataStream(listenKey: string): Promise<void> {
    const query = this.config.market === 'SPOT' ? encodeParams({ listenKey }) : undefined;
    try {
      this.unwrap(
        await this.http.delete(this.absolute(this.path('listenKey'), query), this.options(true)),
      );
    } catch (error) {
      throw this.errors.map(error);
    }
  }
}
