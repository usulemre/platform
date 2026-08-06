import type { Metadata } from 'next';
import { ConnectorDashboard, ConnectorRegistry } from '@/modules/connector';

export const metadata: Metadata = {
  title: 'Connectors · Admin',
};

/** Connector Management Platform — Dashboard + Registry (Server Component). The
 *  interactive parts are Client Components that fetch through the application
 *  service. */
export default function ConnectorsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Connector Management</h1>
        <p className="max-w-prose text-muted-foreground">
          The canonical integration layer for every external provider used by research, datasets,
          market data, execution, monitoring and AI agents. This console manages connector
          abstractions and governed metadata — it never communicates with external APIs and holds no
          secrets.
        </p>
      </div>
      <ConnectorDashboard />
      <ConnectorRegistry />
    </div>
  );
}
