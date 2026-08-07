import { bench, describe } from 'vitest';
import { Correlator, JsonMessageCodec, MessageRouter, SubscriptionManager } from '../src/index';
import { ManualScheduler } from '@platform/http-client';

const codec = new JsonMessageCodec();
const encoded = codec.encode({ topic: 'trades', price: 100, qty: 2 });

const subscriptions = new SubscriptionManager();
let sink = 0;
subscriptions.add('trades', () => (sink += 1), 0);
subscriptions.setActive('trades', true);

const correlator = new Correlator(new ManualScheduler());
const router = new MessageRouter({
  subscriptions,
  correlator,
  resolveCorrelationId: (m) => (m as { id?: string }).id,
  resolveTopic: (m) => (m as { topic?: string }).topic,
  onUnknown: () => {},
});
const topicMessage = { topic: 'trades', price: 1 };

describe('websocket codec & routing', () => {
  bench('json encode', () => {
    codec.encode({ topic: 'trades', price: 100, qty: 2 });
  });
  bench('json decode', () => {
    codec.decode(encoded);
  });
  bench('route a topic message to a subscription', () => {
    router.route(topicMessage);
  });
  bench('decode + route', () => {
    router.route(codec.decode(encoded));
  });
});
