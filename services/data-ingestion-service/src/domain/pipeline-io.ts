/**
 * Lightweight domain IO shapes exchanged between pipeline stages. These carry
 * COUNTS and REFERENCES only — never raw provider data and never secrets. They
 * exist so the pipeline runner can orchestrate stages as an abstraction without
 * any real payload, transport, or storage.
 */
import type { DataType } from '@platform/data-sdk';

export interface RawPayload {
  readonly sourceId: string;
  readonly dataType: DataType;
  readonly recordCount: number;
  readonly receivedAt: string;
}

export interface DecodedBatch {
  readonly recordCount: number;
}

export interface CanonicalBatch {
  readonly recordCount: number;
  readonly datasetRef: string;
}

export interface SchemaOutcome {
  readonly valid: boolean;
  readonly rejected: number;
  readonly message?: string;
}

export interface DatasetVersionRef {
  readonly datasetRef: string;
  readonly version: string;
}
