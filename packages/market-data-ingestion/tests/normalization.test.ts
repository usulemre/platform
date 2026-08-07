import { describe, expect, it } from 'vitest';
import {
  CanonicalNormalizer,
  InMemoryInstrumentRegistry,
  SymbolNormalizer,
  TimestampNormalizer,
  streamKey,
  type IngestionEnvelope,
} from '../src/index';
import { INSTRUMENT_ID, PROVIDER, T0, VENUE_SYMBOL, makeRegistry, trade } from './helpers';

describe('TimestampNormalizer', () => {
  const tn = new TimestampNormalizer();

  it('preserves event and exchange time and adds receive/processing', () => {
    const ts = tn.normalize(trade({ eventTime: T0, tradeTime: T0 - 5 }), T0 + 1, T0 + 2);
    expect(ts.eventTime).toBe(T0);
    // exchangeTime derived from tradeTime when not explicit.
    expect(ts.exchangeTime).toBe(T0 - 5);
    expect(ts.receiveTime).toBe(T0 + 1);
    expect(ts.processingTime).toBe(T0 + 2);
  });

  it('does not invent an exchange time when none is derivable', () => {
    const ts = tn.normalize(
      { kind: 'markPrice', providerSymbol: VENUE_SYMBOL, markPrice: 1 },
      T0,
      T0,
    );
    expect(ts.exchangeTime).toBeUndefined();
    expect(ts.eventTime).toBeUndefined();
  });
});

describe('SymbolNormalizer', () => {
  it('resolves a registered venue symbol to a canonical instrument', () => {
    const sn = new SymbolNormalizer(makeRegistry());
    const result = sn.resolve(PROVIDER, VENUE_SYMBOL);
    expect(result.resolved).toBe(true);
    if (result.resolved) expect(result.instrument.instrumentId).toBe(INSTRUMENT_ID);
  });

  it('is case-insensitive on the venue symbol', () => {
    const sn = new SymbolNormalizer(makeRegistry());
    expect(sn.resolve(PROVIDER, 'btcusdt').resolved).toBe(true);
  });

  it('rejects an unknown symbol', () => {
    const sn = new SymbolNormalizer(new InMemoryInstrumentRegistry());
    const result = sn.resolve(PROVIDER, 'DOGEUSDT');
    expect(result.resolved).toBe(false);
    if (!result.resolved) expect(result.rejection.code).toBe('SYMBOL_UNKNOWN');
  });
});

describe('CanonicalNormalizer', () => {
  it('projects a raw trade into a canonical record with provenance', () => {
    const cn = new CanonicalNormalizer();
    const event = trade({ tradeId: 77 });
    const envelope: IngestionEnvelope = {
      providerId: PROVIDER,
      streamKey: streamKey(PROVIDER, event),
      event,
      receiveTime: T0,
      ingestSequence: 3,
    };
    const record = cn.normalize(envelope, INSTRUMENT_ID, {
      eventTime: T0,
      receiveTime: T0,
      processingTime: T0,
    });
    expect(record.kind).toBe('trade');
    expect(record.instrumentId).toBe(INSTRUMENT_ID);
    expect(record.marketDataType).toBe('TRADES');
    expect(record.provenance.providerId).toBe(PROVIDER);
    expect(record.provenance.sequence).toBe(77);
    expect(record.provenance.ingestSequence).toBe(3);
    expect(record.provenance.providerSymbol).toBe(VENUE_SYMBOL);
  });
});
