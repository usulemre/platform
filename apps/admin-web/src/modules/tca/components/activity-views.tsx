'use client';

import { useState } from 'react';
import { useExecutionRefs, useExecutionReplay, useTcaTimeline } from '../hooks/use-tca';
import { InfoCard, StatusBadge, TcaLoading, ToneText, selectClass } from './tca-atoms';
import { TimelineTable } from './tca-tables';

/** Execution Timeline — every analyzed execution in reverse-chronological order with cost and grade. */
export function ExecutionTimeline() {
  const { data, isLoading } = useTcaTimeline();
  if (isLoading || !data) return <TcaLoading rows={8} />;
  return (
    <div className="space-y-4">
      <InfoCard title="Execution timeline">
        <TimelineTable rows={data} />
      </InfoCard>
    </div>
  );
}

/** Execution Replay — walk an execution fill-by-fill, accumulating the running weighted price and its
 *  slippage against the arrival price (a deterministic reconstruction of the cost path). */
export function ExecutionReplay() {
  const refs = useExecutionRefs();
  const [selected, setSelected] = useState('');
  const id = selected || refs.data?.[0]?.id || '';
  const replay = useExecutionReplay(id);

  if (refs.isLoading || !refs.data) return <TcaLoading rows={8} />;
  return (
    <div className="space-y-4">
      <InfoCard
        title="Execution replay"
        action={
          <select
            className={selectClass}
            value={id}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Execution"
          >
            {refs.data.map((ref) => (
              <option key={ref.id} value={ref.id}>
                {ref.id} · {ref.symbol} {ref.side}
              </option>
            ))}
          </select>
        }
      >
        {replay.isLoading || !replay.data ? (
          <TcaLoading rows={6} />
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span>
                Arrival <span className="font-mono">{replay.data.arrivalPrice}</span>
              </span>
              <span>
                Final WAEP <span className="font-mono">{replay.data.finalWaep}</span>
              </span>
              <StatusBadge
                label={replay.data.consistent ? 'Reconstruction consistent' : 'Inconsistent'}
                tone={replay.data.consistent ? 'positive' : 'danger'}
              />
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium">Step</th>
                    <th className="px-3 py-1.5 text-left font-medium">Venue</th>
                    <th className="px-3 py-1.5 text-right font-medium">Qty</th>
                    <th className="px-3 py-1.5 text-right font-medium">Price</th>
                    <th className="px-3 py-1.5 text-right font-medium">Running WAEP</th>
                    <th className="px-3 py-1.5 text-right font-medium">vs Arrival</th>
                  </tr>
                </thead>
                <tbody>
                  {replay.data.steps.map((step) => (
                    <tr key={step.index} className="border-t">
                      <td className="px-3 py-1">{step.label}</td>
                      <td className="px-3 py-1">{step.venue}</td>
                      <td className="px-3 py-1 text-right font-mono">{step.quantity}</td>
                      <td className="px-3 py-1 text-right font-mono">{step.price}</td>
                      <td className="px-3 py-1 text-right font-mono">{step.runningWaep}</td>
                      <td className="px-3 py-1 text-right">
                        <ToneText value={step.vsArrivalBps} tone={step.vsArrivalTone} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </InfoCard>
    </div>
  );
}
