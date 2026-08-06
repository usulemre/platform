/**
 * In-memory foundation adapters. ABSTRACTIONS with no real IO: no provider SDK,
 * no persistence engine, no exchange client. Canonical datasets are consumed from
 * the Data Ingestion Pipeline via a stub handle list.
 */
import type {
  ConfigurationPort,
  IngestionDatasetHandle,
  IngestionDatasetPort,
  ValidationPort,
  WorkflowPort,
} from '../ports';
import { DATASETS } from './seed';

/** Consumes canonical datasets from the Data Ingestion Pipeline (by ref only). */
export class StubIngestionDatasetSource implements IngestionDatasetPort {
  constructor(
    private readonly handles: readonly IngestionDatasetHandle[] = DATASETS.map((dataset) => ({
      ingestionRef: dataset.ingestionRef,
      name: dataset.name,
    })),
  ) {}
  async listCanonicalDatasets(): Promise<readonly IngestionDatasetHandle[]> {
    return this.handles;
  }
}

/** Validation Foundation stub — a dataset is catalogued when ingestion knows it. */
export class StubValidation implements ValidationPort {
  constructor(
    private readonly knownRefs: ReadonlySet<string> = new Set(
      DATASETS.map((dataset) => dataset.ingestionRef),
    ),
  ) {}
  async isCatalogued(ingestionRef: string): Promise<boolean> {
    return this.knownRefs.has(ingestionRef);
  }
}

/** Workflow Engine port stub — records refresh scheduling requests. */
export class StubWorkflow implements WorkflowPort {
  readonly scheduled: string[] = [];
  async scheduleRefresh(datasetId: string): Promise<void> {
    this.scheduled.push(datasetId);
  }
}

/** Configuration Foundation stub — static, non-secret key/values. */
export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
