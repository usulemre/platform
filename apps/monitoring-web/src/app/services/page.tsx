import type { Metadata } from 'next';
import { ServiceListView } from '@/modules/monitoring';

export const metadata: Metadata = {
  title: 'Service health · Monitoring',
};

/** Service Health page (Server Component) — full searchable/filterable/sortable
 *  service list. The interactive list is a Client Component. */
export default function ServicesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Service health</h1>
      <ServiceListView />
    </div>
  );
}
