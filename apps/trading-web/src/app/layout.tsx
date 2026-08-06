import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Order Management',
  description:
    'Institutional quantitative research platform — Order Management System (OMS) console.',
};

const NAV: readonly { readonly href: string; readonly label: string }[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/execution', label: 'Execution' },
  { href: '/smart-order-router', label: 'Router' },
  { href: '/tca', label: 'TCA' },
  { href: '/broker-gateway', label: 'Gateway' },
  { href: '/orders/blotter', label: 'Blotter' },
  { href: '/orders/active', label: 'Active' },
  { href: '/orders/completed', label: 'Completed' },
  { href: '/orders/search', label: 'Search' },
  { href: '/orders/timeline', label: 'Timeline' },
  { href: '/orders/replay', label: 'Replay' },
  { href: '/orders/metrics', label: 'Metrics' },
  { href: '/orders/health', label: 'Health' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="flex h-14 items-center gap-6 border-b bg-background px-6">
            <span className="text-sm font-semibold">Orders</span>
            <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="p-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
