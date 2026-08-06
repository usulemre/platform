/**
 * Signal Engine repository boundary — the ONLY data abstraction the application
 * service depends on. Concrete adapters implement it; the UI never sees a concrete
 * data source and never touches the service tier, a broker, or persistence.
 */
import type { RegisteredSignal, SignalFamily } from '@platform/signal-sdk';
import type { SignalQuery } from '../domain/query';

export type { SignalQuery };

export interface SignalEngineRepository {
  listSignals(query: SignalQuery): Promise<readonly RegisteredSignal[]>;
  getSignal(id: string): Promise<RegisteredSignal | null>;
  listFamilies(): Promise<readonly SignalFamily[]>;
  promotionQueue(): Promise<readonly RegisteredSignal[]>;
  approvalQueue(): Promise<readonly RegisteredSignal[]>;
}
