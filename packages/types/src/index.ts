/**
 * @platform/types — shared, technology-independent TypeScript types for the
 * frontend. These are inert type declarations only: no runtime logic, no
 * decisions (CLAUDE.md CP-8 asset-agnostic; LLM-2). They mirror the shapes the
 * governed service APIs expose; they never encode business rules.
 */

/** An ISO-8601 timestamp string (transport representation only). */
export type Iso8601 = string;

/** Opaque, content-addressed or versioned identifier (NM-2). */
export type Id = string;

export interface ApiVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

/** Read-only page envelope returned by list endpoints. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** Administrative response status surfaced by the governed Admin API. */
export type AdminStatus = 'OK' | 'ACCEPTED' | 'PENDING_COUNTER_SIGN' | 'REJECTED' | 'ERROR';

export type PrincipalKind = 'USER' | 'SERVICE' | 'AGENT';

export interface Principal {
  readonly id: Id;
  readonly kind: PrincipalKind;
  readonly displayName: string;
}

/** A pointer to a consequential decision made by a deterministic engine. */
export interface DecisionRef {
  readonly id: Id;
  readonly kind: string;
  readonly occurredAt: Iso8601;
}
