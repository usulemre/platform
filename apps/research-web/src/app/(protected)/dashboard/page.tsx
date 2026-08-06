import { DashboardOverview } from './dashboard-overview';

/** Protected landing (Server Component). Authentication surface only — no
 *  business modules are implemented in Phase 4.1. */
export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="max-w-prose text-muted-foreground">
        You are authenticated. Business modules are not implemented yet — Phase 4.1 delivers the
        authentication surface only. All actions will resolve through governed service APIs.
      </p>
      <DashboardOverview />
    </div>
  );
}
