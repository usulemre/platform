/**
 * @platform/data-sdk — the shared Data SDK for the platform's ingestion layer.
 *
 * It is the single source of truth for the ingestion *vocabulary*: the canonical
 * pipeline stages, data-type catalog, reusable pipeline capabilities, shared
 * status/health/quality enums, pure pipeline primitives (retry / dedup /
 * quality), and the transport-agnostic contracts exchanged between the
 * data-ingestion service and its administration UI.
 *
 * It contains NO provider logic, NO storage, NO message broker, and NO transport.
 */
export * from './pipeline-stages';
export * from './data-types';
export * from './capabilities';
export * from './statuses';
export * from './primitives';
export * from './contracts';
