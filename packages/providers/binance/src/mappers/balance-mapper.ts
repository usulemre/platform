/**
 * `BinanceBalanceMapper` — raw Binance balances → the Broker Gateway SDK's canonical
 * {@link BalanceSnapshot}. Spot balances split into `free`/`locked`; USDⓈ-M futures balances expose a
 * wallet `balance` and an `availableBalance`. Both collapse onto `{ currency, total, available }`.
 */
import { num } from './parse';
import type { BinanceFuturesBalance, BinanceSpotBalance } from '../types/binance';
import type { BalanceSnapshot } from '../types/canonical';

export class BinanceBalanceMapper {
  /** Spot `{ asset, free, locked }` → canonical balance. */
  fromSpot(balance: BinanceSpotBalance): BalanceSnapshot {
    const free = num(balance.free);
    const locked = num(balance.locked);
    return { currency: balance.asset.toUpperCase(), total: free + locked, available: free };
  }

  /** Futures `{ asset, balance, availableBalance }` → canonical balance. */
  fromFutures(balance: BinanceFuturesBalance): BalanceSnapshot {
    return {
      currency: balance.asset.toUpperCase(),
      total: num(balance.balance),
      available: num(balance.availableBalance),
    };
  }

  /** Map a set of spot balances, dropping empty (dust-free) lines. */
  fromSpotMany(balances: readonly BinanceSpotBalance[]): readonly BalanceSnapshot[] {
    return balances.map((b) => this.fromSpot(b)).filter((b) => b.total > 0 || b.available > 0);
  }

  /** Map a set of futures balances, dropping empty lines. */
  fromFuturesMany(balances: readonly BinanceFuturesBalance[]): readonly BalanceSnapshot[] {
    return balances
      .map((b) => this.fromFutures(b))
      .filter((b) => b.total !== 0 || b.available !== 0);
  }
}
