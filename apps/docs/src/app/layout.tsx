import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Platform Docs',
  description: 'Institutional quantitative research platform — documentation portal (shell).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
