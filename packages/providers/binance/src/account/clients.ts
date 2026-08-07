/**
 * The account read clients — the Hexagonal ports the synchronization layer needs from the venue's
 * authenticated REST API, plus default adapters over the existing resilient {@link BinanceRestClient}.
 * The services depend only on these interfaces; the adapters reuse the already-implemented, signed,
 * resilient REST calls (no HTTP reimplemented). They expose ONLY account-state reads — never order
 * placement. Positions are Futures-only (Spot has no position book).
 */
import type { BinanceRestClient } from '../http/rest-client';
import type {
  BinanceAccountInfo,
  BinanceFuturesBalance,
  BinancePositionRisk,
  BinanceSpotBalance,
} from '../types/binance';

/** Reads the account information document. */
export interface BinanceAccountClient {
  account(): Promise<BinanceAccountInfo>;
}

/** Reads asset balances (Spot free/locked, or Futures wallet balances). */
export interface BinanceBalanceClient {
  spotBalances(): Promise<readonly BinanceSpotBalance[]>;
  futuresBalances(): Promise<readonly BinanceFuturesBalance[]>;
}

/** Reads open positions (Futures only). */
export interface BinancePositionClient {
  positionRisk(): Promise<readonly BinancePositionRisk[]>;
}

/** Default account-client adapter over `BinanceRestClient`. */
export class BinanceRestAccountClient implements BinanceAccountClient {
  constructor(private readonly rest: BinanceRestClient) {}
  account(): Promise<BinanceAccountInfo> {
    return this.rest.account();
  }
}

/** Default balance-client adapter over `BinanceRestClient`. */
export class BinanceRestBalanceClient implements BinanceBalanceClient {
  constructor(private readonly rest: BinanceRestClient) {}
  spotBalances(): Promise<readonly BinanceSpotBalance[]> {
    return this.rest.spotBalances();
  }
  futuresBalances(): Promise<readonly BinanceFuturesBalance[]> {
    return this.rest.futuresBalances();
  }
}

/** Default position-client adapter over `BinanceRestClient` (Futures). */
export class BinanceRestPositionClient implements BinancePositionClient {
  constructor(private readonly rest: BinanceRestClient) {}
  positionRisk(): Promise<readonly BinancePositionRisk[]> {
    return this.rest.positionRisk();
  }
}
