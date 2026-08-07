import { describe, expect, it } from 'vitest';
import { idempotencyPolicy, primaryTimestamp, recordIdentity } from '../src/index';
import { candlestick, orderBookDelta, ticker, trade } from './helpers';

describe('recordIdentity', () => {
  it('is stable and provider-independent for the same canonical event', () => {
    expect(recordIdentity(trade({ tradeId: 7 }))).toBe(recordIdentity(trade({ tradeId: 7 })));
    expect(recordIdentity(trade({ tradeId: 7 }))).toBe('t|BINANCE:BTC-USDT|7');
  });

  it('distinguishes different events', () => {
    expect(recordIdentity(trade({ tradeId: 1 }))).not.toBe(recordIdentity(trade({ tradeId: 2 })));
  });

  it('keys a candlestick by instrument+interval+openTime', () => {
    expect(recordIdentity(candlestick({ openTime: 111 }))).toBe('k|BINANCE:BTC-USDT|1m|111');
  });

  it('keys an order-book delta by its update-id range', () => {
    expect(recordIdentity(orderBookDelta({ firstUpdateId: 101, finalUpdateId: 105 }))).toBe(
      'obd|BINANCE:BTC-USDT|101-105',
    );
  });

  it('keys a stateless ticker by its primary time', () => {
    const t = ticker();
    expect(recordIdentity(t)).toBe(`tk|BINANCE:BTC-USDT|${primaryTimestamp(t.timestamps)}`);
  });
});

describe('idempotencyPolicy', () => {
  it('upserts candlesticks and skips everything else', () => {
    expect(idempotencyPolicy('candlestick')).toBe('upsert');
    expect(idempotencyPolicy('trade')).toBe('skip');
    expect(idempotencyPolicy('orderBookDelta')).toBe('skip');
  });
});

describe('primaryTimestamp', () => {
  it('prefers event time, then exchange, then receive', () => {
    expect(
      primaryTimestamp({ eventTime: 1, exchangeTime: 2, receiveTime: 3, processingTime: 4 }),
    ).toBe(1);
    expect(primaryTimestamp({ exchangeTime: 2, receiveTime: 3, processingTime: 4 })).toBe(2);
    expect(primaryTimestamp({ receiveTime: 3, processingTime: 4 })).toBe(3);
  });
});
