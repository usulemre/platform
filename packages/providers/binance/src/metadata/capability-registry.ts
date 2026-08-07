/**
 * `ExchangeCapabilityRegistry` — the immutable, exchange-wide view of trading capabilities aggregated
 * from every symbol's {@link ExchangeCapability}: the union of permissions and order types, and the
 * per-symbol capability lookup. (Distinct from the Broker Gateway `BinanceCapabilityRegistry`, which
 * declares gateway *capability contracts*; this describes *venue* trading permissions/order types.)
 * A read model built once from a metadata snapshot (thread-safe by immutability).
 */
import type { ExchangeCapability, ExchangeSymbol } from './types';

export class ExchangeCapabilityRegistry {
  private readonly bySymbol: ReadonlyMap<string, ExchangeCapability>;
  private readonly allPermissions: ReadonlySet<string>;
  private readonly allOrderTypes: ReadonlySet<string>;
  private readonly spotCount: number;
  private readonly marginCount: number;

  constructor(symbols: readonly ExchangeSymbol[]) {
    const bySymbol = new Map<string, ExchangeCapability>();
    const permissions = new Set<string>();
    const orderTypes = new Set<string>();
    let spot = 0;
    let margin = 0;
    for (const symbol of symbols) {
      bySymbol.set(symbol.venueSymbol.toUpperCase(), symbol.capability);
      bySymbol.set(symbol.symbol.toUpperCase(), symbol.capability);
      for (const p of symbol.capability.permissions) permissions.add(p);
      for (const o of symbol.capability.orderTypes) orderTypes.add(o);
      if (symbol.capability.spotTradingAllowed) spot += 1;
      if (symbol.capability.marginTradingAllowed) margin += 1;
    }
    this.bySymbol = bySymbol;
    this.allPermissions = permissions;
    this.allOrderTypes = orderTypes;
    this.spotCount = spot;
    this.marginCount = margin;
  }

  /** The capability profile for a symbol (canonical or venue name). */
  forSymbol(symbol: string): ExchangeCapability | undefined {
    return this.bySymbol.get(symbol.toUpperCase());
  }

  /** The union of all permissions advertised across the exchange (sorted). */
  permissions(): readonly string[] {
    return [...this.allPermissions].sort();
  }

  /** The union of all order types advertised across the exchange (sorted). */
  orderTypes(): readonly string[] {
    return [...this.allOrderTypes].sort();
  }

  /** Whether any symbol advertises a given permission. */
  supportsPermission(permission: string): boolean {
    return this.allPermissions.has(permission.toUpperCase());
  }

  /** Whether any symbol advertises a given order type. */
  supportsOrderType(orderType: string): boolean {
    return this.allOrderTypes.has(orderType.toUpperCase());
  }

  /** Counts of spot/margin-enabled symbols (for introspection/monitoring). */
  summary(): { readonly spotSymbols: number; readonly marginSymbols: number } {
    return { spotSymbols: this.spotCount, marginSymbols: this.marginCount };
  }
}
