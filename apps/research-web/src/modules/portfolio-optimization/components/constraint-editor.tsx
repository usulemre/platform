'use client';

import { Button, Input } from '@platform/ui';
import { useConstraintStore } from '../domain/constraint-store';
import { InfoCard, StatusBadge } from './portfolio-optimization-atoms';

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <Input
        type="number"
        min={min}
        max={max}
        step={step ?? 'any'}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1"
      />
    </label>
  );
}

/** Constraint Editor — edits the shared constraint configuration used across the optimization surface. */
export function ConstraintEditor() {
  const { constraints, update, reset } = useConstraintStore();

  const minLeMax = constraints.minWeight <= constraints.maxWeight;
  const cashValid = constraints.cashReserve >= 0 && constraints.cashReserve < 1;
  const longOnlyValid = !constraints.longOnly || constraints.minWeight >= 0;
  const consistent = minLeMax && cashValid && longOnlyValid;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <InfoCard
        title="Constraints"
        action={
          <Button size="sm" variant="outline" onClick={reset}>
            Reset
          </Button>
        }
      >
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={constraints.longOnly}
              onChange={(event) =>
                update({
                  longOnly: event.target.checked,
                  minWeight: event.target.checked
                    ? Math.max(0, constraints.minWeight)
                    : constraints.minWeight,
                })
              }
            />
            <span>Long only (no short positions)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Min weight"
              value={constraints.minWeight}
              step={0.01}
              onChange={(v) => update({ minWeight: v })}
            />
            <NumberField
              label="Max weight"
              value={constraints.maxWeight}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => update({ maxWeight: v })}
            />
            <NumberField
              label="Max leverage"
              value={constraints.maxLeverage}
              min={0.1}
              step={0.1}
              onChange={(v) => update({ maxLeverage: v })}
            />
            <NumberField
              label="Cash reserve"
              value={constraints.cashReserve}
              min={0}
              max={0.95}
              step={0.05}
              onChange={(v) => update({ cashReserve: v })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={constraints.maxTurnover !== null}
              onChange={(event) => update({ maxTurnover: event.target.checked ? 0.5 : null })}
            />
            <span>Limit turnover</span>
          </label>
          {constraints.maxTurnover !== null ? (
            <NumberField
              label="Max turnover"
              value={constraints.maxTurnover}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => update({ maxTurnover: v })}
            />
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={constraints.maxSectorExposure !== null}
              onChange={(event) => update({ maxSectorExposure: event.target.checked ? 0.5 : null })}
            />
            <span>Limit sector exposure</span>
          </label>
          {constraints.maxSectorExposure !== null ? (
            <NumberField
              label="Max sector exposure"
              value={constraints.maxSectorExposure}
              min={0.1}
              max={1}
              step={0.05}
              onChange={(v) => update({ maxSectorExposure: v })}
            />
          ) : null}
        </div>
      </InfoCard>

      <InfoCard title="Consistency">
        <ul className="space-y-1 text-sm">
          <li className="flex items-center justify-between gap-4 border-b py-1">
            <span>Min weight ≤ max weight</span>
            <StatusBadge
              label={minLeMax ? 'OK' : 'Invalid'}
              tone={minLeMax ? 'positive' : 'danger'}
            />
          </li>
          <li className="flex items-center justify-between gap-4 border-b py-1">
            <span>Cash reserve in [0, 1)</span>
            <StatusBadge
              label={cashValid ? 'OK' : 'Invalid'}
              tone={cashValid ? 'positive' : 'danger'}
            />
          </li>
          <li className="flex items-center justify-between gap-4 border-b py-1">
            <span>Long-only floor ≥ 0</span>
            <StatusBadge
              label={longOnlyValid ? 'OK' : 'Invalid'}
              tone={longOnlyValid ? 'positive' : 'danger'}
            />
          </li>
          <li className="flex items-center justify-between gap-4 py-1">
            <span>Mandate</span>
            <StatusBadge label={constraints.longOnly ? 'Long only' : 'Long / short'} tone="info" />
          </li>
        </ul>
        <p role="note" className="mt-3 text-xs text-muted-foreground">
          For an n-asset portfolio the budget is feasible only when{' '}
          <span className="font-mono">n · maxWeight ≥ 1 − cashReserve</span>. These constraints are
          applied by the engine&rsquo;s Constraint Engine to every optimizer via feasible-set
          projection.
        </p>
        {!consistent ? (
          <p className="mt-2 text-sm text-destructive">
            Fix the invalid constraints before optimizing.
          </p>
        ) : null}
      </InfoCard>
    </div>
  );
}
