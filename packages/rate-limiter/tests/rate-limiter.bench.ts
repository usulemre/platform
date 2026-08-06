import { bench, describe } from 'vitest';
import { ManualScheduler } from '@platform/http-client';
import {
  FixedWindowLimiter,
  LeakyBucketLimiter,
  RateLimiter,
  SlidingWindowLimiter,
  TokenBucketLimiter,
  createRateLimitPolicy,
} from '../src/index';

const tb = new TokenBucketLimiter({ limit: 1000, intervalMs: 1000, burst: 1000 }, 0);
const lb = new LeakyBucketLimiter({ limit: 1000, intervalMs: 1000, burst: 1000 }, 0);
const fw = new FixedWindowLimiter({ limit: 1_000_000, intervalMs: 1000 }, 0);
const sw = new SlidingWindowLimiter({ limit: 1_000_000, intervalMs: 1000 });

let clock = 0;

describe('rate-limit algorithms', () => {
  bench('token bucket tryAcquire', () => {
    tb.tryAcquire(1, (clock += 1));
  });
  bench('leaky bucket tryAcquire', () => {
    lb.tryAcquire(1, (clock += 1));
  });
  bench('fixed window tryAcquire', () => {
    fw.tryAcquire(1, (clock += 1));
  });
  bench('sliding window tryAcquire', () => {
    sw.tryAcquire(1, (clock += 1));
  });
});

describe('rate limiter facade', () => {
  bench('acquire + release (immediate, token bucket)', async () => {
    const rl = new RateLimiter(
      'bench',
      createRateLimitPolicy({ params: { limit: 1_000_000, intervalMs: 1000 } }),
      { scheduler: new ManualScheduler({ startAt: 0 }) },
    );
    const permit = await rl.acquire();
    permit.release();
  });
});
