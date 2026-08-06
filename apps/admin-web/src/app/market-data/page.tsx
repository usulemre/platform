import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketDataDashboard } from '@/modules/market-data';

export const metadata: Metadata = { title: 'Market Data · Admin' };

const LINKS = [
  { href: '/market-data/symbols', label: 'Symbols' },
  { href: '/market-data/exchanges', label: 'Exchanges' },
  { href: '/market-data/assets', label: 'Assets' },
  { href: '/market-data/datasets', label: 'Datasets' },
  { href: '/market-data/calendar', label: 'Calendar' },
  { href: '/market-data/catalog', label: 'Catalog' },
];

/** Market Data Platform — Dashboard + section links (Server Component). */
export default function MarketDataPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Market Data</h1>
          <p className="max-w-prose text-muted-foreground">
            The single source of truth for market data — a unified, normalized, versioned view over
            canonical datasets from the Data Ingestion Pipeline.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Market data sections">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md border px-3 py-1.5 hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <MarketDataDashboard />
    </div>
  );
}
