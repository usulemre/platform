/**
 * Canonical Notification DTOs — the transport contract for user-facing
 * notifications emitted by the platform's application services. Inert data shapes
 * only. The Notification Center CONSUMES notifications; it never delivers them.
 * No email, no push, no WebSocket, no persistence, no infrastructure.
 */
import type { Page } from '@platform/types';

export type { Page };

export type NotificationCategoryDto =
  | 'SYSTEM'
  | 'RESEARCH'
  | 'WORKFLOW'
  | 'EXECUTION'
  | 'RISK'
  | 'VALIDATION'
  | 'DATASET'
  | 'EXPERIMENT'
  | 'FEATURE'
  | 'SIGNAL'
  | 'STRATEGY'
  | 'PORTFOLIO'
  | 'MONITORING'
  | 'AGENT'
  | 'GOVERNANCE';

export type PriorityDto = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type NotificationStatusDto = 'UNREAD' | 'READ' | 'ARCHIVED';

export type DeliveryStatusDto = 'DELIVERED' | 'PENDING' | 'FAILED';

export interface MetadataEntryDto {
  readonly label: string;
  readonly value: string;
}

export interface NotificationDto {
  readonly id: string;
  readonly category: NotificationCategoryDto;
  readonly priority: PriorityDto;
  readonly status: NotificationStatusDto;
  readonly delivery: DeliveryStatusDto;
  readonly title: string;
  readonly body: string;
  readonly source: string;
  readonly sourceRef: string;
  readonly createdAt: string;
  readonly readAt?: string;
  readonly metadata: readonly MetadataEntryDto[];
}

/** Per-category delivery preferences (read-only placeholder in v1). */
export interface PreferenceDto {
  readonly category: NotificationCategoryDto;
  readonly inApp: boolean;
  readonly digest: boolean;
}
