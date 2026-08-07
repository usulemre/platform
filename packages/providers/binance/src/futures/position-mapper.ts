/**
 * `BinanceFuturesPositionMapper` — raw Binance Futures position (`GET /fapi/v2/positionRisk`, the
 * account document's `positions[]`, or an `ACCOUNT_UPDATE`/`MARGIN_CALL` position line) → canonical
 * {@link FuturesPosition}. It carries the full Futures position vocabulary (entry/mark/liquidation
 * price, unrealized PnL, leverage, margin type, isolated margin/wallet, notional). The signed
 * `positionAmt` carries direction (negative = short). Symbol names are canonicalized through an injected
 * resolver (reused from the market-data/account modules). Pure and deterministic.
 */
import { num } from '../mappers/parse';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import { toCanonicalMarginType, toCanonicalPositionSide } from './constants';
import type { BinanceFuturesAccountPosition, BinancePositionRisk } from '../types/binance';
import type { FuturesPosition } from './types';

export class BinanceFuturesPositionMapper {
  constructor(private readonly resolver: SymbolResolver = IDENTITY_SYMBOL_RESOLVER) {}

  private symbol(venueSymbol: string): string {
    return this.resolver.toCanonical(venueSymbol);
  }

  /** A single `positionRisk` row → canonical Futures position. */
  fromPositionRisk(p: BinancePositionRisk): FuturesPosition {
    return {
      symbol: this.symbol(p.symbol),
      venueSymbol: p.symbol,
      positionSide: toCanonicalPositionSide(p.positionSide),
      positionAmount: num(p.positionAmt),
      entryPrice: num(p.entryPrice),
      markPrice: p.markPrice !== undefined ? num(p.markPrice) : undefined,
      liquidationPrice:
        p.liquidationPrice !== undefined ? num(p.liquidationPrice) || undefined : undefined,
      unrealizedPnl: num(p.unRealizedProfit),
      leverage: p.leverage !== undefined ? num(p.leverage) : undefined,
      marginType: toCanonicalMarginType(p.marginType),
      isolatedMargin: p.isolatedMargin !== undefined ? num(p.isolatedMargin) : undefined,
      isolatedWallet: p.isolatedWallet !== undefined ? num(p.isolatedWallet) : undefined,
      notional: p.notional !== undefined ? num(p.notional) : undefined,
      maxNotionalValue:
        p.maxNotionalValue !== undefined ? num(p.maxNotionalValue) || undefined : undefined,
      updateTime: p.updateTime,
    };
  }

  /** Map all `positionRisk` rows, dropping flat (zero-amount) positions. */
  fromPositionRiskMany(positions: readonly BinancePositionRisk[]): readonly FuturesPosition[] {
    return positions.map((p) => this.fromPositionRisk(p)).filter((p) => p.positionAmount !== 0);
  }

  /** An account-document `positions[]` line → canonical Futures position (drops flat positions). */
  fromAccountPosition(p: BinanceFuturesAccountPosition): FuturesPosition {
    return {
      symbol: this.symbol(p.symbol),
      venueSymbol: p.symbol,
      positionSide: toCanonicalPositionSide(p.positionSide),
      positionAmount: num(p.positionAmt),
      entryPrice: num(p.entryPrice),
      markPrice: p.markPrice !== undefined ? num(p.markPrice) : undefined,
      unrealizedPnl: num(p.unrealizedProfit),
      leverage: p.leverage !== undefined ? num(p.leverage) : undefined,
      marginType: p.isolated ? 'ISOLATED' : 'CROSSED',
      isolatedWallet: p.isolatedWallet !== undefined ? num(p.isolatedWallet) : undefined,
      initialMargin: p.initialMargin !== undefined ? num(p.initialMargin) : undefined,
      maintMargin: p.maintMargin !== undefined ? num(p.maintMargin) : undefined,
      notional: p.notional !== undefined ? num(p.notional) : undefined,
      maxNotionalValue: p.maxNotional !== undefined ? num(p.maxNotional) || undefined : undefined,
      updateTime: p.updateTime,
    };
  }

  /** Map account-document positions, dropping flat ones. */
  fromAccountPositions(
    positions: readonly BinanceFuturesAccountPosition[],
  ): readonly FuturesPosition[] {
    return positions.map((p) => this.fromAccountPosition(p)).filter((p) => p.positionAmount !== 0);
  }
}
