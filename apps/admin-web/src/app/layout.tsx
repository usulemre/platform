import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Admin Console',
  description:
    'Institutional quantitative research platform — administration & AI governance console.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="flex h-14 items-center gap-6 border-b bg-background px-6">
            <span className="text-sm font-semibold">Admin</span>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Overview
              </Link>
              <Link href="/agents" className="hover:text-foreground">
                AI Agents
              </Link>
              <Link href="/connectors" className="hover:text-foreground">
                Connectors
              </Link>
              <Link href="/data-ingestion" className="hover:text-foreground">
                Data Ingestion
              </Link>
              <Link href="/market-data" className="hover:text-foreground">
                Market Data
              </Link>
              <Link href="/risk-engine" className="hover:text-foreground">
                Risk Engine
              </Link>
              <Link href="/execution-simulator" className="hover:text-foreground">
                Execution Simulator
              </Link>
              <Link href="/live-trading" className="hover:text-foreground">
                Live Trading
              </Link>
              <Link href="/performance-analytics" className="hover:text-foreground">
                Performance
              </Link>
              <Link href="/orders" className="hover:text-foreground">
                Orders
              </Link>
              <Link href="/execution" className="hover:text-foreground">
                Execution
              </Link>
              <Link href="/smart-order-router" className="hover:text-foreground">
                Router
              </Link>
              <Link href="/tca" className="hover:text-foreground">
                TCA
              </Link>
              <Link href="/broker-gateway" className="hover:text-foreground">
                Gateway
              </Link>
              <Link href="/users" className="hover:text-foreground">
                Users
              </Link>
              <Link href="/roles" className="hover:text-foreground">
                Roles
              </Link>
              <Link href="/permissions" className="hover:text-foreground">
                Permissions
              </Link>
              <Link href="/audit" className="hover:text-foreground">
                Audit
              </Link>
              <Link href="/notifications" className="hover:text-foreground">
                Notifications
              </Link>
            </nav>
          </header>
          <main className="p-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
