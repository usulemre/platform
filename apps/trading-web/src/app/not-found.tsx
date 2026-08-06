import Link from 'next/link';

/** Global 404 page. */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <div className="text-4xl font-bold">404</div>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
