/**
 * `BinancePositionMapper` — raw Binance futures `positionRisk` → canonical {@link PositionSnapshot}
 * (Broker Gateway SDK). Spot has no positions, so the spot path yields an empty set. The signed
 * `positionAmt` carries direction (negative = short); zero-amount rows are dropped.
 */
import { num } from './parse';
import type { BinanceSymbolMapper } from './symbol-mapper';
import type { BinancePositionRisk, BinanceSymbolInfo } from '../types/binance';
import type { PositionSnapshot } from '../types/canonical';

export class BinancePositionMapper {
  constructor(private readonly symbols: BinanceSymbolMapper) {}

  /** A single futures position row → canonical position (null when flat). */
  fromPositionRisk(
    position: BinancePositionRisk,
    info?: BinanceSymbolInfo,
  ): PositionSnapshot | null {
    const quantity = num(position.positionAmt);
    if (quantity === 0) return null;
    return {
      symbol: this.symbols.toCanonicalSymbol(position.symbol, info),
      quantity,
      averagePrice: num(position.entryPrice),
      assetClass: 'CRYPTO_PERP',
    };
  }

  /** Map all futures position rows, dropping flat ones. */
  fromPositionRiskMany(positions: readonly BinancePositionRisk[]): readonly PositionSnapshot[] {
    const out: PositionSnapshot[] = [];
    for (const p of positions) {
      const mapped = this.fromPositionRisk(p);
      if (mapped) out.push(mapped);
    }
    return out;
  }
}
