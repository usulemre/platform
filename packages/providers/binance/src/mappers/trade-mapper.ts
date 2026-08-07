/**
 * `BinanceTradeMapper` — raw Binance user trade → canonical {@link CanonicalTrade}. Deterministic; the
 * buyer/seller flag becomes the canonical side and the commission becomes a signed-neutral fee.
 */
import { isoFromMillis, num } from './parse';
import type { BinanceSymbolMapper } from './symbol-mapper';
import type { BinanceSymbolInfo, BinanceUserTrade } from '../types/binance';
import type { CanonicalTrade } from '../types/canonical';

export class BinanceTradeMapper {
  constructor(private readonly symbols: BinanceSymbolMapper) {}

  toCanonical(trade: BinanceUserTrade, info?: BinanceSymbolInfo): CanonicalTrade {
    return {
      tradeId: String(trade.id),
      venueOrderId: String(trade.orderId),
      symbol: this.symbols.toCanonicalSymbol(trade.symbol, info),
      side: trade.isBuyer ? 'BUY' : 'SELL',
      price: num(trade.price),
      quantity: num(trade.qty),
      fee: num(trade.commission),
      feeCurrency: trade.commissionAsset,
      maker: trade.isMaker,
      executedAt: isoFromMillis(trade.time) ?? new Date(0).toISOString(),
    };
  }

  toCanonicalMany(
    trades: readonly BinanceUserTrade[],
    info?: BinanceSymbolInfo,
  ): readonly CanonicalTrade[] {
    return trades.map((t) => this.toCanonical(t, info));
  }
}
