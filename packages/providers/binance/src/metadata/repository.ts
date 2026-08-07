/**
 * `ExchangeMetadataRepository` — the persistence seam for canonical metadata snapshots, keyed by
 * market. It is a PORT (interface) plus a default in-memory implementation, so a deployment can later
 * inject a durable store (e.g. the Configuration Foundation or a snapshot table) without changing the
 * service. Snapshots are immutable; storing one supersedes the prior version for that market rather
 * than mutating it (CP-2). In-memory storage is thread-safe by JavaScript's single-threaded model.
 */
import type { BinanceMarket } from '../constants';
import type { ExchangeMetadata } from './types';

/** The metadata-store port. */
export interface ExchangeMetadataRepository {
  load(market: BinanceMarket): ExchangeMetadata | undefined;
  save(metadata: ExchangeMetadata): void;
  markets(): readonly BinanceMarket[];
}

/** Default in-memory repository (latest snapshot per market). */
export class InMemoryExchangeMetadataRepository implements ExchangeMetadataRepository {
  private readonly byMarket = new Map<BinanceMarket, ExchangeMetadata>();

  load(market: BinanceMarket): ExchangeMetadata | undefined {
    return this.byMarket.get(market);
  }

  save(metadata: ExchangeMetadata): void {
    this.byMarket.set(metadata.market, metadata);
  }

  markets(): readonly BinanceMarket[] {
    return [...this.byMarket.keys()];
  }
}
