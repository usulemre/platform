'use client';

import { Check, Minus } from 'lucide-react';
import { useCapabilityMatrix, useProviders } from '../hooks/use-gateway';
import { InfoCard, StatusBadge, GatewayLoading } from './gateway-atoms';

/** Capability Explorer — the provider registry and the provider × capability contract matrix. */
export function CapabilityExplorer() {
  const providers = useProviders();
  const matrix = useCapabilityMatrix();
  if (providers.isLoading || !providers.data || matrix.isLoading || !matrix.data)
    return <GatewayLoading rows={8} />;

  return (
    <div className="space-y-4">
      <InfoCard title="Providers">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Provider</th>
                <th className="px-3 py-1.5 text-left font-medium">Kind</th>
                <th className="px-3 py-1.5 text-left font-medium">Transport</th>
                <th className="px-3 py-1.5 text-left font-medium">Asset classes</th>
                <th className="px-3 py-1.5 text-right font-medium">Capabilities</th>
                <th className="px-3 py-1.5 text-right font-medium">Brokers</th>
                <th className="px-3 py-1.5 text-left font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {providers.data.map((p) => (
                <tr key={p.id} className="border-t hover:bg-accent/40">
                  <td className="px-3 py-1 font-medium">{p.name}</td>
                  <td className="px-3 py-1 text-xs">{p.kind}</td>
                  <td className="px-3 py-1 text-xs">{p.transport}</td>
                  <td className="px-3 py-1 text-xs text-muted-foreground">
                    {p.assetClasses.join(', ')}
                  </td>
                  <td className="px-3 py-1 text-right font-mono">{p.capabilityCount}</td>
                  <td className="px-3 py-1 text-right font-mono">{p.registeredBrokers}</td>
                  <td className="px-3 py-1">
                    <StatusBadge
                      label={p.placeholder ? 'Placeholder' : 'Live'}
                      tone={p.placeholder ? 'warning' : 'positive'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoCard>

      <InfoCard title="Capability matrix">
        <p className="mb-3 text-sm text-muted-foreground">
          Which provider declares which capability contract. Contracts only — no transport is
          implemented in v1.
        </p>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="sticky left-0 bg-muted/50 px-3 py-1.5 text-left font-medium">
                  Capability
                </th>
                {providers.data.map((p) => (
                  <th key={p.id} className="px-2 py-1.5 text-center text-xs font-medium">
                    {p.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.data.map((row) => (
                <tr key={row.capability} className="border-t">
                  <td className="sticky left-0 bg-background px-3 py-1 font-medium">
                    {row.label}
                    <span className="ml-2 text-xs text-muted-foreground">{row.domain}</span>
                  </td>
                  {row.providers.map((cell) => (
                    <td key={cell.providerId} className="px-2 py-1 text-center">
                      {cell.supported ? (
                        <Check
                          className="mx-auto h-4 w-4 text-emerald-600"
                          aria-label="supported"
                        />
                      ) : (
                        <Minus
                          className="mx-auto h-4 w-4 text-muted-foreground"
                          aria-label="not supported"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoCard>
    </div>
  );
}
