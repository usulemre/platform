/**
 * `BinanceCommissionMapper` — aggregates the per-fill commissions of an order into canonical
 * {@link CanonicalCommission} totals, grouped by commission asset (Binance can charge commission in
 * different assets, e.g. BNB). Pure and deterministic; commission-free fills contribute nothing.
 */
import type { CanonicalCommission, CanonicalFill } from './canonical';

export class BinanceCommissionMapper {
  /** The commission of a single fill. */
  fromFill(fill: CanonicalFill): CanonicalCommission {
    return { amount: fill.commission, asset: fill.commissionAsset };
  }

  /** Aggregate commissions across an order's fills, grouped by asset (insertion order preserved). */
  aggregate(fills: readonly CanonicalFill[]): readonly CanonicalCommission[] {
    const byAsset = new Map<string, number>();
    for (const fill of fills) {
      if (fill.commission === 0) continue;
      const asset = fill.commissionAsset ?? '';
      byAsset.set(asset, (byAsset.get(asset) ?? 0) + fill.commission);
    }
    return [...byAsset.entries()].map(([asset, amount]) => ({
      amount,
      asset: asset === '' ? undefined : asset,
    }));
  }
}
