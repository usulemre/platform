import { bench, describe } from 'vitest';
import { resolveConstraints } from '@platform/portfolio-optimization-sdk';
import { buildInput } from '../src/domain/input';
import { executableOptimizers, getExecutor } from '../src/domain/executors';
import { SYNTHETIC_UNIVERSES } from '../src/infrastructure/in-memory/synthetic-data';

const INPUT = buildInput(SYNTHETIC_UNIVERSES[2]!); // the 12-asset universe
const CONFIG = resolveConstraints();

describe('portfolio optimizers over a 12-asset universe', () => {
  for (const key of executableOptimizers()) {
    const executor = getExecutor(key);
    bench(key, () => void executor(INPUT, CONFIG, {}));
  }
});
