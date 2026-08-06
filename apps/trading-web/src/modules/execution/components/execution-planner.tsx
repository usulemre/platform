'use client';

import { useState } from 'react';
import { Button, Input } from '@platform/ui';
import type { ExecutionMode } from '@platform/execution-engine-sdk';
import { usePlanPreview } from '../hooks/use-execution';
import type { PlanPreviewVm } from '../domain/view-model';
import { InfoCard, StatusBadge, selectClass } from './execution-atoms';

function PreviewView({ preview }: { preview: PlanPreviewVm }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold">Plan: {preview.plan.strategy}</h3>
        <StatusBadge
          label={preview.validationPassed ? 'Valid' : 'Blocked'}
          tone={preview.validationPassed ? 'positive' : 'danger'}
        />
        <span className="text-xs text-muted-foreground">{preview.plan.note}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Venue</p>
          <p className="text-sm font-medium">{preview.plan.venue}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Slices</p>
          <p className="text-sm font-medium">
            {preview.plan.sliceCount} × {preview.plan.sliceQuantity}
          </p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Priority</p>
          <p className="text-sm font-medium">{preview.plan.priority}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Retry limit</p>
          <p className="text-sm font-medium">{preview.plan.retryLimit}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Timeout</p>
          <p className="text-sm font-medium">{preview.plan.timeoutSeconds}s</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs uppercase text-muted-foreground">Release</p>
          <p className="text-sm font-medium">{preview.plan.releaseLabel ?? 'immediate'}</p>
        </div>
      </div>
      <InfoCard title="Policy evaluations">
        <ul className="space-y-1 text-sm">
          {preview.plan.evaluations.map((evaluation) => (
            <li
              key={evaluation.type}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span>
                <span className="font-medium">{evaluation.type}</span>{' '}
                <span className="text-xs text-muted-foreground">{evaluation.detail}</span>
              </span>
              <StatusBadge
                label={evaluation.allow ? evaluation.decision : `blocked (${evaluation.decision})`}
                tone={evaluation.allow ? 'positive' : 'danger'}
              />
            </li>
          ))}
        </ul>
      </InfoCard>
      <InfoCard title="Validation">
        <ul className="space-y-1 text-sm">
          {preview.checks.map((check) => (
            <li key={check.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span>
                <span className="font-medium">{check.label}</span>{' '}
                <span className="text-xs text-muted-foreground">{check.detail}</span>
              </span>
              <StatusBadge label={check.status.label} tone={check.status.tone} />
            </li>
          ))}
        </ul>
      </InfoCard>
      <InfoCard title="Child tasks (slices)">
        <div className="flex flex-wrap gap-2 text-xs">
          {preview.tasks.map((task) => (
            <span key={task.id} className="rounded-md border px-2 py-1">
              #{task.sliceIndex + 1}: {task.quantity}
            </span>
          ))}
        </div>
      </InfoCard>
    </div>
  );
}

/** Execution Planner — preview a deterministic execution plan for a hypothetical request. */
export function ExecutionPlanner() {
  const preview = usePlanPreview();
  const [symbol, setSymbol] = useState('AAPL');
  const [quantity, setQuantity] = useState(1000);
  const [mode, setMode] = useState<ExecutionMode>('SIMULATED');
  const [sliceCount, setSliceCount] = useState(4);
  const [scheduled, setScheduled] = useState(false);
  const [delay, setDelay] = useState(15);
  const [risk, setRisk] = useState(true);
  const [riskApproved, setRiskApproved] = useState(true);
  const [priority, setPriority] = useState(5);

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <InfoCard title="Execution request">
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Symbol</span>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1" />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Quantity</span>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Mode</span>
            <select
              aria-label="Mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as ExecutionMode)}
              className={`${selectClass} mt-1 w-full`}
            >
              <option value="SIMULATED">Simulated</option>
              <option value="PAPER">Paper</option>
              <option value="LIVE">Live</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Slices (partial policy)</span>
            <Input
              type="number"
              min={1}
              max={100}
              value={sliceCount}
              onChange={(e) => setSliceCount(Number(e.target.value))}
              className="mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Priority</span>
            <Input
              type="number"
              min={0}
              max={10}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="mt-1"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={scheduled}
              onChange={(e) => setScheduled(e.target.checked)}
            />
            <span>Scheduled release</span>
          </label>
          {scheduled ? (
            <label className="block">
              <span className="text-xs uppercase text-muted-foreground">Delay (min)</span>
              <Input
                type="number"
                min={0}
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="mt-1"
              />
            </label>
          ) : null}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={risk} onChange={(e) => setRisk(e.target.checked)} />
            <span>Risk validation policy</span>
          </label>
          {risk ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={riskApproved}
                onChange={(e) => setRiskApproved(e.target.checked)}
              />
              <span>Risk approved</span>
            </label>
          ) : null}
          <Button
            className="w-full"
            onClick={() =>
              preview.mutate({
                symbol,
                quantity,
                mode,
                sliceCount,
                scheduledDelayMinutes: scheduled ? delay : null,
                riskValidation: risk,
                riskApproved,
                priority,
              })
            }
          >
            Preview plan
          </Button>
        </div>
      </InfoCard>
      <div>
        {preview.data ? (
          <PreviewView preview={preview.data} />
        ) : (
          <p className="py-8 text-sm text-muted-foreground">
            Configure a request and preview its execution plan.
          </p>
        )}
      </div>
    </div>
  );
}
