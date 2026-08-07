/**
 * `BinanceFuturesAccountMapper` — raw USDⓈ-M Futures account document (`GET /fapi/v2/account`) →
 * canonical {@link FuturesAccount}, including its asset lines → canonical {@link FuturesBalance} and its
 * embedded positions → canonical {@link FuturesPosition} (via the position mapper). It reads only; it
 * never places orders. Numeric parsing is delegated to `../mappers/parse`; symbols to the injected
 * resolver used by the position mapper. Pure and deterministic.
 */
import { num } from '../mappers/parse';
import { BinanceFuturesPositionMapper } from './position-mapper';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import type {
  BinanceFuturesAccountAsset,
  BinanceFuturesAccountInfo,
  BinanceFuturesBalance,
} from '../types/binance';
import type { FuturesAccount, FuturesBalance } from './types';

export class BinanceFuturesAccountMapper {
  private readonly positions: BinanceFuturesPositionMapper;

  constructor(resolver: SymbolResolver = IDENTITY_SYMBOL_RESOLVER) {
    this.positions = new BinanceFuturesPositionMapper(resolver);
  }

  /** A single account asset line → canonical Futures balance. */
  balance(asset: BinanceFuturesAccountAsset): FuturesBalance {
    return {
      asset: asset.asset,
      walletBalance: num(asset.walletBalance),
      availableBalance: num(asset.availableBalance),
      crossWalletBalance:
        asset.crossWalletBalance !== undefined ? num(asset.crossWalletBalance) : undefined,
      crossUnrealizedPnl: asset.crossUnPnl !== undefined ? num(asset.crossUnPnl) : undefined,
      marginBalance: asset.marginBalance !== undefined ? num(asset.marginBalance) : undefined,
      maxWithdrawAmount:
        asset.maxWithdrawAmount !== undefined ? num(asset.maxWithdrawAmount) : undefined,
      initialMargin: asset.initialMargin !== undefined ? num(asset.initialMargin) : undefined,
      maintMargin: asset.maintMargin !== undefined ? num(asset.maintMargin) : undefined,
      unrealizedPnl: asset.unrealizedProfit !== undefined ? num(asset.unrealizedProfit) : undefined,
    };
  }

  /** All account asset lines → canonical balances (keeps zero balances; caller filters if desired). */
  balances(assets: readonly BinanceFuturesAccountAsset[]): readonly FuturesBalance[] {
    return assets.map((a) => this.balance(a));
  }

  /** A `GET /fapi/v2/balance` wallet line → canonical Futures balance. */
  wallet(b: BinanceFuturesBalance): FuturesBalance {
    return {
      asset: b.asset,
      walletBalance: num(b.balance),
      availableBalance: num(b.availableBalance),
      crossWalletBalance:
        b.crossWalletBalance !== undefined ? num(b.crossWalletBalance) : undefined,
    };
  }

  /** All `GET /fapi/v2/balance` wallet lines → canonical balances. */
  wallets(balances: readonly BinanceFuturesBalance[]): readonly FuturesBalance[] {
    return balances.map((b) => this.wallet(b));
  }

  /** The full account document → canonical Futures account. */
  account(info: BinanceFuturesAccountInfo, at: number): FuturesAccount {
    return {
      canTrade: info.canTrade ?? false,
      feeTier: info.feeTier,
      totalWalletBalance: num(info.totalWalletBalance),
      totalUnrealizedProfit: num(info.totalUnrealizedProfit),
      totalMarginBalance: num(info.totalMarginBalance),
      availableBalance: num(info.availableBalance),
      assets: this.balances(info.assets ?? []),
      positions: this.positions.fromAccountPositions(info.positions ?? []),
      updateTime: info.updateTime ?? at,
    };
  }
}
