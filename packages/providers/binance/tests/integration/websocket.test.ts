import { describe, expect, it } from 'vitest';
import { BinanceWebSocketClient } from '../../src/ws/websocket-client';
import { BinanceMapper } from '../../src/mappers/mapper';
import { resolveBinanceConfiguration } from '../../src/config';
import { FakeSocketFactory, gatewayConfig } from '../helpers';
import type { CanonicalExecution, CanonicalTicker } from '../../src/types/canonical';

const config = resolveBinanceConfiguration(gatewayConfig());

function makeClient() {
  const factory = new FakeSocketFactory();
  const ws = new BinanceWebSocketClient({ config, mapper: new BinanceMapper('SPOT'), factory });
  return { ws, factory };
}

describe('BinanceWebSocketClient (integration over fake socket)', () => {
  it('sends a Binance SUBSCRIBE frame and delivers canonical tickers', async () => {
    const { ws, factory } = makeClient();
    await ws.connect();
    const received: CanonicalTicker[] = [];
    ws.subscribeTicker('BTC-USDT', (t) => received.push(t));

    const frames = factory.sentFrames();
    expect(frames).toContainEqual(
      expect.objectContaining({ method: 'SUBSCRIBE', params: ['btcusdt@ticker'] }),
    );

    factory.emit({
      stream: 'btcusdt@ticker',
      data: { s: 'BTCUSDT', c: '25000', b: '24999', a: '25001', E: 1 },
    });
    expect(received).toEqual([
      { symbol: 'BTCUSDT', lastPrice: 25000, bidPrice: 24999, askPrice: 25001, at: 1 },
    ]);
  });

  it('routes kline stream payloads to canonical klines', async () => {
    const { ws, factory } = makeClient();
    await ws.connect();
    let bar = 0;
    ws.subscribeKline('BTC-USDT', '1m', (k) => (bar = k.close));
    factory.emit({
      stream: 'btcusdt@kline_1m',
      data: {
        s: 'BTCUSDT',
        k: { t: 1, T: 60, i: '1m', o: '1', h: '2', l: '0.5', c: '1.5', v: '9', x: true },
      },
    });
    expect(bar).toBe(1.5);
  });

  it('delivers canonical executions on a user-data stream', () => {
    const { ws, factory } = makeClient();
    const executions: CanonicalExecution[] = [];
    ws.openUserDataStream('listen-key-123', { onExecution: (e) => executions.push(e) });
    expect(factory.socket?.url).toContain('/ws/listen-key-123');
    factory.emit({
      e: 'executionReport',
      s: 'BTCUSDT',
      S: 'BUY',
      o: 'LIMIT',
      X: 'FILLED',
      i: 55,
      c: 'c-9',
      l: '1',
      z: '1',
      L: '25000',
      E: 2,
    });
    expect(executions[0]).toMatchObject({ venueOrderId: '55', status: 'FILLED', side: 'BUY' });
  });
});
