/**
 * Execution-engine application service — the orchestration surface of the canonical Execution Engine.
 * It receives approved orders (as execution requests) from the OMS and orchestrates the REAL
 * execution lifecycle (order received → execution planned → execution validated → waiting for venue →
 * executing → partially executed → completed / cancelled / failed) under the execution **policy
 * framework** (immediate / scheduled / time-window / partial / retry / timeout / priority /
 * throttling / venue-selection / risk-validation): it plans, validates, queues, executes slices,
 * applies actions (retry / pause / resume / cancel / replay), manages sessions, and serves the
 * queue/timeline/audit/history/replay/metrics/health/policies views. It integrates with the OMS,
 * Portfolio Optimization Engine, Risk Engine, Execution Simulator, Live Trading Platform, Monitoring
 * Module, Audit Center, Notification Center, Validation Foundation, Workflow Engine and Configuration
 * Foundation through ports ONLY.
 *
 * It holds no broker/exchange SDK, no API keys, no HTTP/WebSocket/FIX, and no order execution. All
 * lifecycle transitions are enforced by the state machine; routing is an abstraction dispatched
 * through the Execution Venue port, and the actual venue lives downstream.
 */
import {
  POLICY_CATALOG,
  VENUES,
  isActiveStatus,
  isTerminalStatus,
  isWorkingStatus,
  type Execution,
  type ExecutionAction,
  type ExecutionEvent,
  type ExecutionPlan,
  type ExecutionRequest,
  type ExecutionSession,
  type ExecutionTask,
  type ExecutionTimeline,
  type ExecutionValidation,
  type PolicyDescriptor,
  type VenueDescriptor,
} from '@platform/execution-engine-sdk';
import {
  applyAction,
  createExecution,
  failExecution,
  planStep,
  queueStep,
  validateStep,
  type LifecycleResult,
} from '../domain/lifecycle';
import { executeAll, executeSlice } from '../domain/executors';
import { planExecution, planTasks } from '../domain/planner';
import { validateExecution } from '../domain/validation';
import { type PolicyContext } from '../domain/policy-evaluators';
import {
  applyExecutionSearch,
  inScope,
  type ExecutionScope,
  type ExecutionSearch,
} from '../domain/search';
import { computeExecutionMetrics } from '../domain/metrics';
import { computeHealth, type ExecutionHealth } from '../domain/health';
import { replayExecution, type ReplayResult } from '../domain/replay';
import { summarizeSession, type SessionSummary } from '../domain/sessions';
import type {
  AuditPort,
  ConfigurationPort,
  EventBusPort,
  ExecutionStorePort,
  ExecutionVenuePort,
  NotificationPort,
  OmsPort,
  RiskPort,
  SessionStorePort,
  WorkflowPort,
} from '../infrastructure/ports';

export type OperationResult =
  | { readonly ok: true; readonly execution: Execution }
  | { readonly ok: false; readonly reason: string };

export interface PlanPreview {
  readonly plan: ExecutionPlan;
  readonly tasks: readonly ExecutionTask[];
  readonly validation: ExecutionValidation;
}

export interface ExecutionEngineServiceDeps {
  readonly store: ExecutionStorePort;
  readonly sessions: SessionStorePort;
  readonly venue: ExecutionVenuePort;
  readonly oms: OmsPort;
  readonly risk: RiskPort;
  readonly workflow: WorkflowPort;
  readonly audit: AuditPort;
  readonly notifications: NotificationPort;
  readonly bus: EventBusPort;
  readonly config: ConfigurationPort;
}

export class ExecutionEngineService {
  constructor(private readonly deps: ExecutionEngineServiceDeps) {}

  /* ------------------------------ read models ------------------------------ */

  listExecutions(): Promise<readonly Execution[]> {
    return this.deps.store.list();
  }

  async searchExecutions(query: ExecutionSearch = {}): Promise<readonly Execution[]> {
    return applyExecutionSearch(await this.deps.store.list(), query);
  }

  getExecution(id: string): Promise<Execution | null> {
    return this.deps.store.getById(id);
  }

  private async scope(scope: ExecutionScope): Promise<readonly Execution[]> {
    return (await this.deps.store.list()).filter((execution) => inScope(execution, scope));
  }

  queue(): Promise<readonly Execution[]> {
    return this.scope('QUEUE');
  }
  activeExecutions(): Promise<readonly Execution[]> {
    return this.scope('ACTIVE');
  }
  workingExecutions(): Promise<readonly Execution[]> {
    return this.scope('WORKING');
  }
  completedExecutions(): Promise<readonly Execution[]> {
    return this.scope('COMPLETED');
  }
  failedExecutions(): Promise<readonly Execution[]> {
    return this.scope('FAILED');
  }
  cancelledExecutions(): Promise<readonly Execution[]> {
    return this.scope('CANCELLED');
  }

  listPolicies(): readonly PolicyDescriptor[] {
    return POLICY_CATALOG;
  }
  listVenues(): readonly VenueDescriptor[] {
    return VENUES;
  }

  listSessions(): Promise<readonly ExecutionSession[]> {
    return this.deps.sessions.list();
  }

  async sessionSummary(id: string): Promise<SessionSummary | null> {
    const session = await this.deps.sessions.getById(id);
    if (!session) return null;
    return summarizeSession(session, await this.deps.store.list());
  }

  async metrics() {
    return computeExecutionMetrics(await this.deps.store.list());
  }

  async health(at: string): Promise<ExecutionHealth> {
    return computeHealth(await this.deps.store.list(), at);
  }

  async executionTimeline(id: string): Promise<readonly ExecutionEvent[]> {
    const execution = await this.deps.store.getById(id);
    return execution ? execution.events : [];
  }

  async executionAudit(id: string): Promise<Execution['audit']> {
    const execution = await this.deps.store.getById(id);
    return execution ? execution.audit : [];
  }

  async executionHistory(id: string): Promise<ExecutionTimeline | null> {
    const execution = await this.deps.store.getById(id);
    return execution
      ? { executionId: execution.id, states: execution.states, events: execution.events }
      : null;
  }

  async replay(id: string): Promise<ReplayResult | null> {
    const execution = await this.deps.store.getById(id);
    return execution ? replayExecution(execution) : null;
  }

  /* ------------------------------ orchestration ---------------------------- */

  /** Execution Planner preview — build a plan + tasks + validation without persisting. */
  previewPlan(request: ExecutionRequest, riskApproved: boolean, at: string): PlanPreview {
    const ctx: PolicyContext = {
      now: at,
      mode: request.mode,
      riskApproved,
      attempts: 0,
      quantity: request.quantity,
    };
    const plan = planExecution(request, ctx, at);
    return {
      plan,
      tasks: planTasks(plan, request.quantity),
      validation: validateExecution(request, plan, at),
    };
  }

  /** Receive an approved order: create → plan → validate → persist. Returns the execution. */
  async submitExecutionRequest(
    request: ExecutionRequest,
    at: string,
    riskApproved = true,
  ): Promise<Execution> {
    const ctx: PolicyContext = {
      now: at,
      mode: request.mode,
      riskApproved,
      attempts: 0,
      quantity: request.quantity,
    };
    const plan = planExecution(request, ctx, at);
    const planned = planStep(
      createExecution(request, at),
      plan,
      planTasks(plan, request.quantity),
      'exec-planner',
      at,
    );
    const execution = planned.ok
      ? validateStep(planned.execution, validateExecution(request, plan, at), 'exec-validator', at)
      : planned;
    const result = execution.ok
      ? execution.execution
      : (planned as { execution: Execution }).execution;
    await this.deps.store.save(result);
    await this.deps.oms.acknowledge(request.orderId, result.id);
    await this.publish(result, 'EXECUTION_RECEIVED');
    return result;
  }

  queueExecution(id: string, actor: string, at: string): Promise<OperationResult> {
    return this.run(
      id,
      (execution) => queueStep(execution, actor, at),
      async (execution) => {
        if (execution.plan)
          await this.deps.venue.route(execution.id, {
            venue: execution.plan.venue,
            mode: execution.plan.mode,
          });
        await this.deps.workflow.scheduleExecution(execution.id);
      },
    );
  }

  /** Execute the next slice at the supplied price (from the venue abstraction). */
  executeSlice(id: string, price: number, at: string): Promise<OperationResult> {
    return this.run(id, (execution) => executeSlice(execution, price, at));
  }

  /** Execute all remaining slices at the supplied price (a full run). */
  executeFull(id: string, price: number, at: string): Promise<OperationResult> {
    return this.run(id, (execution) => executeAll(execution, price, at));
  }

  failExecution(id: string, reason: string, actor: string, at: string): Promise<OperationResult> {
    return this.run(id, (execution) => failExecution(execution, reason, actor, at));
  }

  /** Apply a lifecycle action (retry / pause / resume / cancel / replay). */
  applyAction(
    id: string,
    action: ExecutionAction,
    actor: string,
    at: string,
  ): Promise<OperationResult> {
    return this.run(
      id,
      (execution) => applyAction(execution, action, actor, at),
      async (execution) => {
        if (action === 'cancel') await this.deps.venue.cancel(execution.id);
      },
    );
  }

  /** Advance an execution one step along the happy path (for orchestration/testing). */
  async advance(id: string, price: number, actor: string, at: string): Promise<OperationResult> {
    const execution = await this.deps.store.getById(id);
    if (!execution) return { ok: false, reason: `unknown execution ${id}` };
    switch (execution.status) {
      case 'EXECUTION_VALIDATED':
        return this.queueExecution(id, actor, at);
      case 'WAITING_FOR_VENUE':
      case 'EXECUTING':
      case 'PARTIALLY_EXECUTED':
        return this.executeSlice(id, price, at);
      default:
        return { ok: false, reason: `no happy-path advance from ${execution.status}` };
    }
  }

  /* --------------------------------- helpers -------------------------------- */

  private async run(
    id: string,
    apply: (execution: Execution) => LifecycleResult,
    effects?: (execution: Execution) => Promise<void>,
  ): Promise<OperationResult> {
    const execution = await this.deps.store.getById(id);
    if (!execution) return { ok: false, reason: `unknown execution ${id}` };
    const result = apply(execution);
    if (!result.ok) return { ok: false, reason: result.reason };
    await this.deps.store.save(result.execution);
    const last = result.execution.events[result.execution.events.length - 1];
    await this.deps.audit.record({
      executionId: result.execution.id,
      actor: last?.actor ?? 'exec',
      action: last?.type ?? 'UPDATED',
      at: last?.at ?? result.execution.updatedAt,
    });
    await this.publish(result.execution, last?.type ?? 'UPDATED');
    if (effects) await effects(result.execution);
    return { ok: true, execution: result.execution };
  }

  private async publish(execution: Execution, type: string): Promise<void> {
    await this.deps.bus.publish({
      id: `${execution.id}:${type}:${execution.updatedAt}`,
      executionId: execution.id,
      type,
      message: `${execution.clientOrderId} ${type} (${execution.status}).`,
      occurredAt: execution.updatedAt,
    });
  }
}

/** A small summary derived from a set of executions (for the dashboard header). */
export function summarize(executions: readonly Execution[]) {
  return {
    total: executions.length,
    active: executions.filter((e) => isActiveStatus(e.status)).length,
    working: executions.filter((e) => isWorkingStatus(e.status)).length,
    completed: executions.filter((e) => e.status === 'COMPLETED').length,
    failed: executions.filter((e) => e.status === 'FAILED').length,
    cancelled: executions.filter((e) => e.status === 'CANCELLED').length,
    terminal: executions.filter((e) => isTerminalStatus(e.status)).length,
  };
}
