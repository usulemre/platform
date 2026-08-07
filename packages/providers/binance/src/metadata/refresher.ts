/**
 * `MetadataRefresher` — orchestrates metadata discovery: fetch raw exchangeInfo from an injected
 * {@link ExchangeMetadataSource}, validate the raw payload, map it to the canonical
 * {@link ExchangeMetadata}, validate the mapped snapshot, and store it (cache + repository). It is
 * TTL-aware via the cache and reports outcomes to an optional {@link MetadataMonitor}. It fetches
 * through the source (which is backed by the Common HTTP Client) but performs no mapping or validation
 * logic of its own — those are delegated to the mapper/validator. `fetchedAt` is stamped from the
 * injected clock (never wall-clock ambiently).
 */
import type { BinanceExchangeInfo } from '../types/binance';
import { ExchangeMetadataCache } from './cache';
import { ExchangeMetadataMapper } from './metadata-mapper';
import { MetadataValidator } from './validator';
import { BinanceMetadataError } from './errors';
import type { ExchangeMetadataRepository } from './repository';
import type { ExchangeMetadata } from './types';

/** The read-only source of raw exchange metadata (satisfied structurally by `BinanceRestClient`). */
export interface ExchangeMetadataSource {
  exchangeInfo(): Promise<BinanceExchangeInfo>;
}

/** Optional observability hook for metadata refreshes (Monitoring Module seam). */
export interface MetadataMonitor {
  onRefreshed?(metadata: ExchangeMetadata, warnings: readonly string[]): void;
  onValidationFailed?(phase: 'raw' | 'mapped', errors: readonly string[]): void;
}

export interface MetadataRefresherDeps {
  readonly source: ExchangeMetadataSource;
  readonly mapper: ExchangeMetadataMapper;
  readonly validator: MetadataValidator;
  readonly cache: ExchangeMetadataCache;
  readonly repository: ExchangeMetadataRepository;
  readonly clock: () => number;
  readonly monitor?: MetadataMonitor;
}

export class MetadataRefresher {
  private readonly deps: MetadataRefresherDeps;

  constructor(deps: MetadataRefresherDeps) {
    this.deps = deps;
  }

  /** Force a fresh discovery: fetch → validate → map → validate → store. */
  async refresh(): Promise<ExchangeMetadata> {
    const { source, mapper, validator, cache, repository, clock, monitor } = this.deps;
    const raw = await source.exchangeInfo();

    const rawCheck = validator.validateRaw(raw);
    if (!rawCheck.valid) {
      monitor?.onValidationFailed?.('raw', rawCheck.errors);
      throw new BinanceMetadataError('Raw exchange metadata failed validation.', rawCheck.errors);
    }

    const metadata = mapper.toCanonical(raw, new Date(clock()).toISOString());
    const check = validator.validate(metadata);
    if (!check.valid) {
      monitor?.onValidationFailed?.('mapped', check.errors);
      throw new BinanceMetadataError('Mapped exchange metadata failed validation.', check.errors);
    }

    cache.set(metadata);
    repository.save(metadata);
    monitor?.onRefreshed?.(metadata, check.warnings);
    return metadata;
  }

  /** Refresh only when the cache is stale/empty; otherwise return the cached snapshot. */
  async ensureFresh(): Promise<ExchangeMetadata> {
    const cached = this.deps.cache.get();
    if (cached && this.deps.cache.isFresh()) return cached;
    return this.refresh();
  }
}
