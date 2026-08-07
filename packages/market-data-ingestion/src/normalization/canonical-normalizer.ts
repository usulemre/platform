/**
 * The **canonical normalizer** — turns a validated raw event into an immutable canonical record with
 * a resolved instrument id, the canonical timestamp model, and full provenance. This is a pure
 * projection: no venue specifics enter (the raw event is already provider-neutral), and every output
 * is `readonly`. One raw kind maps to exactly one normalized kind.
 */
import { sequenceNumber, type RawMarketDataEvent } from '../events/canonical-events';
import {
  MARKET_DATA_TYPE_BY_KIND,
  type CanonicalTimestamps,
  type EventProvenance,
  type IngestionEnvelope,
  type NormalizedMarketDataRecord,
} from '../events/envelope';

export class CanonicalNormalizer {
  /** Normalize an in-flight envelope into a canonical store record. */
  normalize(
    envelope: IngestionEnvelope,
    instrumentId: string,
    timestamps: CanonicalTimestamps,
  ): NormalizedMarketDataRecord {
    const event = envelope.event;
    const sequence = sequenceNumber(event);
    const provenance: EventProvenance = {
      providerId: envelope.providerId,
      streamKey: envelope.streamKey,
      providerSymbol: event.providerSymbol,
      ...(sequence !== undefined ? { sequence } : {}),
      ingestSequence: envelope.ingestSequence,
    };
    const common = {
      instrumentId,
      marketDataType: MARKET_DATA_TYPE_BY_KIND[event.kind],
      timestamps,
      provenance,
    } as const;

    return project(event, common);
  }
}

type Common = {
  readonly instrumentId: string;
  readonly marketDataType: (typeof MARKET_DATA_TYPE_BY_KIND)[keyof typeof MARKET_DATA_TYPE_BY_KIND];
  readonly timestamps: CanonicalTimestamps;
  readonly provenance: EventProvenance;
};

function project(event: RawMarketDataEvent, common: Common): NormalizedMarketDataRecord {
  switch (event.kind) {
    case 'trade':
      return {
        ...common,
        kind: 'trade',
        tradeId: event.tradeId,
        price: event.price,
        quantity: event.quantity,
        buyerIsMaker: event.buyerIsMaker,
      };
    case 'aggTrade':
      return {
        ...common,
        kind: 'aggTrade',
        aggregateTradeId: event.aggregateTradeId,
        price: event.price,
        quantity: event.quantity,
        firstTradeId: event.firstTradeId,
        lastTradeId: event.lastTradeId,
        buyerIsMaker: event.buyerIsMaker,
      };
    case 'ticker':
      return {
        ...common,
        kind: 'ticker',
        lastPrice: event.lastPrice,
        openPrice: event.openPrice,
        highPrice: event.highPrice,
        lowPrice: event.lowPrice,
        baseVolume: event.baseVolume,
        quoteVolume: event.quoteVolume,
        ...(event.weightedAvgPrice !== undefined
          ? { weightedAvgPrice: event.weightedAvgPrice }
          : {}),
        ...(event.priceChange !== undefined ? { priceChange: event.priceChange } : {}),
        ...(event.priceChangePercent !== undefined
          ? { priceChangePercent: event.priceChangePercent }
          : {}),
        ...(event.tradeCount !== undefined ? { tradeCount: event.tradeCount } : {}),
        ...(event.windowMs !== undefined ? { windowMs: event.windowMs } : {}),
      };
    case 'bookTicker':
      return {
        ...common,
        kind: 'bookTicker',
        updateId: event.updateId,
        bidPrice: event.bidPrice,
        bidQuantity: event.bidQuantity,
        askPrice: event.askPrice,
        askQuantity: event.askQuantity,
      };
    case 'orderBookSnapshot':
      return {
        ...common,
        kind: 'orderBookSnapshot',
        lastUpdateId: event.lastUpdateId,
        bids: event.bids,
        asks: event.asks,
      };
    case 'orderBookDelta':
      return {
        ...common,
        kind: 'orderBookDelta',
        firstUpdateId: event.firstUpdateId,
        finalUpdateId: event.finalUpdateId,
        ...(event.previousFinalUpdateId !== undefined
          ? { previousFinalUpdateId: event.previousFinalUpdateId }
          : {}),
        bids: event.bids,
        asks: event.asks,
      };
    case 'candlestick':
      return {
        ...common,
        kind: 'candlestick',
        interval: event.interval,
        openTime: event.openTime,
        closeTime: event.closeTime,
        open: event.open,
        high: event.high,
        low: event.low,
        close: event.close,
        baseVolume: event.baseVolume,
        quoteVolume: event.quoteVolume,
        trades: event.trades,
        closed: event.closed,
      };
    case 'markPrice':
      return {
        ...common,
        kind: 'markPrice',
        markPrice: event.markPrice,
        ...(event.indexPrice !== undefined ? { indexPrice: event.indexPrice } : {}),
        ...(event.estimatedSettlePrice !== undefined
          ? { estimatedSettlePrice: event.estimatedSettlePrice }
          : {}),
        ...(event.fundingRate !== undefined ? { fundingRate: event.fundingRate } : {}),
        ...(event.nextFundingTime !== undefined ? { nextFundingTime: event.nextFundingTime } : {}),
      };
    case 'avgPrice':
      return {
        ...common,
        kind: 'avgPrice',
        intervalMinutes: event.intervalMinutes,
        averagePrice: event.averagePrice,
        lastTradeTime: event.lastTradeTime,
      };
  }
}
