import { describe, expect, it } from 'vitest';
import { EventMapper } from '../../src/websocket/event-mapper';
import { MarketDataValidator } from '../../src/websocket/validator';

/** A resolver that maps the documented sample symbols to canonical names. */
const resolver = {
  toCanonical: (venue: string) => (venue === 'BNBBTC' ? 'BNB-BTC' : `${venue}`),
};
const validator = new MarketDataValidator();

describe('EventMapper (canonical mappings of documented payloads)', () => {
  const mapper = new EventMapper(resolver, 'SPOT');

  it('maps a trade event', () => {
    const raw = validator.trade({
      e: 'trade',
      E: 123456789,
      s: 'BNBBTC',
      t: 12345,
      p: '0.001',
      q: '100',
      T: 123456785,
      m: true,
    });
    expect(mapper.trade(raw)).toEqual({
      kind: 'trade',
      symbol: 'BNB-BTC',
      venueSymbol: 'BNBBTC',
      tradeId: 12345,
      price: 0.001,
      quantity: 100,
      buyerIsMaker: true,
      tradeTime: 123456785,
      eventTime: 123456789,
    });
  });

  it('maps an aggregate trade event', () => {
    const raw = validator.aggTrade({
      e: 'aggTrade',
      E: 123456789,
      s: 'BNBBTC',
      a: 12345,
      p: '0.001',
      q: '100',
      f: 100,
      l: 105,
      T: 123456785,
      m: true,
    });
    expect(mapper.aggTrade(raw)).toMatchObject({
      kind: 'aggTrade',
      aggregateTradeId: 12345,
      firstTradeId: 100,
      lastTradeId: 105,
      price: 0.001,
      quantity: 100,
      buyerIsMaker: true,
    });
  });

  it('maps mini and full 24h tickers', () => {
    const mini = mapper.miniTicker(
      validator.miniTicker({
        e: '24hrMiniTicker',
        E: 1,
        s: 'BNBBTC',
        c: '0.0025',
        o: '0.0010',
        h: '0.0025',
        l: '0.0010',
        v: '10000',
        q: '18',
      }),
    );
    expect(mini).toMatchObject({ tickerKind: 'MINI', lastPrice: 0.0025, baseVolume: 10000 });

    const full = mapper.ticker(
      validator.ticker({
        e: '24hrTicker',
        E: 1,
        s: 'BNBBTC',
        p: '0.0015',
        P: '250.00',
        w: '0.0018',
        c: '0.0025',
        Q: '10',
        b: '0.0024',
        B: '10',
        a: '0.0026',
        A: '100',
        o: '0.0010',
        h: '0.0025',
        l: '0.0010',
        v: '10000',
        q: '18',
        n: 18151,
      }),
    );
    expect(full).toMatchObject({
      tickerKind: 'FULL',
      priceChangePercent: 250,
      bidPrice: 0.0024,
      askPrice: 0.0026,
      tradeCount: 18151,
    });
  });

  it('maps a rolling-window ticker with window ms', () => {
    const rolling = mapper.rollingTicker(
      validator.rollingTicker({
        e: '1hTicker',
        E: 1,
        s: 'BNBBTC',
        p: '0.0015',
        P: '250.00',
        o: '0.0010',
        h: '0.0025',
        l: '0.0010',
        c: '0.0025',
        w: '0.0018',
        v: '10000',
        q: '18',
        n: 18151,
      }),
    );
    expect(rolling).toMatchObject({ tickerKind: 'ROLLING', windowMs: 3_600_000 });
  });

  it('maps a book ticker', () => {
    const book = mapper.bookTicker(
      validator.bookTicker({
        u: 400900217,
        s: 'BNBUSDT',
        b: '25.35190000',
        B: '31.21000000',
        a: '25.36520000',
        A: '40.66000000',
      }),
    );
    expect(book).toMatchObject({
      kind: 'bookTicker',
      updateId: 400900217,
      bidPrice: 25.3519,
      askQuantity: 40.66,
    });
  });

  it('maps a kline event', () => {
    const kline = mapper.kline(
      validator.kline({
        e: 'kline',
        E: 123456789,
        s: 'BNBBTC',
        k: {
          t: 123400000,
          T: 123460000,
          s: 'BNBBTC',
          i: '1m',
          f: 100,
          L: 200,
          o: '0.0010',
          c: '0.0020',
          h: '0.0025',
          l: '0.0015',
          v: '1000',
          n: 100,
          x: false,
          q: '1.0000',
          V: '500',
          Q: '0.500',
          B: '123456',
        },
      }),
    );
    expect(kline).toMatchObject({
      interval: '1m',
      open: 0.001,
      close: 0.002,
      trades: 100,
      closed: false,
      takerBuyBaseVolume: 500,
    });
  });

  it('maps an average price event (Spot)', () => {
    const avg = mapper.avgPrice(
      validator.avgPrice({
        e: 'avgPrice',
        E: 1693907033000,
        s: 'BTCUSDT',
        i: '5m',
        w: '25776.86',
        T: 1693907032213,
      }),
    );
    expect(avg).toMatchObject({ kind: 'avgPrice', intervalMinutes: 5, averagePrice: 25776.86 });
  });

  it('maps a mark price event (Futures)', () => {
    const futures = new EventMapper(resolver, 'FUTURES');
    const mark = futures.markPrice(
      validator.markPrice({
        e: 'markPriceUpdate',
        E: 1562305380000,
        s: 'BTCUSDT',
        p: '11794.15000000',
        i: '11784.62659091',
        P: '11784.25641265',
        r: '0.00038167',
        T: 1562306400000,
      }),
    );
    expect(mark).toMatchObject({
      kind: 'markPrice',
      markPrice: 11794.15,
      indexPrice: 11784.62659091,
      fundingRate: 0.00038167,
      nextFundingTime: 1562306400000,
    });
  });

  it('maps spot and futures depth updates (pu only on futures)', () => {
    const spot = mapper.depthUpdate(
      validator.depthUpdate({
        e: 'depthUpdate',
        E: 123456789,
        s: 'BNBBTC',
        U: 157760,
        u: 157762,
        b: [['0.0024', '10']],
        a: [['0.0026', '100']],
      }),
    );
    expect(spot).toMatchObject({ firstUpdateId: 157760, finalUpdateId: 157762 });
    expect(spot.previousFinalUpdateId).toBeUndefined();

    const futures = new EventMapper(resolver, 'FUTURES');
    const fut = futures.depthUpdate(
      validator.depthUpdate({
        e: 'depthUpdate',
        E: 123456789,
        s: 'BTCUSDT',
        U: 100,
        u: 120,
        pu: 99,
        b: [],
        a: [],
      } as unknown),
    );
    expect(fut.previousFinalUpdateId).toBe(99);
  });
});

describe('MarketDataValidator', () => {
  it('rejects a payload missing a required field', () => {
    expect(() =>
      validator.trade({ e: 'trade', s: 'BNBBTC', t: 1, p: '1', q: '1', m: true, E: 1 }),
    ).toThrow(/field "T"/);
    expect(() => validator.aggTrade(null)).toThrow(/not an object/);
  });
});
