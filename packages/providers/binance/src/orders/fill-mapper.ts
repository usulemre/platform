/**
 * `BinanceFillMapper` — maps a raw Binance fill (Spot `fills[]`) or a user trade (`myTrades` /
 * `userTrades`) to the canonical {@link CanonicalFill}. Pure and deterministic.
 */
import { num } from '../mappers/parse';
import type { BinanceFill, BinanceUserTrade } from '../types/binance';
import type { CanonicalFill } from './canonical';

export class BinanceFillMapper {
  /** A Spot order-response fill → canonical fill. */
  toCanonical(fill: BinanceFill): CanonicalFill {
    return {
      tradeId: fill.tradeId,
      price: num(fill.price),
      quantity: num(fill.qty),
      commission: num(fill.commission),
      commissionAsset: fill.commissionAsset,
    };
  }

  toCanonicalMany(fills: readonly BinanceFill[] | undefined): readonly CanonicalFill[] {
    return (fills ?? []).map((f) => this.toCanonical(f));
  }

  /** A user trade → canonical fill (used to reconstruct fills for a queried order). */
  fromUserTrade(trade: BinanceUserTrade): CanonicalFill {
    return {
      tradeId: trade.id,
      price: num(trade.price),
      quantity: num(trade.qty),
      commission: num(trade.commission),
      commissionAsset: trade.commissionAsset,
      isMaker: trade.isMaker,
    };
  }
}
