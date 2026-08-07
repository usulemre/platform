/**
 * `ExchangeMetadataService` — the facade and single source of truth for Binance exchange metadata. It
 * composes discovery (fetch), mapping, validation, caching, persistence and the derived registries
 * (symbols, trading pairs, assets, capabilities) behind one object. Discovery is delegated to the
 * {@link MetadataRefresher} (backed by an injected {@link ExchangeMetadataSource}, i.e. the Common HTTP
 * Client via the REST client); the registries are memoized per snapshot and rebuilt transparently when
 * the metadata is refreshed. The service resolves NO orders and opens NO streams — it only discovers,
 * validates, caches and exposes metadata (immutable read models; thread-safe by immutability).
 */
import { DEFAULT_EXCHANGE_INFO_TTL_MS, MARKET_BY_PROVIDER, type BinanceMarket } from '../constants';
import { ExchangeMetadataCache } from './cache';
import { ExchangeMetadataMapper } from './metadata-mapper';
import { MetadataValidator, type MetadataValidationResult } from './validator';
import { MetadataRefresher, type ExchangeMetadataSource, type MetadataMonitor } from './refresher';
import { InMemoryExchangeMetadataRepository, type ExchangeMetadataRepository } from './repository';
import { SymbolRegistry } from './symbol-registry';
import { TradingPairRegistry } from './trading-pair-registry';
import { AssetRegistry } from './asset-registry';
import { ExchangeCapabilityRegistry } from './capability-registry';
import type { ProviderId } from '@platform/broker-sdk';
import type { ExchangeMetadata, ExchangeSymbol, RateLimitMetadata } from './types';

export interface ExchangeMetadataServiceDeps {
  /** The market this service governs (or infer it from `providerId`). */
  readonly market?: BinanceMarket;
  readonly providerId?: ProviderId;
  /** The raw-metadata source (e.g. a `BinanceRestClient`), backed by the Common HTTP Client. */
  readonly source: ExchangeMetadataSource;
  readonly clock?: () => number;
  readonly ttlMs?: number;
  readonly repository?: ExchangeMetadataRepository;
  readonly monitor?: MetadataMonitor;
}

/** The derived read-model registries for one metadata snapshot. */
interface RegistryBundle {
  readonly metadata: ExchangeMetadata;
  readonly symbols: SymbolRegistry;
  readonly pairs: TradingPairRegistry;
  readonly assets: AssetRegistry;
  readonly capabilities: ExchangeCapabilityRegistry;
}

function resolveMarket(deps: ExchangeMetadataServiceDeps): BinanceMarket {
  if (deps.market) return deps.market;
  const market = deps.providerId
    ? MARKET_BY_PROVIDER[deps.providerId as keyof typeof MARKET_BY_PROVIDER]
    : undefined;
  return market ?? 'SPOT';
}

export class ExchangeMetadataService {
  readonly market: BinanceMarket;
  readonly repository: ExchangeMetadataRepository;
  private readonly cache: ExchangeMetadataCache;
  private readonly validator = new MetadataValidator();
  private readonly refresher: MetadataRefresher;
  private bundle?: RegistryBundle;

  constructor(deps: ExchangeMetadataServiceDeps) {
    this.market = resolveMarket(deps);
    const clock = deps.clock ?? Date.now;
    this.repository = deps.repository ?? new InMemoryExchangeMetadataRepository();
    this.cache = new ExchangeMetadataCache({
      clock,
      ttlMs: deps.ttlMs ?? DEFAULT_EXCHANGE_INFO_TTL_MS,
    });
    this.refresher = new MetadataRefresher({
      source: deps.source,
      mapper: new ExchangeMetadataMapper(this.market),
      validator: this.validator,
      cache: this.cache,
      repository: this.repository,
      clock,
      monitor: deps.monitor,
    });
  }

  /* ------------------------------ discovery ------------------------------ */

  /** Force a fresh discovery and return the new snapshot. */
  async refresh(): Promise<ExchangeMetadata> {
    return this.refresher.refresh();
  }

  /** Discover only if the cache is stale/empty; returns the current snapshot. */
  async ensureFresh(): Promise<ExchangeMetadata> {
    return this.refresher.ensureFresh();
  }

  /** Whether a non-stale snapshot is cached. */
  isFresh(): boolean {
    return this.cache.isFresh();
  }

  /** The current snapshot (cache, then repository fallback), or undefined if never discovered. */
  metadata(): ExchangeMetadata | undefined {
    return this.cache.get() ?? this.repository.load(this.market);
  }

  /** Validate the current snapshot (throws-free introspection). */
  validate(): MetadataValidationResult {
    const metadata = this.metadata();
    return metadata
      ? this.validator.validate(metadata)
      : { valid: false, errors: ['no metadata discovered yet.'], warnings: [] };
  }

  /* ------------------------------ derived registries ------------------------------ */

  private registries(): RegistryBundle {
    const metadata = this.metadata();
    if (!metadata)
      throw new Error(
        'Exchange metadata has not been discovered yet; call refresh()/ensureFresh() first.',
      );
    if (!this.bundle || this.bundle.metadata !== metadata) {
      this.bundle = {
        metadata,
        symbols: new SymbolRegistry(metadata.symbols),
        pairs: new TradingPairRegistry(metadata.symbols),
        assets: new AssetRegistry(metadata.symbols),
        capabilities: new ExchangeCapabilityRegistry(metadata.symbols),
      };
    }
    return this.bundle;
  }

  /** The symbol registry for the current snapshot. */
  symbols(): SymbolRegistry {
    return this.registries().symbols;
  }

  /** The trading-pair registry for the current snapshot. */
  pairs(): TradingPairRegistry {
    return this.registries().pairs;
  }

  /** The asset registry for the current snapshot. */
  assets(): AssetRegistry {
    return this.registries().assets;
  }

  /** The exchange-capability registry for the current snapshot. */
  capabilities(): ExchangeCapabilityRegistry {
    return this.registries().capabilities;
  }

  /* ------------------------------ convenience accessors ------------------------------ */

  /** Resolve a single symbol by canonical or venue name. */
  getSymbol(symbol: string): ExchangeSymbol | undefined {
    return this.symbols().get(symbol);
  }

  /** The exchange rate-limit descriptors from the current snapshot. */
  rateLimits(): readonly RateLimitMetadata[] {
    return this.metadata()?.rateLimits ?? [];
  }

  /** The exchange server time from the current snapshot (0 when unknown). */
  serverTime(): number {
    return this.metadata()?.serverTime ?? 0;
  }

  /** The exchange timezone from the current snapshot. */
  timezone(): string {
    return this.metadata()?.timezone ?? 'UTC';
  }
}

/** Construct an {@link ExchangeMetadataService} from a raw-metadata source. */
export function createExchangeMetadataService(
  deps: ExchangeMetadataServiceDeps,
): ExchangeMetadataService {
  return new ExchangeMetadataService(deps);
}
