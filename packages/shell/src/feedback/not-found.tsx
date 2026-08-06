import Link from 'next/link';
import { Button } from '@platform/ui';

export interface NotFoundProps {
  title?: string;
  description?: string;
  homeHref?: string;
}

/** Presentational not-found surface, reused by Next.js `not-found.tsx`. */
export function NotFound({
  title = 'Page not found',
  description = 'The page you are looking for does not exist.',
  homeHref = '/',
}: NotFoundProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="text-4xl font-bold">404</div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      <Button asChild variant="outline" size="sm">
        <Link href={homeHref}>Go home</Link>
      </Button>
    </div>
  );
}
