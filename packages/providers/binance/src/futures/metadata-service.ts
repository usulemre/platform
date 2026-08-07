/**
 * `BinanceFuturesMetadataService` — the USDⓈ-M Futures derivatives-metadata facade: mark price & index
 * price (`premiumIndex`), funding-rate history (`fundingRate`) and notional/leverage brackets
 * (`leverageBracket`) — the reference data that has no Spot equivalent. It reads through the injected
 * {@link FuturesMarketDataClient}/{@link FuturesConfigClient} (reusing the resilient REST client) and
 * maps every payload to its canonical model. Contract/symbol metadata (exchange info, filters, trading
 * rules) remains the responsibility of the shared Exchange Metadata & Symbol Registry (Phase 9.1.1);
 * this service does not duplicate it. Reads only; deterministic.
 */
import { BinanceFuturesMetadataMapper } from './metadata-mapper';
import { BinanceFuturesErrorMapper } from './error-mapper';
import { BinanceFuturesMetrics } from './metrics';
import { BinanceFuturesRequestBuilder } from './request-builder';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import type { FuturesConfigClient, FuturesMarketDataClient } from './client';
import type { BinancePremiumIndex } from '../types/binance';
import type { FuturesFundingRate, FuturesLeverageBracket, FuturesMarkPrice } from './types';

export interface BinanceFuturesMetadataServiceDeps {
  readonly marketDataClient: FuturesMarketDataClient;
  readonly configClient: FuturesConfigClient;
  readonly resolver?: SymbolResolver;
  readonly metrics?: BinanceFuturesMetrics;
  readonly clock?: () => number;
}

function asArray(
  value: BinancePremiumIndex | readonly BinancePremiumIndex[],
): readonly BinancePremiumIndex[] {
  return Array.isArray(value) ? value : [value as BinancePremiumIndex];
}

export class BinanceFuturesMetadataService {
  private readonly marketDataClient: FuturesMarketDataClient;
  private readonly configClient: FuturesConfigClient;
  private readonly mapper: BinanceFuturesMetadataMapper;
  private readonly builder = new BinanceFuturesRequestBuilder();
  private readonly errors = new BinanceFuturesErrorMapper();
  private readonly metrics: BinanceFuturesMetrics;
  private readonly clock: () => number;

  constructor(deps: BinanceFuturesMetadataServiceDeps) {
    this.marketDataClient = deps.marketDataClient;
    this.configClient = deps.configClient;
    this.mapper = new BinanceFuturesMetadataMapper(deps.resolver ?? IDENTITY_SYMBOL_RESOLVER);
    this.metrics = deps.metrics ?? new BinanceFuturesMetrics();
    this.clock = deps.clock ?? Date.now;
  }

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      const result = await operation();
      this.metrics.onOperation('read', this.clock());
      return result;
    } catch (error) {
      this.metrics.onError();
      throw this.errors.map(error);
    }
  }

  /** Mark price & funding data for a single symbol. */
  markPrice(canonicalSymbol: string): Promise<FuturesMarkPrice> {
    const venue = this.builder.venueSymbol(canonicalSymbol);
    return this.run(async () => {
      const [first] = asArray(await this.marketDataClient.premiumIndex(venue));
      if (!first) throw new Error(`No mark price returned for ${canonicalSymbol}.`);
      return this.mapper.markPrice(first);
    });
  }

  /** Mark price & funding data for every symbol. */
  markPrices(): Promise<readonly FuturesMarkPrice[]> {
    return this.run(async () =>
      asArray(await this.marketDataClient.premiumIndex()).map((p) => this.mapper.markPrice(p)),
    );
  }

  /** Funding-rate history for a symbol. */
  fundingRates(canonicalSymbol: string, limit = 100): Promise<readonly FuturesFundingRate[]> {
    const venue = this.builder.venueSymbol(canonicalSymbol);
    return this.run(async () =>
      (await this.marketDataClient.fundingRateHistory(venue, limit)).map((f) =>
        this.mapper.fundingRate(f),
      ),
    );
  }

  /** Notional/leverage brackets (optionally for a single symbol). */
  leverageBrackets(canonicalSymbol?: string): Promise<readonly FuturesLeverageBracket[]> {
    const venue = canonicalSymbol ? this.builder.venueSymbol(canonicalSymbol) : undefined;
    return this.run(async () =>
      (await this.configClient.leverageBracket(venue)).map((b) => this.mapper.leverageBracket(b)),
    );
  }
}
