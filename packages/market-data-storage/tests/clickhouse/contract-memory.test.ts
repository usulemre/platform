import { ManualClock } from '@platform/market-data-ingestion';
import { InMemoryStorageEngine, MarketDataStorage } from '../../src/index';
import { runStorageContract } from '../shared/engine-contract';

// The in-memory reference engine must satisfy the same StorageEngine contract as ClickHouse.
runStorageContract('in-memory', async () => {
  const engine = new InMemoryStorageEngine();
  const storage = new MarketDataStorage({ engine, clock: new ManualClock(1_700_000_000_000) });
  return { storage, engine, cleanup: async () => {} };
});
