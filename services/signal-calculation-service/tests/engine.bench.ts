import { bench, describe } from 'vitest';
import { executableSignals, getExecutor } from '../src/domain/executors';
import { syntheticSeries } from '../src/infrastructure/in-memory/synthetic-data';

const SERIES = syntheticSeries(50_000, 0xfeed_1234);

describe('signal executors over 50k bars', () => {
  for (const key of executableSignals()) {
    const executor = getExecutor(key);
    bench(key, () => void executor(SERIES, {}));
  }
});
