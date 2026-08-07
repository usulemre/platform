/**
 * `BalanceMapper`, `PositionMapper` and `AccountMapper` — translate raw Binance account reads into the
 * canonical account-state models. Spot and Futures balance shapes differ (Spot `free`/`locked` vs
 * Futures wallet/available), and positions are Futures-only; each is handled explicitly. Symbol names
 * are canonicalized through an injected {@link SymbolResolver} (reused from the market-data module).
 * Pure and deterministic.
 */
import { num } from '../mappers/parse';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import type { BinanceMarket } from '../constants';
import type {
  BinanceAccountInfo,
  BinanceFuturesBalance,
  BinancePositionRisk,
  BinanceSpotBalance,
} from '../types/binance';
import type { AccountBalance, AccountPosition } from './canonical';

export class BalanceMapper {
  /** Spot `{ asset, free, locked }` → canonical balance. */
  fromSpot(balance: BinanceSpotBalance): AccountBalance {
    return {
      asset: balance.asset.toUpperCase(),
      free: num(balance.free),
      locked: num(balance.locked),
    };
  }

  /** Futures `{ asset, balance, availableBalance }` → canonical balance (locked = wallet − available). */
  fromFutures(balance: BinanceFuturesBalance): AccountBalance {
    const wallet = num(balance.balance);
    const available = num(balance.availableBalance);
    return {
      asset: balance.asset.toUpperCase(),
      free: available,
      locked: Math.max(0, wallet - available),
      walletBalance: wallet,
      crossWalletBalance: balance.crossWalletBalance ? num(balance.crossWalletBalance) : undefined,
    };
  }

  fromSpotMany(balances: readonly BinanceSpotBalance[]): readonly AccountBalance[] {
    return balances.map((b) => this.fromSpot(b));
  }

  fromFuturesMany(balances: readonly BinanceFuturesBalance[]): readonly AccountBalance[] {
    return balances.map((b) => this.fromFutures(b));
  }
}

export class PositionMapper {
  constructor(private readonly resolver: SymbolResolver = IDENTITY_SYMBOL_RESOLVER) {}

  /** A futures position-risk row → canonical position. */
  fromPositionRisk(position: BinancePositionRisk): AccountPosition {
    return {
      symbol: this.resolver.toCanonical(position.symbol),
      venueSymbol: position.symbol.toUpperCase(),
      positionAmount: num(position.positionAmt),
      entryPrice: num(position.entryPrice),
      unrealizedPnl: num(position.unRealizedProfit),
      accumulatedRealized: 0,
      marginType: 'cross',
      isolatedWallet: 0,
      positionSide: position.positionSide ?? 'BOTH',
      markPrice: position.markPrice ? num(position.markPrice) : undefined,
      leverage: position.leverage ? num(position.leverage) : undefined,
    };
  }

  fromPositionRiskMany(positions: readonly BinancePositionRisk[]): readonly AccountPosition[] {
    return positions.map((p) => this.fromPositionRisk(p));
  }
}

export class AccountMapper {
  constructor(private readonly market: BinanceMarket) {}

  /** Account metadata (type, permissions, trade flag) from the account document. */
  metadata(info: BinanceAccountInfo): {
    accountType?: string;
    canTrade?: boolean;
    permissions: readonly string[];
  } {
    const permissions =
      info.permissions && info.permissions.length > 0
        ? info.permissions
        : this.market === 'SPOT'
          ? ['SPOT']
          : ['FUTURES'];
    return { accountType: info.accountType, canTrade: info.canTrade, permissions };
  }
}
