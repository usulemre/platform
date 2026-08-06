/**
 * Canonical Audit DTOs — the transport contract for auditable activity across the
 * platform. Inert data shapes only. Events are PRODUCED by the governed services
 * (Event & Messaging Foundation); this module only presents them. No persistence,
 * no event storage, no infrastructure logging, no secrets.
 */
import type { Page } from '@platform/types';

export type { Page };

export type EventCategoryDto =
  | 'USER'
  | 'AGENT'
  | 'WORKFLOW'
  | 'EXECUTION'
  | 'VALIDATION'
  | 'DATASET'
  | 'EXPERIMENT'
  | 'FEATURE'
  | 'SIGNAL'
  | 'STRATEGY'
  | 'PORTFOLIO'
  | 'GOVERNANCE'
  | 'AUTH'
  | 'SYSTEM';

export type OutcomeDto = 'SUCCESS' | 'FAILURE' | 'DENIED' | 'INFO';

export type ActorKindDto = 'USER' | 'AGENT' | 'SERVICE' | 'SYSTEM';

export interface ActorDto {
  readonly id: string;
  readonly displayName: string;
  readonly kind: ActorKindDto;
}

export interface TargetDto {
  readonly kind: string;
  readonly id: string;
  readonly name: string;
}

export interface MetadataEntryDto {
  readonly label: string;
  readonly value: string;
}

/** A single field change captured with the event (change history). */
export interface ChangeDto {
  readonly field: string;
  readonly from: string;
  readonly to: string;
}

/** Correlation / request / session / trace identifiers for traceability. */
export interface TraceDto {
  readonly correlationId: string;
  readonly requestId: string;
  readonly sessionId?: string;
  readonly traceId: string;
}

export interface AuditEventDto {
  readonly id: string;
  readonly category: EventCategoryDto;
  readonly action: string;
  readonly outcome: OutcomeDto;
  readonly actor: ActorDto;
  readonly target: TargetDto;
  readonly source: string;
  readonly occurredAt: string;
  readonly trace: TraceDto;
  readonly metadata: readonly MetadataEntryDto[];
  readonly changes: readonly ChangeDto[];
}
