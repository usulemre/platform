/**
 * `AssetRegistry` — the immutable set of distinct {@link AssetMetadata} (base and quote currencies)
 * observed across an exchange's symbols, with the role(s) each asset plays and its precision. Built
 * once from a metadata snapshot; a read model (thread-safe by immutability).
 */
import type { AssetMetadata, ExchangeSymbol } from './types';

export class AssetRegistry {
  private readonly assets: readonly AssetMetadata[];
  private readonly byName: ReadonlyMap<string, AssetMetadata>;

  constructor(symbols: readonly ExchangeSymbol[]) {
    const roles = new Map<string, Set<'BASE' | 'QUOTE'>>();
    const precision = new Map<string, number>();
    const observe = (asset: string, role: 'BASE' | 'QUOTE', p: number): void => {
      (roles.get(asset) ?? roles.set(asset, new Set()).get(asset)!).add(role);
      precision.set(asset, Math.max(precision.get(asset) ?? 0, p));
    };
    for (const symbol of symbols) {
      observe(symbol.baseAsset, 'BASE', symbol.precision.baseAssetPrecision);
      observe(symbol.quoteAsset, 'QUOTE', symbol.precision.quoteAssetPrecision);
    }
    const assets: AssetMetadata[] = [...roles.keys()].sort().map((asset) => ({
      asset,
      precision: precision.get(asset) ?? 8,
      roles: [...(roles.get(asset) ?? [])],
    }));
    this.assets = assets;
    this.byName = new Map(assets.map((a) => [a.asset, a] as const));
  }

  get(asset: string): AssetMetadata | undefined {
    return this.byName.get(asset.toUpperCase());
  }

  has(asset: string): boolean {
    return this.byName.has(asset.toUpperCase());
  }

  all(): readonly AssetMetadata[] {
    return this.assets;
  }

  get size(): number {
    return this.assets.length;
  }

  /** Assets that serve as a quote currency somewhere on the exchange. */
  quoteAssets(): readonly AssetMetadata[] {
    return this.assets.filter((a) => a.roles.includes('QUOTE'));
  }

  /** Assets that serve as a base currency somewhere on the exchange. */
  baseAssets(): readonly AssetMetadata[] {
    return this.assets.filter((a) => a.roles.includes('BASE'));
  }
}
