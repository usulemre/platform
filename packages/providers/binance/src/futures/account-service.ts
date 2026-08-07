/**
 * `BinanceFuturesAccountService` — the USDⓈ-M Futures account-read facade. It reads the full Futures
 * account document (`GET /fapi/v2/account`) through the injected {@link FuturesAccountClient} (reusing
 * the resilient signed REST client) and maps it to the canonical {@link FuturesAccount} (metadata,
 * balances and positions). It reads only — no orders, no configuration changes. Errors are
 * canonicalized; deterministic given its client and clock.
 */
import { BinanceFuturesAccountMapper } from './account-mapper';
import { BinanceFuturesErrorMapper } from './error-mapper';
import { BinanceFuturesMetrics } from './metrics';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import type { FuturesAccountClient } from './client';
import type { FuturesAccount } from './types';

export interface BinanceFuturesAccountServiceDeps {
  readonly client: FuturesAccountClient;
  readonly resolver?: SymbolResolver;
  readonly metrics?: BinanceFuturesMetrics;
  readonly clock?: () => number;
}

export class BinanceFuturesAccountService {
  private readonly client: FuturesAccountClient;
  private readonly mapper: BinanceFuturesAccountMapper;
  private readonly errors = new BinanceFuturesErrorMapper();
  private readonly metrics: BinanceFuturesMetrics;
  private readonly clock: () => number;

  constructor(deps: BinanceFuturesAccountServiceDeps) {
    this.client = deps.client;
    this.mapper = new BinanceFuturesAccountMapper(deps.resolver ?? IDENTITY_SYMBOL_RESOLVER);
    this.metrics = deps.metrics ?? new BinanceFuturesMetrics();
    this.clock = deps.clock ?? Date.now;
  }

  /** Read the full, validated canonical Futures account state. */
  async getAccount(): Promise<FuturesAccount> {
    try {
      const raw = await this.client.account();
      const account = this.mapper.account(raw, this.clock());
      this.metrics.onOperation('read', this.clock());
      return account;
    } catch (error) {
      this.metrics.onError();
      throw this.errors.map(error);
    }
  }
}
