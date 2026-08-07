/**
 * `AuthenticatedRestClient` — the port the auth module needs from the venue's authenticated REST API,
 * plus the default adapter over the existing resilient {@link BinanceRestClient}. This is the
 * Hexagonal seam: the listen-key manager and time synchronizer depend only on this interface, and the
 * adapter reuses the already-implemented, signed, resilient REST calls (no HTTP is reimplemented here).
 * It exposes ONLY the authenticated operations this module needs — server time, listen-key lifecycle
 * and an account snapshot for session recovery. It does NOT place orders.
 */
import type { BinanceRestClient } from '../http/rest-client';
import type { BinanceAccountInfo, BinanceServerTime } from '../types/binance';

export interface AuthenticatedRestClient {
  /** `GET .../time` — server clock (public, unsigned). */
  serverTime(): Promise<BinanceServerTime>;
  /** Create a user-data-stream listen key (signed with the API key). */
  createListenKey(): Promise<string>;
  /** Keep a listen key alive (extends its validity). */
  keepAliveListenKey(listenKey: string): Promise<void>;
  /** Close a listen key. */
  closeListenKey(listenKey: string): Promise<void>;
  /** Account snapshot (signed) — used for session recovery. */
  account(): Promise<BinanceAccountInfo>;
}

/** Default adapter binding the port to the resilient `BinanceRestClient`. */
export class BinanceAuthenticatedRestClient implements AuthenticatedRestClient {
  constructor(private readonly rest: BinanceRestClient) {}

  serverTime(): Promise<BinanceServerTime> {
    return this.rest.serverTime();
  }

  createListenKey(): Promise<string> {
    return this.rest.startUserDataStream();
  }

  keepAliveListenKey(listenKey: string): Promise<void> {
    return this.rest.keepAliveUserDataStream(listenKey);
  }

  closeListenKey(listenKey: string): Promise<void> {
    return this.rest.closeUserDataStream(listenKey);
  }

  account(): Promise<BinanceAccountInfo> {
    return this.rest.account();
  }
}
