import { bench, describe } from 'vitest';
import { executableFeatures } from '../src/domain/executors';
import { getExecutor } from '../src/domain/executors';
import { syntheticSeries } from '../src/infrastructure/in-memory/synthetic-data';

const SERIES = syntheticSeries(50_000, 0xfeed_1234);

describe('feature executors over 50k bars', () => {
  for (const key of executableFeatures()) {
    const executor = getExecutor(key);
    bench(key, () => void executor(SERIES, {}));
  }
});
