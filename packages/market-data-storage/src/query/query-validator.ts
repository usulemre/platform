/**
 * The **query validator** — the gate every query passes before any storage access. It proves a
 * {@link MarketDataQuerySpec} is well-formed against the canonical model: real instrument ids,
 * canonical market-data types, a coherent inclusive time range, a coherent sequence range, a positive
 * and bounded limit, a known order, and (if present) a decodable cursor whose order matches. Invalid
 * queries are rejected here as {@link QueryValidationError}s — they never reach the engine or the
 * database, so a malformed request can neither scan storage nor leak a database error. It performs no
 * I/O and is a pure function of its input (deterministic).
 */
import { MARKET_DATA_TYPES, type MarketDataType } from '@platform/market-data-sdk';
import { QueryValidationError, QueryError } from './query-errors';
import type { MarketDataQuerySpec, QueryOrder } from './query-spec';
import { decodeCursor } from './query-cursor';

const CANONICAL_TYPES: ReadonlySet<MarketDataType> = new Set(MARKET_DATA_TYPES);

export interface QueryValidatorOptions {
  /** The largest `limit` a single query/page may request. */
  readonly maxLimit: number;
}

/** The resolved, validated axes the engine executes against. */
export interface ResolvedQuery {
  readonly instrumentIds: readonly string[];
  readonly marketDataTypes: readonly MarketDataType[];
  readonly order: QueryOrder;
  readonly from?: number;
  readonly to?: number;
  readonly seqFrom?: number;
  readonly seqTo?: number;
}

export class QueryValidator {
  constructor(private readonly options: QueryValidatorOptions) {}

  /** Validate and normalize a spec, or throw a {@link QueryValidationError}. */
  validate(spec: MarketDataQuerySpec): ResolvedQuery {
    const instrumentIds = this.resolveInstruments(spec);
    const marketDataTypes = this.resolveTypes(spec);
    const order = this.resolveOrder(spec.order);
    const { from, to } = this.resolveTimeRange(spec);
    const { seqFrom, seqTo } = this.resolveSequenceRange(spec);
    this.checkLimit(spec.limit);
    // A present cursor must decode and agree with the resolved order (rejects tampering/mismatch).
    if (spec.cursor !== undefined) decodeCursor(spec.cursor, order);

    const resolved: ResolvedQuery = { instrumentIds, marketDataTypes, order };
    return {
      ...resolved,
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
      ...(seqFrom !== undefined ? { seqFrom } : {}),
      ...(seqTo !== undefined ? { seqTo } : {}),
    };
  }

  private resolveInstruments(spec: MarketDataQuerySpec): readonly string[] {
    const ids = new Set<string>();
    if (spec.instrumentId !== undefined) ids.add(spec.instrumentId);
    for (const id of spec.instrumentIds ?? []) ids.add(id);
    for (const id of ids) {
      if (typeof id !== 'string' || id.trim() === '') {
        throw new QueryValidationError(
          'QUERY_INVALID',
          'Instrument id must be a non-empty string.',
        );
      }
    }
    return [...ids];
  }

  private resolveTypes(spec: MarketDataQuerySpec): readonly MarketDataType[] {
    const types = new Set<MarketDataType>();
    if (spec.marketDataType !== undefined) types.add(spec.marketDataType);
    for (const t of spec.marketDataTypes ?? []) types.add(t);
    for (const t of types) {
      if (!CANONICAL_TYPES.has(t)) {
        throw new QueryError(
          'UNSUPPORTED_MARKET_DATA_TYPE',
          `Unsupported market-data type: ${String(t)}.`,
        );
      }
    }
    return [...types];
  }

  private resolveOrder(order: QueryOrder | undefined): QueryOrder {
    if (order === undefined) return 'asc';
    if (order !== 'asc' && order !== 'desc') {
      throw new QueryValidationError('QUERY_INVALID', `Unknown order: ${String(order)}.`);
    }
    return order;
  }

  private resolveTimeRange(spec: MarketDataQuerySpec): { from?: number; to?: number } {
    const { from, to } = spec.timeRange ?? {};
    if (from !== undefined && !Number.isFinite(from)) {
      throw new QueryError('TIME_RANGE_INVALID', 'Time-range start is not a finite number.');
    }
    if (to !== undefined && !Number.isFinite(to)) {
      throw new QueryError('TIME_RANGE_INVALID', 'Time-range end is not a finite number.');
    }
    if (from !== undefined && to !== undefined && from > to) {
      throw new QueryError('TIME_RANGE_INVALID', 'Time-range start is after its end.');
    }
    return {
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
    };
  }

  private resolveSequenceRange(spec: MarketDataQuerySpec): { seqFrom?: number; seqTo?: number } {
    const { from, to } = spec.sequenceRange ?? {};
    for (const [label, v] of [
      ['start', from],
      ['end', to],
    ] as const) {
      if (v !== undefined && (!Number.isInteger(v) || v < 0)) {
        throw new QueryError(
          'SEQUENCE_RANGE_INVALID',
          `Sequence-range ${label} must be a non-negative integer.`,
        );
      }
    }
    if (from !== undefined && to !== undefined && from > to) {
      throw new QueryError('SEQUENCE_RANGE_INVALID', 'Sequence-range start is after its end.');
    }
    return {
      ...(from !== undefined ? { seqFrom: from } : {}),
      ...(to !== undefined ? { seqTo: to } : {}),
    };
  }

  private checkLimit(limit: number | undefined): void {
    if (limit === undefined) return;
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new QueryError('LIMIT_INVALID', 'Limit must be a positive integer.');
    }
    if (limit > this.options.maxLimit) {
      throw new QueryError(
        'LIMIT_INVALID',
        `Limit exceeds the maximum of ${this.options.maxLimit}.`,
      );
    }
  }
}
