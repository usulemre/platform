import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Monitoring Console',
  description:
    'Institutional quantitative research platform — production monitoring console (shell).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="flex h-14 items-center gap-6 border-b bg-background px-6">
            <span className="text-sm font-semibold">Monitoring</span>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/services" className="hover:text-foreground">
                Services
              </Link>
              <Link href="/live-trading" className="hover:text-foreground">
                Live Trading
              </Link>
            </nav>
          </header>
          <main className="p-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
