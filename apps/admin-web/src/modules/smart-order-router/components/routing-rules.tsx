'use client';

import { useState } from 'react';
import { Button, Input } from '@platform/ui';
import type { RoutingPolicyType } from '@platform/sor-sdk';
import { ROUTING_POLICY_CATALOG } from '@platform/sor-sdk';
import { usePreviewRoute } from '../hooks/use-sor';
import type { RankedVenueVm, RoutePreviewVm } from '../domain/view-model';
import { InfoCard, StatusBadge, selectClass } from './sor-atoms';

export function RankedVenueTable({ ranked }: { ranked: readonly RankedVenueVm[] }) {
  if (ranked.length === 0)
    return <p className="text-sm text-muted-foreground">No feasible venues.</p>;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">#</th>
            <th className="px-3 py-1.5 text-left font-medium">Venue</th>
            <th className="px-3 py-1.5 text-right font-medium">Score</th>
            <th className="px-3 py-1.5 text-right font-medium">Cost</th>
            <th className="px-3 py-1.5 text-right font-medium">Latency</th>
            <th className="px-3 py-1.5 text-right font-medium">Liquidity</th>
            <th className="px-3 py-1.5 text-right font-medium">Fill</th>
            <th className="px-3 py-1.5 text-left font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((venue) => (
            <tr key={venue.venueId} className="border-t">
              <td className="px-3 py-1 font-mono text-xs text-muted-foreground">{venue.rank}</td>
              <td className="px-3 py-1 font-medium">
                {venue.venueName}{' '}
                <span className="text-xs text-muted-foreground">{venue.venueType}</span>
              </td>
              <td className="px-3 py-1 text-right font-mono">{venue.scorePct}</td>
              <td className="px-3 py-1 text-right font-mono text-muted-foreground">{venue.cost}</td>
              <td className="px-3 py-1 text-right font-mono text-muted-foreground">
                {venue.latency}
              </td>
              <td className="px-3 py-1 text-right font-mono text-muted-foreground">
                {venue.liquidity}
              </td>
              <td className="px-3 py-1 text-right font-mono text-muted-foreground">{venue.fill}</td>
              <td className="px-3 py-1">
                {venue.selected ? (
                  <StatusBadge label="selected" tone="positive" />
                ) : venue.fallback ? (
                  <StatusBadge label="fallback" tone="info" />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewView({ preview }: { preview: RoutePreviewVm }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold">{preview.decision.policyType}</h3>
        <StatusBadge
          label={preview.ok ? `Routes to ${preview.decision.selectedVenue}` : 'No route'}
          tone={preview.ok ? 'positive' : 'danger'}
        />
        <span className="text-xs text-muted-foreground">
          {preview.feasibleCount}/{preview.candidateCount} feasible · {preview.decision.reason}
        </span>
      </div>
      <InfoCard title="Venue ranking">
        <RankedVenueTable ranked={preview.decision.ranked} />
      </InfoCard>
      {preview.excluded.length > 0 ? (
        <InfoCard title="Excluded venues">
          <ul className="space-y-1 text-sm">
            {preview.excluded.map((venue) => (
              <li
                key={venue.venueId}
                className="flex items-center justify-between gap-4 border-b py-1"
              >
                <span className="font-mono text-xs">{venue.venueId}</span>
                <StatusBadge label={venue.reason} tone="neutral" />
              </li>
            ))}
          </ul>
        </InfoCard>
      ) : null}
    </div>
  );
}

/** Routing Rules — preview a deterministic routing decision for a hypothetical request. */
export function RoutingRules() {
  const preview = usePreviewRoute();
  const [symbol, setSymbol] = useState('AAPL');
  const [quantity, setQuantity] = useState(1000);
  const [assetClass, setAssetClass] = useState('EQUITY');
  const [mode, setMode] = useState<'SIMULATED' | 'PAPER' | 'LIVE'>('SIMULATED');
  const [policyType, setPolicyType] = useState<RoutingPolicyType>('BEST_AVAILABLE');
  const [preferredVenueId, setPreferredVenueId] = useState('');

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <InfoCard title="Routing request">
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
            <span className="text-xs uppercase text-muted-foreground">Asset class</span>
            <select
              aria-label="Asset class"
              value={assetClass}
              onChange={(e) => setAssetClass(e.target.value)}
              className={`${selectClass} mt-1 w-full`}
            >
              <option value="EQUITY">Equity</option>
              <option value="CRYPTO">Crypto</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Mode</span>
            <select
              aria-label="Mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as 'SIMULATED' | 'PAPER' | 'LIVE')}
              className={`${selectClass} mt-1 w-full`}
            >
              <option value="SIMULATED">Simulated</option>
              <option value="PAPER">Paper</option>
              <option value="LIVE">Live</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Policy</span>
            <select
              aria-label="Policy"
              value={policyType}
              onChange={(e) => setPolicyType(e.target.value as RoutingPolicyType)}
              className={`${selectClass} mt-1 w-full`}
            >
              {ROUTING_POLICY_CATALOG.map((policy) => (
                <option key={policy.type} value={policy.type}>
                  {policy.label}
                </option>
              ))}
            </select>
          </label>
          {policyType === 'PREFERRED_VENUE' || policyType === 'MANUAL_OVERRIDE' ? (
            <label className="block">
              <span className="text-xs uppercase text-muted-foreground">Preferred venue id</span>
              <Input
                value={preferredVenueId}
                onChange={(e) => setPreferredVenueId(e.target.value)}
                placeholder="nasdaq"
                className="mt-1"
              />
            </label>
          ) : null}
          <Button
            className="w-full"
            onClick={() =>
              preview.mutate({
                symbol,
                quantity,
                assetClass,
                mode,
                policyType,
                preferredVenueId: preferredVenueId || undefined,
              })
            }
          >
            Preview route
          </Button>
        </div>
      </InfoCard>
      <div>
        {preview.data ? (
          <PreviewView preview={preview.data} />
        ) : (
          <p className="py-8 text-sm text-muted-foreground">
            Configure a request and preview the routing decision.
          </p>
        )}
      </div>
    </div>
  );
}
