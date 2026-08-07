/**
 * The **provider integration contracts** — the provider-neutral seams through which *any* venue feeds
 * the ingestion pipeline. A provider adapter (Binance, and future venues) implements these; the
 * ingestion core depends only on them and never imports a provider SDK, DTO, client, or enum
 * (provider independence — the architectural acceptance criterion). Adding a new provider is a matter
 * of implementing these interfaces, with no change to the ingestion core.
 */
import type { RawMarketDataEvent, RawOrderBookSnapshotEvent } from '../events/canonical-events';

/** A single provider event handed to the gateway, tagged with its originating provider. */
export interface ProviderMarketDataEvent {
  readonly providerId: string;
  readonly event: RawMarketDataEvent;
  /** When the adapter received it from the wire (epoch ms); the gateway stamps `now()` if omitted. */
  readonly receivedAt?: number;
}

/** The sink a provider adapter pushes events into (implemented by the gateway). */
export interface MarketDataConsumer {
  ingest(input: ProviderMarketDataEvent): Promise<IngestionResult>;
}

/**
 * The provider-neutral order-book snapshot source used for recovery. When the synchronizer detects a
 * gap it asks for a fresh snapshot; the adapter fulfils it (e.g. via the venue's REST depth endpoint)
 * and returns a canonical snapshot event. The ingestion core never knows how the snapshot is fetched.
 */
export interface OrderBookSnapshotSource {
  fetchSnapshot(providerId: string, providerSymbol: string): Promise<RawOrderBookSnapshotEvent>;
}

/**
 * A push-based provider stream. `start` begins delivering canonical events into the consumer;
 * `stop` tears the subscription down. Providers own reconnect/resubscribe internally and re-emit an
 * order-book snapshot (or trigger recovery) after a disconnect.
 */
export interface ProviderMarketDataSource {
  readonly providerId: string;
  start(consumer: MarketDataConsumer): Promise<void> | void;
  stop(): Promise<void> | void;
}

/** The terminal outcome of ingesting one event. */
export type IngestionOutcome =
  | 'accepted' // normalized and enqueued for storage
  | 'duplicate' // dropped: already seen
  | 'out_of_order' // dropped: sequence went backwards
  | 'rejected' // failed schema/quality/symbol — quarantined with a reason
  | 'degraded' // order-book gap — book degraded, recovery attempted
  | 'dropped_overflow'; // buffer full — shed under backpressure

export interface IngestionResult {
  readonly outcome: IngestionOutcome;
  readonly streamKey: string;
  readonly instrumentId?: string;
  /** Present when the outcome is `rejected` / `dropped_overflow`. */
  readonly reason?: string;
  readonly reasonCode?: string;
}
