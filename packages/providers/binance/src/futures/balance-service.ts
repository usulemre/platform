/**
 * `BinanceFuturesBalanceService` — the USDⓈ-M Futures wallet-balance read facade. It reads the Futures
 * wallet balances (`GET /fapi/v2/balance`) through the injected {@link FuturesAccountClient} (reusing
 * the resilient signed REST client) and maps them to canonical {@link FuturesBalance} lines, optionally
 * dropping zero balances. It reads only; deterministic given its client and clock.
 */
import { BinanceFuturesAccountMapper } from './account-mapper';
import { BinanceFuturesErrorMapper } from './error-mapper';
import { BinanceFuturesMetrics } from './metrics';
import type { FuturesAccountClient } from './client';
import type { FuturesBalance } from './types';

export interface BinanceFuturesBalanceServiceDeps {
  readonly client: FuturesAccountClient;
  readonly metrics?: BinanceFuturesMetrics;
  readonly clock?: () => number;
}

export class BinanceFuturesBalanceService {
  private readonly client: FuturesAccountClient;
  private readonly mapper = new BinanceFuturesAccountMapper();
  private readonly errors = new BinanceFuturesErrorMapper();
  private readonly metrics: BinanceFuturesMetrics;
  private readonly clock: () => number;

  constructor(deps: BinanceFuturesBalanceServiceDeps) {
    this.client = deps.client;
    this.metrics = deps.metrics ?? new BinanceFuturesMetrics();
    this.clock = deps.clock ?? Date.now;
  }

  /** All wallet balances; when `nonZeroOnly` is set, drops assets with a zero wallet balance. */
  async getBalances(nonZeroOnly = false): Promise<readonly FuturesBalance[]> {
    try {
      const balances = this.mapper.wallets(await this.client.balances());
      this.metrics.onOperation('read', this.clock());
      return nonZeroOnly ? balances.filter((b) => b.walletBalance !== 0) : balances;
    } catch (error) {
      this.metrics.onError();
      throw this.errors.map(error);
    }
  }
}
