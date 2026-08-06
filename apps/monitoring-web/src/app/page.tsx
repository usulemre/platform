import { MonitoringDashboard } from '@/modules/monitoring';

/** Monitoring Dashboard page (Server Component). The dashboard sections are
 *  Client Components that fetch operational data through the application service. */
export default function MonitoringHomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Platform monitoring</h1>
        <p className="max-w-prose text-muted-foreground">
          Centralized, read-only visibility into platform health, services, workflows, execution,
          validation, datasets, agents, alerts and incidents. It consumes operational data exposed
          by the platform services — it never decides and contains no business logic.
        </p>
      </div>
      <MonitoringDashboard />
    </div>
  );
}
